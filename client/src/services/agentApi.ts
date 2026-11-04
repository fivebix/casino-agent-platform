import { baseApiService, cleanParams } from '@/services/baseApiService';
import type {
  AgentMe,
  AgentMessage,
  Balance,
  CasinoProvider,
  CasinoRound,
  CasinoRoundsQuery,
  ChanceBet,
  ChanceBetsQuery,
  Corrections,
  CreateAgentRequest,
  CreatePlayerRequest,
  CreatedUser,
  CreditInfo,
  ExtraCreditsRequest,
  ForgotPasswordRequest,
  LoginRequest,
  Operator,
  PlayerBets,
  ResetPasswordRequest,
  SetPasswordRequest,
  SportBet,
  SportBetsQuery,
  SubscribeSettings,
  UpdateCreditRequest,
  UpdatePreferencesRequest,
  UpdateProfileRequest,
  UpdateSharesRequest,
  UserDetail,
  UserRef,
  UsersList,
  UsersListQuery,
  WeekStart,
} from '@/types/agent';
import type { ApiResponse, Paginated } from '@/types/common';

/** Every endpoint unwraps the `{ statusCode, message, data }` envelope, so hooks return `data` directly. */
const unwrap = <T>(response: ApiResponse<T>): T => response.data;

const userTag = ({ kind, id }: UserRef) => ({ type: 'UserDetail' as const, id: `${kind}:${id}` });

export const agentApi = baseApiService.injectEndpoints({
  endpoints: (build) => ({
    // ---------- Operator (tenant) ----------
    resolveOperator: build.query<Operator, string>({
      query: (subdomain) => `/operator/resolve/${encodeURIComponent(subdomain)}`,
      transformResponse: unwrap<Operator>,
      providesTags: ['Operator'],
    }),

    // ---------- 1. Auth ----------
    login: build.mutation<AgentMe, LoginRequest>({
      query: (body) => ({ url: '/agent/auth/login', method: 'POST', body }),
      transformResponse: unwrap<AgentMe>,
    }),
    logout: build.mutation<void, void>({
      query: () => ({ url: '/agent/auth/logout', method: 'POST' }),
    }),
    getMe: build.query<AgentMe, void>({
      query: () => '/agent/auth/me',
      transformResponse: unwrap<AgentMe>,
      providesTags: ['Me'],
    }),
    setPassword: build.mutation<void, SetPasswordRequest>({
      query: (body) => ({ url: '/agent/auth/set-password', method: 'POST', body }),
    }),
    forgotPassword: build.mutation<void, ForgotPasswordRequest>({
      query: (body) => ({ url: '/agent/auth/forgot-password', method: 'POST', body }),
    }),
    resetPassword: build.mutation<void, ResetPasswordRequest>({
      query: (body) => ({ url: '/agent/auth/reset-password', method: 'POST', body }),
    }),
    updatePreferences: build.mutation<AgentMe, UpdatePreferencesRequest>({
      query: (body) => ({ url: '/agent/auth/preferences', method: 'PATCH', body }),
      transformResponse: unwrap<AgentMe>,
    }),

    // ---------- 2. Users list ----------
    getUsers: build.query<UsersList, UsersListQuery | void>({
      query: (params) => ({ url: '/agent/users', params: cleanParams(params ?? {}) }),
      transformResponse: unwrap<UsersList>,
      providesTags: ['Users'],
    }),
    getAgentChildren: build.query<UsersList, UsersListQuery & { agentId: string }>({
      query: ({ agentId, ...params }) => ({
        url: `/agent/users/agents/${agentId}/children`,
        params: cleanParams(params),
      }),
      transformResponse: unwrap<UsersList>,
      providesTags: ['Users'],
    }),
    getUsersTree: build.query<UsersList, UsersListQuery | void>({
      query: (params) => ({ url: '/agent/users/tree', params: cleanParams(params ?? {}) }),
      transformResponse: unwrap<UsersList>,
      providesTags: ['Users'],
    }),
    getPlayerBets: build.query<PlayerBets, { playerId: string; weekStart?: WeekStart }>({
      query: ({ playerId, weekStart }) => ({
        url: `/agent/users/players/${playerId}/bets`,
        params: cleanParams({ weekStart }),
      }),
      transformResponse: unwrap<PlayerBets>,
      providesTags: (_r, _e, { playerId }) => [{ type: 'PlayerBets', id: playerId }],
    }),

    // ---------- 3. Create ----------
    createAgent: build.mutation<CreatedUser, CreateAgentRequest>({
      query: (body) => ({ url: '/agent/agents', method: 'POST', body }),
      transformResponse: unwrap<CreatedUser>,
      invalidatesTags: ['Users', 'Balance', 'Me'],
    }),
    createPlayer: build.mutation<CreatedUser, CreatePlayerRequest>({
      query: (body) => ({ url: '/agent/players', method: 'POST', body }),
      transformResponse: unwrap<CreatedUser>,
      invalidatesTags: ['Users', 'Balance', 'Me'],
    }),

    // ---------- 4. User edit ----------
    getUserDetail: build.query<UserDetail, UserRef>({
      query: ({ kind, id }) => `/agent/${kind}/${id}`,
      transformResponse: unwrap<UserDetail>,
      providesTags: (_r, _e, ref) => [userTag(ref)],
    }),
    updateUserProfile: build.mutation<void, UserRef & { body: UpdateProfileRequest }>({
      query: ({ kind, id, body }) => ({
        url: `/agent/${kind}/${id}/profile`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_r, _e, ref) => [userTag(ref), 'Users'],
    }),
    updateUserSettings: build.mutation<void, UserRef & { settings: Record<string, unknown> }>({
      query: ({ kind, id, settings }) => ({
        url: `/agent/${kind}/${id}/settings`,
        method: 'PATCH',
        body: { settings },
      }),
      invalidatesTags: (_r, _e, ref) => [userTag(ref)],
    }),
    updateUserLimits: build.mutation<void, UserRef & { limits: Record<string, unknown> }>({
      query: ({ kind, id, limits }) => ({
        url: `/agent/${kind}/${id}/limits`,
        method: 'PATCH',
        body: { limits },
      }),
      invalidatesTags: (_r, _e, ref) => [userTag(ref)],
    }),
    updateUserModules: build.mutation<void, UserRef & { modules: Record<string, boolean> }>({
      query: ({ kind, id, modules }) => ({
        url: `/agent/${kind}/${id}/modules`,
        method: 'PATCH',
        body: { modules },
      }),
      invalidatesTags: (_r, _e, ref) => [userTag(ref)],
    }),
    updateUserNotify: build.mutation<void, UserRef & { notify: Record<string, unknown> }>({
      query: ({ kind, id, notify }) => ({
        url: `/agent/${kind}/${id}/notify`,
        method: 'PATCH',
        body: { notify },
      }),
      invalidatesTags: (_r, _e, ref) => [userTag(ref)],
    }),
    updateUserShares: build.mutation<void, UserRef & { body: UpdateSharesRequest }>({
      query: ({ kind, id, body }) => ({
        url: `/agent/${kind}/${id}/shares`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_r, _e, ref) => [userTag(ref), 'Users'],
    }),
    getUserMessages: build.query<AgentMessage[], UserRef>({
      query: ({ kind, id }) => `/agent/${kind}/${id}/messages`,
      transformResponse: unwrap<AgentMessage[]>,
      providesTags: (_r, _e, ref) => [{ type: 'Messages', id: `${ref.kind}:${ref.id}` }],
    }),
    sendUserMessage: build.mutation<void, UserRef & { title: string; body: string }>({
      query: ({ kind, id, title, body }) => ({
        url: `/agent/${kind}/${id}/messages`,
        method: 'POST',
        body: { title, body },
      }),
      invalidatesTags: (_r, _e, ref) => [{ type: 'Messages', id: `${ref.kind}:${ref.id}` }],
    }),

    // ---------- 5. Credit, balance, calculation ----------
    getBalance: build.query<Balance, void>({
      query: () => '/agent/balance',
      transformResponse: unwrap<Balance>,
      providesTags: ['Balance'],
    }),
    getCredit: build.query<CreditInfo, UserRef>({
      query: ({ kind, id }) => `/agent/${kind}/${id}/credit`,
      transformResponse: unwrap<CreditInfo>,
      providesTags: (_r, _e, ref) => [{ type: 'Credit', id: `${ref.kind}:${ref.id}` }],
    }),
    updateCredit: build.mutation<void, UserRef & { body: UpdateCreditRequest }>({
      query: ({ kind, id, body }) => ({ url: `/agent/${kind}/${id}/credit`, method: 'POST', body }),
      invalidatesTags: (_r, _e, ref) => [
        { type: 'Credit', id: `${ref.kind}:${ref.id}` },
        'Users',
        'Balance',
        'Me',
      ],
    }),
    setBackupCredit: build.mutation<void, { id: string; amount: number }>({
      query: ({ id, amount }) => ({
        url: `/agent/agents/${id}/backup-credit`,
        method: 'PATCH',
        body: { amount },
      }),
      invalidatesTags: ['Users', 'Credit'],
    }),
    clearGroupCredit: build.mutation<void, { id: string }>({
      query: ({ id }) => ({ url: `/agent/agents/${id}/clear-group-credit`, method: 'POST' }),
      invalidatesTags: ['Users', 'Credit', 'Balance', 'Me'],
    }),
    setExtraCredits: build.mutation<void, ExtraCreditsRequest>({
      query: (body) => ({ url: '/agent/extra-credits', method: 'POST', body }),
      invalidatesTags: ['Users', 'Credit', 'Balance', 'Me'],
    }),
    getCorrections: build.query<Corrections, UserRef & { weekStart?: WeekStart }>({
      query: ({ kind, id, weekStart }) => ({
        url: `/agent/${kind}/${id}/corrections`,
        params: cleanParams({ weekStart }),
      }),
      transformResponse: unwrap<Corrections>,
      providesTags: (_r, _e, ref) => [{ type: 'Corrections', id: `${ref.kind}:${ref.id}` }],
    }),
    addCorrection: build.mutation<void, UserRef & { amount: number; comment?: string }>({
      query: ({ kind, id, amount, comment }) => ({
        url: `/agent/${kind}/${id}/corrections`,
        method: 'POST',
        body: { amount, comment },
      }),
      invalidatesTags: (_r, _e, ref) => [
        { type: 'Corrections', id: `${ref.kind}:${ref.id}` },
        'Users',
      ],
    }),

    // ---------- 6. Bets and casino ----------
    getCasinoRounds: build.query<Paginated<CasinoRound>, CasinoRoundsQuery | void>({
      query: (params) => ({ url: '/agent/casino-rounds', params: cleanParams(params ?? {}) }),
      transformResponse: unwrap<Paginated<CasinoRound>>,
      providesTags: ['CasinoRounds'],
    }),
    getCasinoProviders: build.query<CasinoProvider[], void>({
      query: () => '/agent/casino-providers',
      transformResponse: unwrap<CasinoProvider[]>,
      providesTags: ['CasinoProviders'],
    }),
    /** `GET /agent/bets?product=sport` (Bet List, Bets online). Always an empty page until a sportsbook lands. */
    getBets: build.query<Paginated<SportBet>, SportBetsQuery>({
      query: (params) => ({
        url: '/agent/bets',
        params: cleanParams({ ...params, product: 'sport' }),
      }),
      transformResponse: unwrap<Paginated<SportBet>>,
      providesTags: ['Bets'],
    }),
    /** `GET /agent/bets?product=chance`. Always an empty page for now. */
    getChanceBets: build.query<Paginated<ChanceBet>, ChanceBetsQuery>({
      query: (params) => ({
        url: '/agent/bets',
        params: cleanParams({ ...params, product: 'chance' }),
      }),
      transformResponse: unwrap<Paginated<ChanceBet>>,
      providesTags: ['Bets'],
    }),

    // ---------- 7. Settings ----------
    getSubscribeSettings: build.query<Partial<SubscribeSettings>, void>({
      query: () => '/agent/settings/subscribe',
      transformResponse: unwrap<Partial<SubscribeSettings>>,
      providesTags: ['Subscribe'],
    }),
    // The backend DTO (UpdateAgentSubscribeDto) wraps the values: `{ subscribe: {...} }`.
    updateSubscribeSettings: build.mutation<void, SubscribeSettings>({
      query: (subscribe) => ({
        url: '/agent/settings/subscribe',
        method: 'PUT',
        body: { subscribe },
      }),
      invalidatesTags: ['Subscribe'],
    }),
  }),
});

export const {
  useResolveOperatorQuery,
  useLoginMutation,
  useLogoutMutation,
  useGetMeQuery,
  useSetPasswordMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useUpdatePreferencesMutation,
  useGetUsersQuery,
  useGetAgentChildrenQuery,
  useLazyGetAgentChildrenQuery,
  useGetUsersTreeQuery,
  useGetPlayerBetsQuery,
  useCreateAgentMutation,
  useCreatePlayerMutation,
  useGetUserDetailQuery,
  useUpdateUserProfileMutation,
  useUpdateUserSettingsMutation,
  useUpdateUserLimitsMutation,
  useUpdateUserModulesMutation,
  useUpdateUserNotifyMutation,
  useUpdateUserSharesMutation,
  useGetUserMessagesQuery,
  useSendUserMessageMutation,
  useGetBalanceQuery,
  useGetCreditQuery,
  useUpdateCreditMutation,
  useSetBackupCreditMutation,
  useClearGroupCreditMutation,
  useSetExtraCreditsMutation,
  useGetCorrectionsQuery,
  useAddCorrectionMutation,
  useGetCasinoRoundsQuery,
  useGetCasinoProvidersQuery,
  useGetBetsQuery,
  useGetChanceBetsQuery,
  useGetSubscribeSettingsQuery,
  useUpdateSubscribeSettingsMutation,
} = agentApi;
