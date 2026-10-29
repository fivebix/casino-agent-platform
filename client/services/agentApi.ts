import { baseApiService, OPERATOR_ID } from './baseApiService';

/**
 * Agent-platform endpoints, injected into the base service exactly like the back office
 * injects its endpoints (`baseApiService.injectEndpoints`). Caching is handled by RTK
 * Query: `listAgents` provides the `Agents` tag and every mutation invalidates it, so the
 * agent-tree table refetches and shows new balances automatically.
 */

const base = `/v1/tenants/${OPERATOR_ID}`;

export interface AgentListItem {
  id: string;
  operatorId: string;
  parentAgentId: string | null;
  username: string;
  name: string | null;
  canCreateAgents: boolean;
  balance: number;
  status: string;
  path: string;
  level: number;
}

export interface CreditResult {
  agentId: string;
  balance: number;
}

export const agentApi = baseApiService.injectEndpoints({
  endpoints: (build) => ({
    listAgents: build.query<AgentListItem[], void>({
      query: () => ({ method: 'GET', path: `${base}/agents` }),
      providesTags: ['Agents'],
    }),

    createAgent: build.mutation<
      AgentListItem,
      {
        username: string;
        name?: string;
        tempPassword: string;
        parentAgentId?: string;
        creditLimit?: number;
        idempotencyKey: string;
      }
    >({
      query: ({ idempotencyKey, ...body }) => ({
        method: 'POST',
        path: `${base}/agents`,
        body,
        idempotencyKey,
      }),
      invalidatesTags: ['Agents'],
    }),

    grantCredit: build.mutation<
      CreditResult,
      { agentId: string; amount: number; comment?: string; idempotencyKey: string }
    >({
      query: ({ agentId, idempotencyKey, ...body }) => ({
        method: 'POST',
        path: `${base}/agents/${agentId}/credit`,
        body,
        idempotencyKey,
      }),
      invalidatesTags: ['Agents'],
    }),

    withdrawCredit: build.mutation<
      CreditResult,
      { agentId: string; amount: number; comment?: string; idempotencyKey: string }
    >({
      query: ({ agentId, idempotencyKey, ...body }) => ({
        method: 'POST',
        path: `${base}/agents/${agentId}/withdraw`,
        body,
        idempotencyKey,
      }),
      invalidatesTags: ['Agents'],
    }),

    updateAgent: build.mutation<
      AgentListItem,
      { agentId: string; name?: string; canCreateAgents?: boolean; status?: 'active' | 'blocked' }
    >({
      query: ({ agentId, ...body }) => ({ method: 'PATCH', path: `${base}/agents/${agentId}`, body }),
      invalidatesTags: ['Agents'],
    }),

    deleteAgent: build.mutation<{ deleted: boolean; id: string }, { agentId: string }>({
      query: ({ agentId }) => ({ method: 'DELETE', path: `${base}/agents/${agentId}` }),
      invalidatesTags: ['Agents'],
    }),

    pushEvent: build.mutation<
      unknown,
      { eventId: string; type: string; playerId: string; agentId: string; amount: number; occurredAt: string }
    >({
      query: (evt) => ({ method: 'POST', path: `/v1/events`, body: { events: [evt] } }),
    }),

    closeWeek: build.mutation<
      unknown,
      { weekId: string; closeAt: string; timeZone: string; pauseMinutes: number }
    >({
      query: ({ weekId, ...body }) => ({ method: 'POST', path: `/v1/weeks/${weekId}/closing`, body }),
    }),
  }),
  overrideExisting: false,
});

export { OPERATOR_ID };

export const {
  useListAgentsQuery,
  useCreateAgentMutation,
  useGrantCreditMutation,
  useWithdrawCreditMutation,
  useUpdateAgentMutation,
  useDeleteAgentMutation,
  usePushEventMutation,
  useCloseWeekMutation,
} = agentApi;
