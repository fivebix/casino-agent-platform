'use client';

import { useEffect, useState } from 'react';
import Spinner from '@/components/common/Spinner';
import { useAppDispatch } from '@/hooks/useReduxHooks';
import { readClientSubdomain } from '@/lib/tenant';
import { useResolveOperatorQuery } from '@/services/agentApi';
import { setSubdomain } from '@/slices/tenantSlice';

type Props = {
  children: React.ReactNode;
};

/**
 * Resolves the operator once per page load: subdomain from the proxy cookie (or the host, or
 * NEXT_PUBLIC_DEFAULT_SUBDOMAIN on localhost) → `GET /operator/resolve/:subdomain` → `tenantSlice`.
 * A failed resolve does not block the app; the login screen shows the error and a retry.
 */
const TenantManagerLayout = ({ children }: Props) => {
  const dispatch = useAppDispatch();
  // Rendered inside PersistGate, so this only ever runs in the browser.
  const [subdomain] = useState(readClientSubdomain);

  useEffect(() => {
    if (subdomain) dispatch(setSubdomain(subdomain));
  }, [dispatch, subdomain]);

  const { isLoading } = useResolveOperatorQuery(subdomain, { skip: !subdomain });

  if (isLoading) return <Spinner fullScreen />;
  return <>{children}</>;
};

export default TenantManagerLayout;
