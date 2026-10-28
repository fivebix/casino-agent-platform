import { DataSource, EntityManager } from 'typeorm';
import { DomainError } from '../common/domain-error';
import { assertGrant, CreditRuleError, fromCents, validAmountCents } from '../domain/credit-rules';
import { Agent, LedgerEntry, Player } from '../entities';
import { PlatformApi, PlatformCredentials, PlatformError } from '../platform/platform.client';

export interface PlayerMoveResult {
  playerId: string;
  status: 'completed' | 'pending';
  balance: number | null;
}

type Kind = 'player_credit' | 'player_withdraw';

/**
 * Credit to or from a player's wallet on the platform. The platform holds the
 * money, we hold the agent's credit, so every move is an outbox:
 *   credit:   reserve the agent's credit (pending row) -> call platform -> complete,
 *             or give the credit back if the platform says no.
 *   withdraw: pending row -> call platform -> add to the agent only after it succeeds.
 * A crash or timeout leaves the row pending; retryPending() replays it with the
 * same idempotency key, which the platform answers without moving money twice.
 */
export class PlayerMoneyService {
  constructor(
    private readonly ds: DataSource,
    private readonly platform: PlatformApi,
    private readonly credentials: (tenantId: string) => Promise<PlatformCredentials>,
  ) {}

  credit(agent: Agent, tenantId: string, platformPlayerId: string, amount: number, key: string, comment?: string) {
    return this.start('player_credit', agent, tenantId, platformPlayerId, amount, key, comment);
  }

  withdraw(agent: Agent, tenantId: string, platformPlayerId: string, amount: number, key: string, comment?: string) {
    return this.start('player_withdraw', agent, tenantId, platformPlayerId, amount, key, comment);
  }

  /** Replays moves that never got an answer. Safe to run often. */
  async retryPending(olderThanMs = 30_000, now = Date.now()): Promise<number> {
    const rows = await this.ds.getRepository(LedgerEntry).find({
      where: { status: 'pending' },
      order: { createdAt: 'ASC' },
      take: 100,
    });
    let settled = 0;
    for (const row of rows) {
      if (now - row.createdAt.getTime() < olderThanMs) continue;
      if (row.type !== 'player_credit' && row.type !== 'player_withdraw') continue;
      const res = await this.drive(row);
      if (res.status === 'completed') settled++;
    }
    return settled;
  }

  private async start(kind: Kind, agent: Agent, tenantId: string, platformPlayerId: string, amount: number, key: string, comment?: string): Promise<PlayerMoveResult> {
    const repo = this.ds.getRepository(LedgerEntry);
    const existing = await repo.findOneBy({ tenantId, idempotencyKey: key, type: kind });
    if (existing) {
      if (existing.agentId !== agent.id || existing.platformPlayerId !== platformPlayerId || Math.abs(existing.amount) !== amount) {
        throw new DomainError('IDEMPOTENCY_CONFLICT');
      }
      return existing.status === 'pending' ? this.drive(existing) : this.result(existing);
    }

    let cents: number;
    try {
      cents = kind === 'player_credit' ? assertGrant({ amount, giverBalance: agent.balance }) : validAmountCents(amount);
    } catch (e) {
      throw e instanceof CreditRuleError ? Object.assign(new Error(e.code), { code: e.code }) : e;
    }

    const row = await this.ds.transaction(async (m) => {
      const [locked] = await m.getRepository(Agent).createQueryBuilder('a').setLock('pessimistic_write').where('a.id = :id', { id: agent.id }).getMany();
      if (!locked || locked.status !== 'active') throw new DomainError('AGENT_BLOCKED');
      const player = await m.findOneBy(Player, { tenantId, platformPlayerId });
      if (!player || player.agentId !== locked.id) throw new DomainError('FORBIDDEN');

      let balanceAfter: number | null = null;
      if (kind === 'player_credit') {
        // Re-check against the locked row: reserve now so two moves cannot overspend.
        if (cents > Math.round(locked.balance * 100)) throw Object.assign(new Error('INSUFFICIENT_CREDIT'), { code: 'INSUFFICIENT_CREDIT' });
        locked.balance = fromCents(Math.round(locked.balance * 100) - cents);
        await m.save(Agent, locked);
        balanceAfter = locked.balance;
      }
      return m.save(LedgerEntry, {
        tenantId,
        agentId: locked.id,
        type: kind,
        amount: kind === 'player_credit' ? -fromCents(cents) : fromCents(cents),
        balanceAfter,
        platformPlayerId,
        idempotencyKey: key,
        comment: comment ?? null,
        status: 'pending',
      });
    });
    return this.drive(row);
  }

  /** Calls the platform for a pending row and settles it. */
  private async drive(row: LedgerEntry): Promise<PlayerMoveResult> {
    const creds = await this.credentials(row.tenantId);
    const body = { agentId: row.agentId, amount: Math.abs(row.amount), comment: row.comment ?? undefined };
    try {
      const out =
        row.type === 'player_credit'
          ? await this.platform.credit(creds, row.platformPlayerId!, body, row.idempotencyKey!)
          : await this.platform.withdraw(creds, row.platformPlayerId!, body, row.idempotencyKey!);
      return this.result(await this.complete(row, out.balance));
    } catch (e) {
      if (!(e instanceof PlatformError)) throw e;
      if (e.retryable) return { playerId: row.platformPlayerId!, status: 'pending', balance: null };
      await this.fail(row, e.message);
      throw new DomainError('PLATFORM_ERROR', e.message);
    }
  }

  private complete(row: LedgerEntry, platformBalance: number): Promise<LedgerEntry> {
    return this.ds.transaction(async (m) => {
      const fresh = await m.findOneByOrFail(LedgerEntry, { id: row.id });
      if (fresh.status !== 'pending') return fresh;
      fresh.platformBalance = platformBalance;
      fresh.status = 'completed';
      if (fresh.type === 'player_withdraw') {
        const agent = await this.lockAgent(m, fresh.agentId);
        agent.balance = fromCents(Math.round(agent.balance * 100) + Math.round(fresh.amount * 100));
        await m.save(Agent, agent);
        fresh.balanceAfter = agent.balance;
      }
      return m.save(LedgerEntry, fresh);
    });
  }

  private fail(row: LedgerEntry, error: string): Promise<void> {
    return this.ds.transaction(async (m) => {
      const fresh = await m.findOneByOrFail(LedgerEntry, { id: row.id });
      if (fresh.status !== 'pending') return;
      fresh.status = 'failed';
      fresh.error = error.slice(0, 250);
      await m.save(LedgerEntry, fresh);
      if (fresh.type === 'player_credit') {
        const agent = await this.lockAgent(m, fresh.agentId);
        const back = Math.abs(fresh.amount);
        agent.balance = fromCents(Math.round(agent.balance * 100) + Math.round(back * 100));
        await m.save(Agent, agent);
        await m.save(LedgerEntry, {
          tenantId: fresh.tenantId,
          agentId: agent.id,
          type: 'reversal',
          amount: back,
          balanceAfter: agent.balance,
          platformPlayerId: fresh.platformPlayerId,
          idempotencyKey: fresh.idempotencyKey,
          comment: `reversal of ${fresh.id}`,
          status: 'completed',
        });
      }
    });
  }

  private async lockAgent(m: EntityManager, id: string): Promise<Agent> {
    const [a] = await m.getRepository(Agent).createQueryBuilder('a').setLock('pessimistic_write').where('a.id = :id', { id }).getMany();
    return a;
  }

  private result(row: LedgerEntry): PlayerMoveResult {
    return { playerId: row.platformPlayerId!, status: row.status === 'completed' ? 'completed' : 'pending', balance: row.platformBalance ?? null };
  }
}
