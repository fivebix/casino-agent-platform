import { createHmac, timingSafeEqual } from 'crypto';

export const AGENT_MAX_SKEW_SECONDS = 300;

export function signAgentRequest(
  secret: string,
  timestamp: string,
  rawBody: string | Buffer,
): string {
  return createHmac('sha256', secret)
    .update(`${timestamp}.`)
    .update(rawBody)
    .digest('hex');
}

export function isFreshTimestamp(
  timestamp: string,
  nowMs: number = Date.now(),
): boolean {
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  return Math.abs(nowMs / 1000 - ts) <= AGENT_MAX_SKEW_SECONDS;
}

export function verifyAgentSignature(
  secret: string,
  timestamp: string,
  rawBody: string | Buffer,
  signature: string,
): boolean {
  const expected = Buffer.from(
    signAgentRequest(secret, timestamp, rawBody),
    'hex',
  );
  let given: Buffer;
  try {
    given = Buffer.from(signature, 'hex');
  } catch {
    return false;
  }
  return given.length === expected.length && timingSafeEqual(given, expected);
}
