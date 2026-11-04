import { createAction } from '@reduxjs/toolkit';
import type { AgentMe } from '@/types/agent';

/**
 * Auth actions live apart from authSlice so baseApiService can dispatch them without importing the slice
 * (authSlice → agentApi → baseApiService would otherwise be a circular import).
 */
export const setAgent = createAction<AgentMe>('auth/setAgent');
export const logout = createAction('auth/logout');
