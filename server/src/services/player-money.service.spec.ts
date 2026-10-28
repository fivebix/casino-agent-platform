import { DataSource } from 'typeorm';
import { createTestDataSource } from '../database/test-db';
import { Agent, LedgerEntry, Player, Tenant } from '../entities';
import { PlatformApi, PlatformCredentials, PlatformError } from '../platform/platform.client';
import { PlayerMoneyService } from './player-money.service';

const creds: PlatformCredentials = { platformUrl: 'https://p', operatorId: 'op', apiKey: 'k', signingSecret: 's' };

function fakePlatform(script: Array<'ok' | 'net' | '422' | '503'>) {
  const calls: { kind: string; key: string; amount: number }[] = [];
  let wallet = 0;
  const run = (kind: 'credit' | 'withdraw') => async (_c: PlatformCredentials, playerId: string, body: { amount: number }, key: string) => {
    calls.push({ kind, key, amount: body.amount });
    const step = script.shift() ?? 'ok';
    if (step === 'net') throw new PlatformError('timeout', null, true);
    if (step === '503') throw new PlatformError('Platform responded 503', 503, true);
    if (step === '422') throw new PlatformError('Platform responded 422', 422, false);
    wallet += kind === 'credit' ? body.amount : -body.amount;
    return { playerId, balance: wallet };
  };
  const api = { credit: run('credit'), withdraw: run('withdraw') } as unknown as PlatformApi;
  return { api, calls };
}

describe('PlayerMoneyService', () => {
  let ds: DataSource;
  let tenantId: string;
  let agent: Agent;

  beforeEach(async () => {
    ds = await createTestDataSource();
    tenantId = (await ds.getRepository(Tenant).save({ operatorId: 'op', name: 'Op' })).id;
    agent = await ds.getRepository(Agent).save({ tenantId, path: '/a/', username: 'a', passwordHash: 'h', balance: 100 });
    await ds.getRepository(Player).save({ tenantId, platformPlayerId: 'p1', agentId: agent.id, agentPath: '/a/' });
  });
  afterEach(() => ds.destroy());

  const svc = (api: PlatformApi) => new PlayerMoneyService(ds, api, async () => creds);
  const agentBal = async () => (await ds.getRepository(Agent).findOneByOrFail({ id: agent.id })).balance;

  it('credit: reserves the agent credit, calls the platform once, completes', async () => {
    const { api, calls } = fakePlatform(['ok']);
    const r = await svc(api).credit(agent, tenantId, 'p1', 40, 'k1', 'cash in');
    expect(r).toEqual({ playerId: 'p1', status: 'completed', balance: 40 });
    expect(await agentBal()).toBe(60);
    expect(calls).toEqual([{ kind: 'credit', key: 'k1', amount: 40 }]);
  });

  it('credit: a final platform refusal gives the credit back and writes a reversal', async () => {
    const { api } = fakePlatform(['422']);
    await expect(svc(api).credit(agent, tenantId, 'p1', 40, 'k1')).rejects.toMatchObject({ code: 'PLATFORM_ERROR' });
    expect(await agentBal()).toBe(100);
    const types = (await ds.getRepository(LedgerEntry).find({ where: { tenantId } })).map((r) => `${r.type}:${r.status}`).sort();
    expect(types).toEqual(['player_credit:failed', 'reversal:completed']);
  });

  it('credit: a timeout leaves it pending with the credit reserved; the retry job completes it with the SAME key', async () => {
    const { api, calls } = fakePlatform(['net', 'ok']);
    const s = svc(api);
    const first = await s.credit(agent, tenantId, 'p1', 40, 'k1');
    expect(first).toEqual({ playerId: 'p1', status: 'pending', balance: null });
    expect(await agentBal()).toBe(60); // reserved, not spent twice

    expect(await s.retryPending(0)).toBe(1);
    expect(calls.map((c) => c.key)).toEqual(['k1', 'k1']);
    expect(await agentBal()).toBe(60);
    const row = await ds.getRepository(LedgerEntry).findOneByOrFail({ tenantId, type: 'player_credit' });
    expect(row.status).toBe('completed');
    expect(row.platformBalance).toBe(40);
  });

  it('credit: resubmitting the same key never double-reserves', async () => {
    const { api, calls } = fakePlatform(['ok']);
    const s = svc(api);
    await s.credit(agent, tenantId, 'p1', 40, 'k1');
    const again = await s.credit(agent, tenantId, 'p1', 40, 'k1');
    expect(again.status).toBe('completed');
    expect(calls).toHaveLength(1);
    expect(await agentBal()).toBe(60);
    await expect(s.credit(agent, tenantId, 'p1', 41, 'k1')).rejects.toMatchObject({ code: 'IDEMPOTENCY_CONFLICT' });
  });

  it('credit: cannot exceed the agent balance, and only the owning agent can credit a player', async () => {
    const { api, calls } = fakePlatform([]);
    const s = svc(api);
    await expect(s.credit(agent, tenantId, 'p1', 100.01, 'k1')).rejects.toMatchObject({ code: 'INSUFFICIENT_CREDIT' });
    const other = await ds.getRepository(Agent).save({ tenantId, path: '/b/', username: 'b', passwordHash: 'h', balance: 100 });
    await expect(s.credit(other, tenantId, 'p1', 10, 'k2')).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(calls).toHaveLength(0);
    expect(await agentBal()).toBe(100);
  });

  it('withdraw: the agent is credited only after the platform confirms', async () => {
    const { api } = fakePlatform(['503', 'ok']);
    const s = svc(api);
    const first = await s.withdraw(agent, tenantId, 'p1', 30, 'w1');
    expect(first.status).toBe('pending');
    expect(await agentBal()).toBe(100); // nothing added while unconfirmed
    await s.retryPending(0);
    expect(await agentBal()).toBe(130);
  });

  it('withdraw: a final refusal changes nothing', async () => {
    const { api } = fakePlatform(['422']);
    await expect(svc(api).withdraw(agent, tenantId, 'p1', 30, 'w1')).rejects.toMatchObject({ code: 'PLATFORM_ERROR' });
    expect(await agentBal()).toBe(100);
  });
});
