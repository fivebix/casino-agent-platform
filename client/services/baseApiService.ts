import { createApi, type BaseQueryFn } from '@reduxjs/toolkit/query/react';
import toast from 'react-hot-toast';

/**
 * Base RTK Query service, mirroring the sweepstakes back office `baseApiService`:
 * one `createApi` with a shared baseQuery wrapper that surfaces errors as global
 * toasts (keyed by message to de-dupe), with endpoints injected elsewhere via
 * `baseApiService.injectEndpoints`.
 *
 * The one difference from the back office is the transport: every call goes through
 * the server-side BFF proxy at /api/call, which HMAC-signs it so the operator secret
 * never reaches the browser. The proxy answers with { status, ok, data }, which the
 * base query unwraps into RTK Query's data/error shape.
 */

export const OPERATOR_ID = process.env.NEXT_PUBLIC_OPERATOR_ID || 'demo-operator';

export interface ProxyArg {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  body?: unknown;
  idempotencyKey?: string;
}

export interface ProxyError {
  status: number;
  message: string;
}

const proxyBaseQuery: BaseQueryFn<ProxyArg, unknown, ProxyError> = async (arg) => {
  let env: { status?: number; ok?: boolean; data?: unknown; error?: string; message?: string };
  try {
    const res = await fetch('/api/call', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(arg),
    });
    env = await res.json();
  } catch (e) {
    return { error: { status: 0, message: (e as Error).message } };
  }

  if (env.error) return { error: { status: env.status ?? 502, message: env.message || env.error } };

  if (!env.ok) {
    const raw = (env.data as { message?: string | string[] })?.message;
    const message = Array.isArray(raw) ? raw.join(', ') : raw || `Request failed (${env.status})`;
    return { error: { status: env.status ?? 500, message } };
  }

  return { data: env.data };
};

/** Wraps the base query to raise a global error toast — same pattern as the back office. */
const baseQueryWithToast: BaseQueryFn<ProxyArg, unknown, ProxyError> = async (args, api, extraOptions) => {
  const result = await proxyBaseQuery(args, api, extraOptions);
  if (result.error) {
    const msg = result.error.message;
    // Keyed by the message: a repeat of a toast still on screen replaces it instead of stacking.
    if (msg) toast.error(msg, { id: msg });
  }
  return result;
};

export const baseApiService = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithToast,
  tagTypes: ['Agents'],
  endpoints: () => ({}),
});
