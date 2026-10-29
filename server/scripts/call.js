// Signed API caller for manual testing.
//   node scripts/call.js <METHOD> <path> [jsonBody] [idempotencyKey]
// Example:
//   node scripts/call.js POST /v1/tenants/demo-operator/agents '{"username":"mgr1","tempPassword":"Temp123!","creditLimit":1000}' k-mgr1
require('dotenv').config();
const crypto = require('crypto');

const BASE = `http://localhost:${process.env.PORT || 4100}`;
const operatorId = process.env.SEED_OPERATOR_ID || 'demo-operator';
const apiKey = process.env.SEED_API_KEY || 'demo-api-key';
const secret = process.env.SEED_SIGNING_SECRET || 'demo-signing-secret';

const [, , method = 'GET', path = '/health', body, key] = process.argv;
const raw = body ?? '';
const ts = String(Math.floor(Date.now() / 1000));
const signature = crypto.createHmac('sha256', secret).update(`${ts}.`).update(raw).digest('hex');

const headers = {
  'x-operator-id': operatorId,
  'x-api-key': apiKey,
  'x-timestamp': ts,
  'x-signature': signature,
};
if (raw) headers['content-type'] = 'application/json';
if (key) headers['idempotency-key'] = key;

(async () => {
  const res = await fetch(`${BASE}${path}`, { method, headers, body: raw || undefined });
  const text = await res.text();
  console.log(`${method} ${path} -> ${res.status}`);
  console.log(text);
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
