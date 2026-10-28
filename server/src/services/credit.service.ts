import { DataSource, EntityManager } from 'typeorm';
import { DomainError } from '../common/domain-error';
import { assertGrant, assertWithdraw, CreditRuleError, fromCents } from '../domain/credit-rules';
import { Agent, LedgerEntry, Tenant } from '../entities';
import { Actor } from './actor';
import { IdempotencyService } from './idempotency.service';

export interface CreditResult extends Record<string, unknown> {
  agentId: string;
  balance: number;
}

/** Credit handed down the tree. Internal ledger only; players are in PlayerMoneyService. */
export class CreditService {
  private readonly idempotency: IdempotencyService;

  constructor(private readonly ds: DataSource) {
    this.idempotency = new IdempotencyService(ds);
  }

  /** The giver (an agent, or the tenant for a top-level agent) hands credit to a direct child. */
  grant(actor: Actor, tenantId: string, toAgentId: string, amount: number, key: string, comment?: string): Promise<CreditResult> {
    return this.idempotency.run(tenantId, key, { op: 'grant', toAgentId, amount, comment }, () =>
      this.ds.transaction(async (m) => {
        const { receiver, giver, tenant } = await this.lockParties(m, actor, tenantId, toAgentId);
        let cents: number;
        try {
          cents = assertGrant({
            amount,
            giverBalance: giver ? giver.balance : undefined,
            tenantIssued: tenant?.issuedCredit,
            tenantLimit: tenant?.creditLimit,
          });
        } catch (e) {
          throw this.translate(e);
        }
        const value = fromCents(cents);

        if (giver) {
          giver.balance = fromCents(Math.round(giver.balance * 100) - cents);
          await m.save(Agent, giver);
          await this.entry(m, { tenantId, agentId: giver.id, type: 'grant_out', amount: -value, balanceAfter: giver.balance, counterpartyAgentId: receiver.id, key, comment });
        } else if (tenant) {
          tenant.issuedCredit = fromCents(Math.round(tenant.issuedCredit * 100) + cents);
          await m.save(Tenant, tenant);
        }
        receiver.balance = fromCents(Math.round(receiver.balance * 100) + cents);
        await m.save(Agent, receiver);
        await this.entry(m, { tenantId, agentId: receiver.id, type: giver ? 'grant_in' : 'tenant_grant', amount: value, balanceAfter: receiver.balance, counterpartyAgentId: giver?.id ?? null, key, comment });
        return { agentId: receiver.id, balance: receiver.balance };
      }),
    );
  }

  /** The giver takes credit back from a direct child, up to what the child holds. */
  withdraw(actor: Actor, tenantId: string, fromAgentId: string, amount: number, key: string, comment?: string): Promise<CreditResult> {
    return this.idempotency.run(tenantId, key, { op: 'withdraw', fromAgentId, amount, comment }, () =>
      this.ds.transaction(async (m) => {
        const { receiver: child, giver, tenant } = await this.lockParties(m, actor, tenantId, fromAgentId);
        let cents: number;
        try {
          cents = assertWithdraw({ amount, receiverBalance: child.balance });
        } catch (e) {
          throw this.translate(e);
        }
        const value = fromCents(cents);
        child.balance = fromCents(Math.round(child.balance * 100) - cents);
        await m.save(Agent, child);
        await this.entry(m, { tenantId, agentId: child.id, type: 'withdraw_out', amount: -value, balanceAfter: child.balance, counterpartyAgentId: giver?.id ?? null, key, comment });

        if (giver) {
          giver.balance = fromCents(Math.round(giver.balance * 100) + cents);
          await m.save(Agent, giver);
          await this.entry(m, { tenantId, agentId: giver.id, type: 'withdraw_in', amount: value, balanceAfter: giver.balance, counterpartyAgentId: child.id, key, comment });
        } else if (tenant) {
          tenant.issuedCredit = fromCents(Math.max(0, Math.round(tenant.issuedCredit * 100) - cents));
          await m.save(Tenant, tenant);
        }
        return { agentId: child.id, balance: child.balance };
      }),
    );
  }

  /**
   * Locks the receiving agent and the giver (if any) in id order, so two moves
   * touching the same pair cannot deadlock, and checks the parent/child link.
   */
  private async lockParties(m: EntityManager, actor: Actor, tenantId: string, childId: string) {
    const peek = await m.findOneBy(Agent, { id: childId, tenantId });
    if (!peek) throw new DomainError('NOT_FOUND');
    const giverId = actor.kind === 'agent' ? actor.agent.id : null;
    if ((peek.parentId ?? null) !== giverId) throw new DomainError('NOT_A_DIRECT_CHILD');
    if (actor.kind === 'agent' && actor.agent.status !== 'active') throw new DomainError('AGENT_BLOCKED');

    const ids = [childId, ...(giverId ? [giverId] : [])].sort();
    const locked = await m
      .getRepository(Agent)
      .createQueryBuilder('a')
      .setLock('pessimistic_write')
      .where('a.id IN (:...ids)', { ids })
      .orderBy('a.id')
      .getMany();
    const byId = new Map(locked.map((a) => [a.id, a]));
    const tenant = giverId ? null : await m.getRepository(Tenant).createQueryBuilder('t').setLock('pessimistic_write').where('t.id = :tenantId', { tenantId }).getOne();
    return { receiver: byId.get(childId)!, giver: giverId ? byId.get(giverId)! : null, tenant };
  }

  private entry(m: EntityManager, e: { tenantId: string; agentId: string; type: LedgerEntry['type']; amount: number; balanceAfter: number; counterpartyAgentId: string | null; key: string; comment?: string }) {
    return m.save(LedgerEntry, {
      tenantId: e.tenantId,
      agentId: e.agentId,
      type: e.type,
      amount: e.amount,
      balanceAfter: e.balanceAfter,
      counterpartyAgentId: e.counterpartyAgentId,
      idempotencyKey: e.key,
      comment: e.comment ?? null,
      status: 'completed',
    });
  }

  private translate(e: unknown): unknown {
    return e instanceof CreditRuleError ? Object.assign(new Error(e.code), { code: e.code }) : e;
  }
}
