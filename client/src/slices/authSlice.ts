import { createSlice } from '@reduxjs/toolkit';
import { agentApi } from '@/services/agentApi';
import { logout, setAgent } from '@/slices/authActions';
import type { AgentMe } from '@/types/agent';

type AuthState = {
  agent: AgentMe | null;
  isAuthenticated: boolean;
};

const initialState: AuthState = {
  agent: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(setAgent, (state, { payload }) => {
      state.agent = payload;
      state.isAuthenticated = true;
    });
    builder.addCase(logout, (state) => {
      state.agent = null;
      state.isAuthenticated = false;
    });
    builder.addMatcher(agentApi.endpoints.login.matchFulfilled, (state, { payload }) => {
      state.agent = payload;
      state.isAuthenticated = true;
    });
    builder.addMatcher(agentApi.endpoints.getMe.matchFulfilled, (state, { payload }) => {
      state.agent = payload;
      state.isAuthenticated = true;
    });
    builder.addMatcher(
      agentApi.endpoints.updatePreferences.matchFulfilled,
      (state, { payload }) => {
        if (payload) state.agent = payload;
      },
    );
    builder.addMatcher(agentApi.endpoints.setPassword.matchFulfilled, (state) => {
      if (state.agent) state.agent.mustChangePassword = false;
    });
    builder.addMatcher(agentApi.endpoints.logout.matchFulfilled, (state) => {
      state.agent = null;
      state.isAuthenticated = false;
    });
  },
});

export { setAgent, logout };
export default authSlice.reducer;
