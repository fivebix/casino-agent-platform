import { DataSource } from 'typeorm';
import { DomainError } from '../common/domain-error';
import { createTestDataSource } from '../database/test-db';
import { depthOf } from '../domain/agent-path';
import { Tenant } from '../entities';
import { Actor } from './actor';
import { AgentsService } from './agents.service';

describe('AgentsService', () => {
  let ds: DataSource;
  let svc: AgentsService;
  let tenantId: string;
  const tenantActor: Actor = { kind: 'tenant' };

  beforeAll(async () => {
    ds = await createTestDataSource();
    svc = new AgentsService(ds, 4);
    tenantId = (await ds.getRepository(Tenant).save({ operatorId: 'op', name: 'Op' })).id;
  });
  afterAll(() => ds.destroy());

  const make = (actor: Actor, username: string, parentId?: string, extra = {}) =>
    svc.createAgent(actor, { tenantId, username, tempPassword: '1111', parentId, ...extra });

  it('nests agents without a depth limit and stores a hashed temporary password', async () => {
    let parent = await make(tenantActor, 'root');
    expect(parent.passwordHash).not.toBe('1111');
    expect(parent.mustChangePassword).toBe(true);
    for (let i = 0; i < 25; i++) {
      parent = await make({ kind: 'agent', agent: parent }, `deep${i}`);
    }
    expect(depthOf(parent.path)).toBe(26);
  });

  it('an agent can only create below themselves', async () => {
    const a = await make(tenantActor, 'agentA');
    const b = await make(tenantActor, 'agentB');
    const aActor: Actor = { kind: 'agent', agent: a };
    const child = await make(aActor, 'a-child');
    expect(child.parentId).toBe(a.id);
    await expect(make(aActor, 'sneaky', b.id)).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('respects canCreateAgents and blocked status', async () => {
    const leaf = await make(tenantActor, 'leaf', undefined, { canCreateAgents: false });
    await expect(make({ kind: 'agent', agent: leaf }, 'nope')).rejects.toMatchObject({ code: 'CANNOT_CREATE_AGENTS' });
    const boss = await make(tenantActor, 'boss');
    const blocked = await svc.setBlocked(tenantActor, tenantId, boss.id, true);
    await expect(make({ kind: 'agent', agent: blocked }, 'x')).rejects.toMatchObject({ code: 'AGENT_BLOCKED' });
  });

  it('usernames are unique per tenant', async () => {
    await make(tenantActor, 'unique-one');
    await expect(make(tenantActor, 'unique-one')).rejects.toBeInstanceOf(DomainError);
    await expect(make(tenantActor, 'unique-one')).rejects.toMatchObject({ code: 'USERNAME_TAKEN' });
  });

  it('only an ancestor can block someone, and the subtree view is scoped', async () => {
    const top = await make(tenantActor, 'scope-top');
    const mid = await make({ kind: 'agent', agent: top }, 'scope-mid');
    const low = await make({ kind: 'agent', agent: mid }, 'scope-low');
    const other = await make(tenantActor, 'scope-other');

    await expect(svc.setBlocked({ kind: 'agent', agent: low }, tenantId, mid.id, true)).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await expect(svc.setBlocked({ kind: 'agent', agent: top }, tenantId, top.id, true)).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect((await svc.setBlocked({ kind: 'agent', agent: top }, tenantId, low.id, true)).status).toBe('blocked');

    const names = (await svc.subtree({ kind: 'agent', agent: top }, tenantId)).map((a) => a.username);
    expect(names).toEqual(['scope-top', 'scope-mid', 'scope-low']);
    expect(names).not.toContain(other.username);
  });
});
