import { createHmac } from 'crypto';

/**
 * Server-only. Mirrors the server's signAgentRequest:
 *   hex( HMAC-SHA256(secret, `${timestamp}.${rawBody}`) )
 */
export function signAgentRequest(secret: string, timestamp: string, rawBody: string): string {
  return createHmac('sha256', secret).update(`${timestamp}.`).update(rawBody).digest('hex');
}
