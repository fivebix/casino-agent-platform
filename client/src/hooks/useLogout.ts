import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/hooks/useReduxHooks';
import { useLogoutMutation } from '@/services/agentApi';
import { baseApiService } from '@/services/baseApiService';
import { logout as clearAuth } from '@/slices/authActions';
import { closeAllModals } from '@/slices/modalSlice';
import { ROUTES } from '@/lib/constants';

/** Calls `POST /agent/auth/logout` (clears the cookies), then wipes local state and goes to /login. */
export const useLogout = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [logoutApi, { isLoading }] = useLogoutMutation();

  const logout = useCallback(async () => {
    try {
      await logoutApi().unwrap();
    } catch {
      // Clear locally even when the server call fails; the cookies expire on their own.
    }
    dispatch(clearAuth());
    dispatch(closeAllModals());
    dispatch(baseApiService.util.resetApiState());
    router.replace(ROUTES.login);
  }, [dispatch, logoutApi, router]);

  return { logout, isLoggingOut: isLoading };
};
