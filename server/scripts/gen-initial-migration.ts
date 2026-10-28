import 'reflect-metadata';
import { randomUUID } from 'crypto';
import { DataType, newDb } from 'pg-mem';
import { ENTITIES } from '../src/entities';
import * as fs from 'fs';

(async () => {
  const db = newDb();
  db.public.registerFunction({ name: 'current_database', returns: DataType.text, implementation: () => 't' });
  db.public.registerFunction({ name: 'version', returns: DataType.text, implementation: () => 'pg-mem' });
  db.public.registerFunction({ name: 'gen_random_uuid', returns: DataType.uuid, implementation: () => randomUUID(), impure: true });
  const ds = await db.adapters.createTypeormDataSource({ type: 'postgres', entities: ENTITIES, uuidExtension: 'pgcrypto', synchronize: false });
  await ds.initialize();
  const log = await ds.driver.createSchemaBuilder().log();
  const esc = (q: string) => '`' + q.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${') + '`';
  const up = log.upQueries.map((q: { query: string }) => `    await queryRunner.query(${esc(q.query)});`).join('\n');
  const down = log.downQueries.reverse().map((q: { query: string }) => `    await queryRunner.query(${esc(q.query)});`).join('\n');
  fs.writeFileSync(
    process.argv[2],
    `import { MigrationInterface, QueryRunner } from 'typeorm';\n\nexport class InitialSchema1761600000000 implements MigrationInterface {\n  name = 'InitialSchema1761600000000';\n\n  public async up(queryRunner: QueryRunner): Promise<void> {\n    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');\n${up}\n  }\n\n  public async down(queryRunner: QueryRunner): Promise<void> {\n${down}\n  }\n}\n`,
  );
  console.log('queries:', log.upQueries.length);
})();
