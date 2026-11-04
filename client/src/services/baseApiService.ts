import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import toast from 'react-hot-toast';
import { Mutex } from 'async-mutex';
import { logout, setAgent } from '@/slices/authActions';
import { closeAllModals } from '@/slices/modalSlice';
import type { AgentMe } from '@/types/agent';
import type { ApiResponse } from '@/types/common';

/** Same-origin: next.config.ts rewrites /api/* to the backend so the httpOnly agent cookies are first-party. */
const API_BASE_URL = '/api';
const mutex = new Mutex();

export const AUTH_URLS = {
  LOGIN: '/agent/auth/login',
  REFRESH: '/agent/auth/refresh',
  LOGOUT: '/agent/auth/logout',
  ME: '/agent/auth/me',
  FORGOT_PASSWORD: '/agent/auth/forgot-password',
  RESET_PASSWORD: '/agent/auth/reset-password',
} as const;

/** A 401 on these is a real answer (bad credentials / bad OTP), never a reason to refresh. */
const noRefreshUrls: string[] = [
  AUTH_URLS.LOGIN,
  AUTH_URLS.REFRESH,
  AUTH_URLS.FORGOT_PASSWORD,
  AUTH_URLS.RESET_PASSWORD,
];

/** Background reads whose errors should not pop a toast (the UI shows its own error state). */
const silentErrorUrls: string[] = [
  AUTH_URLS.ME,
  AUTH_URLS.REFRESH,
  AUTH_URLS.LOGOUT,
  '/agent/balance',
];

/** Mutations whose success message should not pop a toast. */
const silentSuccessUrls: string[] = [
  AUTH_URLS.LOGIN,
  AUTH_URLS.REFRESH,
  AUTH_URLS.LOGOUT,
  '/agent/auth/preferences',
];

type ExtraOptions = { preventGlobalToast?: boolean };

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as { tenant?: { operator?: { id?: string } | null } };
    const operatorId = state.tenant?.operator?.id;
    if (operatorId) headers.set('x-operator-id', operatorId);
    headers.set('accept', 'application/json');
    return headers;
  },
});

const urlOf = (args: string | FetchArgs) => (typeof args === 'string' ? args : args.url);
const methodOf = (args: string | FetchArgs) =>
  typeof args === 'string' ? 'GET' : (args.method ?? 'GET').toUpperCase();
const matches = (url: string, list: string[]) => list.some((u) => url.startsWith(u));

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError,
  ExtraOptions
> = async (args, api, extraOptions) => {
  await mutex.waitForUnlock();
  let result = await rawBaseQuery(args, api, extraOptions);
  const url = urlOf(args);

  if (result.error?.status === 401 && !matches(url, noRefreshUrls)) {
    if (!mutex.isLocked()) {
      const release = await mutex.acquire();
      try {
        // The backend rotates the refresh token, so only one refresh may run at a time.
        const refresh = await rawBaseQuery(
          { url: AUTH_URLS.REFRESH, method: 'POST' },
          api,
          extraOptions,
        );
        if (refresh.data) {
          const me = (refresh.data as ApiResponse<AgentMe>).data;
          if (me) api.dispatch(setAgent(me));
          result = await rawBaseQuery(args, api, extraOptions);
        } else if (refresh.error?.status === 401 || refresh.error?.status === 403) {
          // An open modal would re-run its query after the reset and loop through refresh again.
          api.dispatch(closeAllModals());
          api.dispatch(logout());
          api.dispatch(baseApiService.util.resetApiState());
        }
      } finally {
        release();
      }
    } else {
      await mutex.waitForUnlock();
      result = await rawBaseQuery(args, api, extraOptions);
    }
  }

  const preventToast = !!extraOptions?.preventGlobalToast;
  if (result.error && !preventToast && !matches(url, silentErrorUrls)) {
    const msg = (result.error.data as { message?: string | string[] } | undefined)?.message;
    const text = Array.isArray(msg) ? msg.join(', ') : msg;
    if (text) toast.error(text, { id: text });
    else if (result.error.status === 'FETCH_ERROR') {
      toast.error('Cannot reach the server', { id: 'fetch-error' });
    }
  }

  const isMutation = methodOf(args) !== 'GET' || api.type === 'mutation';
  if (result.data && isMutation && !preventToast && !matches(url, silentSuccessUrls)) {
    const msg = (result.data as { message?: string })?.message;
    if (msg) toast.success(msg, { id: msg });
  }

  return result;
};

export const TAGS = [
  'Me',
  'Balance',
  'Users',
  'PlayerBets',
  'UserDetail',
  'Messages',
  'Credit',
  'Corrections',
  'CasinoRounds',
  'CasinoProviders',
  'Bets',
  'Subscribe',
  'Operator',
] as const;

export const baseApiService = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: TAGS,
  endpoints: () => ({}),
});

/** Drops `undefined` / `null` / `''` so they are not sent as query params. */
export const cleanParams = <T extends object>(
  params?: T,
): Record<string, string | number | boolean> =>
  Object.fromEntries(
    Object.entries(params ?? {}).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  ) as Record<string, string | number | boolean>;
