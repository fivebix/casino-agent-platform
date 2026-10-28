import 'reflect-metadata';
import { randomUUID } from 'crypto';
import { DataType, newDb } from 'pg-mem';
import { DataSource } from 'typeorm';
import { ENTITIES } from '../entities';

/** In-memory Postgres for tests. Schema comes from the entities. */
export async function createTestDataSource(): Promise<DataSource> {
  const db = newDb({ autoCreateForeignKeyIndices: true });
  db.public.registerFunction({ name: 'current_database', returns: DataType.text, implementation: () => 'test' });
  db.public.registerFunction({ name: 'version', returns: DataType.text, implementation: () => 'pg-mem' });
  db.public.registerFunction({ name: 'gen_random_uuid', returns: DataType.uuid, implementation: () => randomUUID(), impure: true });
  const ds: DataSource = await db.adapters.createTypeormDataSource({
    type: 'postgres',
    entities: ENTITIES,
    uuidExtension: 'pgcrypto',
    synchronize: false,
  });
  await ds.initialize();
  await ds.synchronize();
  return ds;
}
