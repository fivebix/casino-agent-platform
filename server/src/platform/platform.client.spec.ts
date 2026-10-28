import { verifyAgentSignature } from '../common/signature.util';
import { HttpPlatformClient, PlatformError } from './platform.client';

const creds = { platformUrl: 'https://p.example.com/', operatorId: 'op1', apiKey: 'k', signingSecret: 'sec' };

function fakeFetch(res: { ok: boolean; status: number; json?: unknown } | Error) {
  const calls: { url: string; init: RequestInit }[] = [];
  const f = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    if (res instanceof Error) throw res;
    return { ok: res.ok, status: res.status, json: async () => res.json } as Response;
  }) as unknown as typeof fetch;
  return { f, calls };
}

describe('HttpPlatformClient', () => {
  it('signs the exact body, sends the idempotency key and unwraps the data envelope', async () => {
    const { f, calls } = fakeFetch({ ok: true, status: 200, json: { data: { playerId: 'p1', balance: 100 } } });
    const out = await new HttpPlatformClient(f).credit(creds, 'p1', { agentId: 'a1', amount: 100 }, 'key-1');
    expect(out).toEqual({ playerId: 'p1', balance: 100 });
    const { url, init } = calls[0];
    expect(url).toBe('https://p.example.com/api/agent-api/v1/players/p1/credit');
    const h = init.headers as Record<string, string>;
    expect(h['idempotency-key']).toBe('key-1');
    expect(h['x-operator-id']).toBe('op1');
    expect(verifyAgentSignature('sec', h['x-timestamp'], init.body as string, h['x-signature'])).toBe(true);
  });

  it('marks network errors and 5xx as retryable, 4xx as final', async () => {
    const net = new HttpPlatformClient(fakeFetch(new Error('ECONNRESET')).f);
    await expect(net.credit(creds, 'p', { agentId: 'a', amount: 1 }, 'k')).rejects.toMatchObject({ retryable: true, status: null });
    const s503 = new HttpPlatformClient(fakeFetch({ ok: false, status: 503 }).f);
    await expect(s503.credit(creds, 'p', { agentId: 'a', amount: 1 }, 'k')).rejects.toMatchObject({ retryable: true, status: 503 });
    const s422 = new HttpPlatformClient(fakeFetch({ ok: false, status: 422 }).f);
    const err = await s422.credit(creds, 'p', { agentId: 'a', amount: 1 }, 'k').catch((e) => e);
    expect(err).toBeInstanceOf(PlatformError);
    expect(err).toMatchObject({ retryable: false, status: 422 });
  });
});
