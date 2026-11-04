import { useAppSelector } from '@/hooks/useReduxHooks';

/** The signed-in agent (`AgentMe`) from the persisted auth slice. */
export const useAuth = () => {
  const agent = useAppSelector((state) => state.auth.agent);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  return { agent, isAuthenticated, mustChangePassword: !!agent?.mustChangePassword };
};
