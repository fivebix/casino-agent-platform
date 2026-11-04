import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { agentApi } from '@/services/agentApi';
import type { Operator } from '@/types/agent';

type TenantState = {
  subdomain: string | null;
  operator: Operator | null;
};

const initialState: TenantState = {
  subdomain: null,
  operator: null,
};

const tenantSlice = createSlice({
  name: 'tenant',
  initialState,
  reducers: {
    setSubdomain: (state, action: PayloadAction<string>) => {
      state.subdomain = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(agentApi.endpoints.resolveOperator.matchFulfilled, (state, { payload }) => {
      state.operator = payload;
    });
    builder.addMatcher(agentApi.endpoints.resolveOperator.matchRejected, (state, action) => {
      // A condition-skip (cache hit) also "rejects"; keep the operator then.
      if (!action.meta.condition) state.operator = null;
    });
  },
});

export const { setSubdomain } = tenantSlice.actions;
export default tenantSlice.reducer;
