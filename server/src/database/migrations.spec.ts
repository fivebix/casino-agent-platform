import { randomUUID } from 'crypto';
import { DataType, newDb } from 'pg-mem';
import { DataSource } from 'typeorm';
import { Agent, ENTITIES, Tenant } from '../entities';
import { InitialSchema1761600000000 } from './migrations/1761600000000-initial-schema';

describe('migrations', () => {
  it('create every table the entities describe, and revert cleanly', async () => {
    const db = newDb();
    db.public.registerFunction({ name: 'current_database', returns: DataType.text, implementation: () => 't' });
    db.public.registerFunction({ name: 'version', returns: DataType.text, implementation: () => 'pg-mem' });
    db.public.registerFunction({ name: 'gen_random_uuid', returns: DataType.uuid, implementation: () => randomUUID(), impure: true });
    db.registerExtension('pgcrypto', () => undefined);
    const ds: DataSource = await db.adapters.createTypeormDataSource({
      type: 'postgres',
      entities: ENTITIES,
      migrations: [InitialSchema1761600000000],
      uuidExtension: 'pgcrypto',
      synchronize: false,
    });
    await ds.initialize();
    await ds.runMigrations();

    const names = ds.entityMetadatas.map((m) => m.tableName);
    const existing = async () =>
      (
        await ds.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
      ).map((r: { table_name: string }) => r.table_name);
    for (const t of names) expect(await existing()).toContain(t);

    // Columns line up: an insert through the entity metadata works against the migrated schema.
    const tenant = await ds.getRepository(Tenant).save({ operatorId: 'o', name: 'n' });
    await ds.getRepository(Agent).save({ tenantId: tenant.id, path: '/a/', username: 'u', passwordHash: 'h' });

    await ds.undoLastMigration();
    for (const t of names) expect(await existing()).not.toContain(t);
    await ds.destroy();
  });
});
