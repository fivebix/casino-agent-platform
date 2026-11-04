'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Spinner from '@/components/common/Spinner';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/lib/constants';

type Props = {
  children: React.ReactNode;
};

/** Wraps /login and /reset-password: a signed-in agent is sent to /first-login or /users. */
const GuestGuardLayout = ({ children }: Props) => {
  const router = useRouter();
  const { isAuthenticated, mustChangePassword } = useAuth();
  const target = isAuthenticated ? (mustChangePassword ? ROUTES.firstLogin : ROUTES.home) : null;

  useEffect(() => {
    if (target) router.replace(target);
  }, [router, target]);

  if (target) return <Spinner fullScreen />;
  return <>{children}</>;
};

export default GuestGuardLayout;
