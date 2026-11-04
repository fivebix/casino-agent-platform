'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Spinner from '@/components/common/Spinner';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/lib/constants';
import { useGetMeQuery } from '@/services/agentApi';

type Props = {
  children: React.ReactNode;
};

/**
 * Wraps every signed-in route.
 * - not signed in → /login
 * - `mustChangePassword` → only /first-login is allowed
 * - /first-login without `mustChangePassword` → /users
 * Re-reads `GET /agent/auth/me` on mount; a 401 there refreshes, and a failed refresh logs out.
 */
const AuthGuardLayout = ({ children }: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, mustChangePassword } = useAuth();

  useGetMeQuery(undefined, { skip: !isAuthenticated, refetchOnMountOrArgChange: true });

  const onFirstLogin = pathname === ROUTES.firstLogin;
  const target = !isAuthenticated
    ? ROUTES.login
    : mustChangePassword && !onFirstLogin
      ? ROUTES.firstLogin
      : !mustChangePassword && onFirstLogin
        ? ROUTES.home
        : null;

  useEffect(() => {
    if (target) router.replace(target);
  }, [router, target]);

  if (target) return <Spinner fullScreen />;
  return <>{children}</>;
};

export default AuthGuardLayout;
