import { DataSource } from 'typeorm';
import { Agent, Tenant } from '../entities';
import { createTestDataSource } from './test-db';

describe('test database', () => {
  let ds: DataSource;
  beforeAll(async () => {
    ds = await createTestDataSource();
  });
  afterAll(() => ds.destroy());

  it('creates the schema and round-trips an agent with numeric money', async () => {
    const tenant = await ds.getRepository(Tenant).save({ operatorId: 'op1', name: 'Op 1', creditLimit: 5000 });
    const agent = await ds.getRepository(Agent).save({
      tenantId: tenant.id,
      path: '/x/',
      username: 'ag1',
      passwordHash: 'h',
      balance: 12.34,
    });
    const found = await ds.getRepository(Agent).findOneByOrFail({ id: agent.id });
    expect(found.balance).toBe(12.34);
    expect(found.status).toBe('active');
    expect((await ds.getRepository(Tenant).findOneByOrFail({ id: tenant.id })).creditLimit).toBe(5000);
  });

  it('enforces the unique username per tenant', async () => {
    const tenant = await ds.getRepository(Tenant).save({ operatorId: 'op2', name: 'Op 2' });
    const mk = () =>
      ds.getRepository(Agent).save({ tenantId: tenant.id, path: '/y/', username: 'dup', passwordHash: 'h' });
    await mk();
    await expect(mk()).rejects.toThrow();
  });
});
