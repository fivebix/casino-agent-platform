import { NextRequest, NextResponse } from 'next/server';
import { signAgentRequest } from '@/lib/sign';

// Needs Node crypto + env secrets — never run on the edge, never in the browser.
export const runtime = 'nodejs';

interface CallBody {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  body?: unknown;
  idempotencyKey?: string;
}

/**
 * Backend-for-frontend proxy. The browser sends { method, path, body, idempotencyKey };
 * this handler signs it with the operator secret and forwards it to the agent-platform.
 * The secret stays on the server.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const apiUrl = process.env.AGENT_API_URL ?? 'http://localhost:4100';
  const operatorId = process.env.AGENT_OPERATOR_ID ?? '';
  const apiKey = process.env.AGENT_API_KEY ?? '';
  const secret = process.env.AGENT_SIGNING_SECRET ?? '';

  let call: CallBody;
  try {
    call = (await req.json()) as CallBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const method = call.method ?? 'GET';
  const path = call.path ?? '/';
  // Sign the exact bytes we will send.
  const rawBody = call.body === undefined || call.body === null ? '' : JSON.stringify(call.body);
  const ts = String(Math.floor(Date.now() / 1000));

  const headers: Record<string, string> = {
    'x-operator-id': operatorId,
    'x-api-key': apiKey,
    'x-timestamp': ts,
    'x-signature': signAgentRequest(secret, ts, rawBody),
  };
  if (rawBody) headers['content-type'] = 'application/json';
  if (call.idempotencyKey) headers['idempotency-key'] = call.idempotencyKey;

  const started = Date.now();
  let upstream: Response;
  try {
    upstream = await fetch(`${apiUrl}${path}`, {
      method,
      headers,
      body: rawBody || undefined,
      cache: 'no-store',
    });
  } catch (e) {
    return NextResponse.json(
      { error: 'UPSTREAM_UNREACHABLE', message: (e as Error).message, hint: `Is the server running at ${apiUrl}?` },
      { status: 502 },
    );
  }

  const text = await upstream.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  // Report the real upstream status back to the UI alongside the payload.
  return NextResponse.json(
    { status: upstream.status, ok: upstream.ok, ms: Date.now() - started, data },
    { status: 200 },
  );
}
