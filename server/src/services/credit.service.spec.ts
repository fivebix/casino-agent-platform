import { DataSource } from 'typeorm';
import { createTestDataSource } from '../database/test-db';
import { Agent, LedgerEntry, Tenant } from '../entities';
import { Actor } from './actor';
import { AgentsService } from './agents.service';
import { CreditService } from './credit.service';

describe('CreditService', () => {
  let ds: DataSource;
  let agents: AgentsService;
  let credit: CreditService;
  let tenantId: string;
  const tenantActor: Actor = { kind: 'tenant' };

  beforeEach(async () => {
    ds = await createTestDataSource();
    agents = new AgentsService(ds, 4);
    credit = new CreditService(ds);
    tenantId = (await ds.getRepository(Tenant).save({ operatorId: 'op', name: 'Op', creditLimit: 1000 })).id;
  });
  afterEach(() => ds.destroy());

  const mk = (actor: Actor, username: string, parentId?: string) =>
    agents.createAgent(actor, { tenantId, username, tempPassword: '1', parentId });
  const act = (agent: Agent): Actor => ({ kind: 'agent', agent });
  const bal = async (id: string) => (await ds.getRepository(Agent).findOneByOrFail({ id })).balance;

  it('the tenant funds a top-level agent, who passes credit down; every move is in the ledger', async () => {
    const top = await mk(tenantActor, 'top');
    await credit.grant(tenantActor, tenantId, top.id, 500, 'k1');
    const child = await mk(act(top), 'child');
    const r = await credit.grant(act(await ds.getRepository(Agent).findOneByOrFail({ id: top.id })), tenantId, child.id, 120.5, 'k2', 'week start');
    expect(r.balance).toBe(120.5);
    expect(await bal(top.id)).toBe(379.5);

    const rows = await ds.getRepository(LedgerEntry).find({ where: { tenantId }, order: { createdAt: 'ASC' } });
    expect(rows.map((x) => [x.type, x.amount])).toEqual(
      expect.arrayContaining([['tenant_grant', 500], ['grant_out', -120.5], ['grant_in', 120.5]]),
    );
    // Total credit is conserved below the tenant: 379.5 + 120.5 = 500.
    expect((await bal(top.id)) + (await bal(child.id))).toBe(500);
  });

  it('refuses to give more than the giver holds or more than the tenant limit', async () => {
    const top = await mk(tenantActor, 'top');
    await expect(credit.grant(tenantActor, tenantId, top.id, 1001, 'k1')).rejects.toMatchObject({ code: 'TENANT_LIMIT_EXCEEDED' });
    await credit.grant(tenantActor, tenantId, top.id, 100, 'k2');
    const child = await mk(act(top), 'child');
    await expect(credit.grant(act(await ds.getRepository(Agent).findOneByOrFail({ id: top.id })), tenantId, child.id, 100.01, 'k3')).rejects.toMatchObject({ code: 'INSUFFICIENT_CREDIT' });
    expect(await bal(top.id)).toBe(100);
    expect(await bal(child.id)).toBe(0);
  });

  it('only a direct parent can move credit, not a grandparent or a stranger', async () => {
    const top = await mk(tenantActor, 'top');
    await credit.grant(tenantActor, tenantId, top.id, 100, 'k1');
    const mid = await mk(act(top), 'mid');
    const low = await mk(act(mid), 'low');
    const topNow = await ds.getRepository(Agent).findOneByOrFail({ id: top.id });
    await expect(credit.grant(act(topNow), tenantId, low.id, 10, 'k2')).rejects.toMatchObject({ code: 'NOT_A_DIRECT_CHILD' });
    await expect(credit.grant(tenantActor, tenantId, mid.id, 10, 'k3')).rejects.toMatchObject({ code: 'NOT_A_DIRECT_CHILD' });
  });

  it('withdraw returns credit to the giver and cannot take more than the child holds', async () => {
    const top = await mk(tenantActor, 'top');
    await credit.grant(tenantActor, tenantId, top.id, 100, 'k1');
    const child = await mk(act(top), 'child');
    const topNow = () => ds.getRepository(Agent).findOneByOrFail({ id: top.id }).then(act);
    await credit.grant(await topNow(), tenantId, child.id, 60, 'k2');
    await expect(credit.withdraw(await topNow(), tenantId, child.id, 60.01, 'k3')).rejects.toMatchObject({ code: 'NOTHING_TO_WITHDRAW' });
    await credit.withdraw(await topNow(), tenantId, child.id, 25, 'k4');
    expect(await bal(child.id)).toBe(35);
    expect(await bal(top.id)).toBe(65);
  });

  it('tenant withdraw frees up limit', async () => {
    const top = await mk(tenantActor, 'top');
    await credit.grant(tenantActor, tenantId, top.id, 900, 'k1');
    await credit.withdraw(tenantActor, tenantId, top.id, 400, 'k2');
    await credit.grant(tenantActor, tenantId, top.id, 500, 'k3'); // 500 + 500 = 1000, exactly the limit
    expect((await ds.getRepository(Tenant).findOneByOrFail({ id: tenantId })).issuedCredit).toBe(1000);
  });

  it('a retried request with the same key is applied once', async () => {
    const top = await mk(tenantActor, 'top');
    const a = await credit.grant(tenantActor, tenantId, top.id, 50, 'same');
    const b = await credit.grant(tenantActor, tenantId, top.id, 50, 'same');
    expect(b).toEqual(a);
    expect(await bal(top.id)).toBe(50);
    await expect(credit.grant(tenantActor, tenantId, top.id, 70, 'same')).rejects.toMatchObject({ code: 'IDEMPOTENCY_CONFLICT' });
  });

  it('a failed move leaves balances and the ledger untouched, and the key reusable', async () => {
    const top = await mk(tenantActor, 'top');
    await credit.grant(tenantActor, tenantId, top.id, 10, 'k1');
    const child = await mk(act(top), 'child');
    const topNow = await ds.getRepository(Agent).findOneByOrFail({ id: top.id });
    await expect(credit.grant(act(topNow), tenantId, child.id, 999, 'retry-me')).rejects.toMatchObject({ code: 'INSUFFICIENT_CREDIT' });
    expect(await ds.getRepository(LedgerEntry).countBy({ agentId: child.id })).toBe(0);
    const ok = await credit.grant(act(topNow), tenantId, child.id, 4, 'retry-me');
    expect(ok.balance).toBe(4);
  });
});
