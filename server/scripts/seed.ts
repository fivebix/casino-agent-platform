import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';
import { encryptSecret } from '../src/common/secret-cipher';
import { ENTITIES, Tenant } from '../src/entities';

loadEnv();

/**
 * Creates a demo operator (tenant) with known API credentials so the signed
 * inbound API can be called locally. Prints the credentials to copy into a client.
 *
 *   npx ts-node scripts/seed.ts
 */
async function main(): Promise<void> {
  const operatorId = process.env.SEED_OPERATOR_ID ?? 'demo-operator';
  const apiKey = process.env.SEED_API_KEY ?? 'demo-api-key';
  const signingSecret = process.env.SEED_SIGNING_SECRET ?? 'demo-signing-secret';
  const keyHex = process.env.CREDENTIALS_KEY;
  if (!keyHex) throw new Error('CREDENTIALS_KEY is not set');

  const ds = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    entities: ENTITIES,
    synchronize: false,
  });
  await ds.initialize();

  const repo = ds.getRepository(Tenant);
  let tenant = await repo.findOneBy({ operatorId });
  const credentialsEnc = encryptSecret(JSON.stringify({ apiKey, signingSecret }), keyHex);
  if (tenant) {
    tenant.credentialsEnc = credentialsEnc;
    tenant.platformUrl = process.env.SEED_PLATFORM_URL ?? tenant.platformUrl ?? 'http://localhost:3000';
    await repo.save(tenant);
    console.log(`Updated existing tenant ${tenant.id}`);
  } else {
    tenant = await repo.save({
      operatorId,
      name: process.env.SEED_OPERATOR_NAME ?? 'Demo Operator',
      platformUrl: process.env.SEED_PLATFORM_URL ?? 'http://localhost:3000',
      credentialsEnc,
      timeZone: 'Asia/Jerusalem',
    });
    console.log(`Created tenant ${tenant.id}`);
  }

  console.log('\nUse these headers when calling the inbound API:');
  console.log(`  X-Operator-Id:  ${operatorId}`);
  console.log(`  X-Api-Key:      ${apiKey}`);
  console.log(`  Signing secret: ${signingSecret}  (for X-Signature = HMAC-SHA256(secret, "<ts>.<rawBody>"))`);

  await ds.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
