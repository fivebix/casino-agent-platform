import { signAgentRequest } from '../common/signature.util';

export interface PlatformCredentials {
  platformUrl: string;
  operatorId: string;
  apiKey: string;
  signingSecret: string;
}

/** `retryable` is true for network errors, timeouts and 5xx: the call may have landed. */
export class PlatformError extends Error {
  constructor(
    message: string,
    public readonly status: number | null,
    public readonly retryable: boolean,
  ) {
    super(message);
  }
}

export interface WalletResult {
  playerId: string;
  balance: number;
}

export interface PlatformApi {
  credit(c: PlatformCredentials, playerId: string, body: { agentId: string; amount: number; comment?: string }, key: string): Promise<WalletResult>;
  withdraw(c: PlatformCredentials, playerId: string, body: { agentId: string; amount: number; comment?: string }, key: string): Promise<WalletResult>;
  freeze(c: PlatformCredentials, playerId: string, body: { agentId: string; frozen: boolean; comment?: string }, key: string): Promise<Record<string, unknown>>;
  resetWeek(c: PlatformCredentials, weekId: string, key: string): Promise<{ weekId: string; players: { playerId: string; closingBalance: number }[] }>;
  config(c: PlatformCredentials): Promise<Record<string, unknown>>;
}

type Fetch = typeof fetch;

/** Signed calls into the sweepstakes backend's /api/agent-api/v1. */
export class HttpPlatformClient implements PlatformApi {
  constructor(private readonly doFetch: Fetch = fetch, private readonly timeoutMs = 10_000) {}

  credit(c: PlatformCredentials, playerId: string, body: { agentId: string; amount: number; comment?: string }, key: string) {
    return this.send<WalletResult>(c, 'POST', `/players/${playerId}/credit`, body, key);
  }
  withdraw(c: PlatformCredentials, playerId: string, body: { agentId: string; amount: number; comment?: string }, key: string) {
    return this.send<WalletResult>(c, 'POST', `/players/${playerId}/withdraw`, body, key);
  }
  freeze(c: PlatformCredentials, playerId: string, body: { agentId: string; frozen: boolean; comment?: string }, key: string) {
    return this.send<Record<string, unknown>>(c, 'POST', `/players/${playerId}/freeze`, body, key);
  }
  resetWeek(c: PlatformCredentials, weekId: string, key: string) {
    return this.send<{ weekId: string; players: { playerId: string; closingBalance: number }[] }>(c, 'POST', `/weeks/${weekId}/reset`, undefined, key);
  }
  config(c: PlatformCredentials) {
    return this.send<Record<string, unknown>>(c, 'GET', '/config');
  }

  private async send<T>(c: PlatformCredentials, method: 'GET' | 'POST', path: string, body?: unknown, key?: string): Promise<T> {
    const raw = body === undefined ? '' : JSON.stringify(body);
    const ts = String(Math.floor(Date.now() / 1000));
    const headers: Record<string, string> = {
      'x-operator-id': c.operatorId,
      'x-api-key': c.apiKey,
      'x-timestamp': ts,
      'x-signature': signAgentRequest(c.signingSecret, ts, raw),
    };
    if (raw) headers['content-type'] = 'application/json';
    if (key) headers['idempotency-key'] = key;

    let res: Response;
    try {
      res = await this.doFetch(`${c.platformUrl.replace(/\/$/, '')}/api/agent-api/v1${path}`, {
        method,
        headers,
        body: raw || undefined,
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (e) {
      throw new PlatformError((e as Error).message, null, true);
    }
    if (!res.ok) {
      throw new PlatformError(`Platform responded ${res.status}`, res.status, res.status >= 500);
    }
    const json = (await res.json()) as { data?: T } & T;
    return (json.data ?? json) as T;
  }
}
