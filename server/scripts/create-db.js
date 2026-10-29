// One-off: create the target database if it does not exist. Connects to the
// server's default "postgres" database using the same credentials as the app.
require('dotenv').config();
const { Client } = require('pg');

(async () => {
  const name = process.env.DB_NAME || 'agent_platform';
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: 'postgres',
  });
  await client.connect();
  const { rowCount } = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [name]);
  if (rowCount === 0) {
    await client.query(`CREATE DATABASE "${name}"`);
    console.log(`Created database ${name}`);
  } else {
    console.log(`Database ${name} already exists`);
  }
  await client.end();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
