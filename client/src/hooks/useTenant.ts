import { useAppSelector } from '@/hooks/useReduxHooks';
import { useResolveOperatorQuery } from '@/services/agentApi';

/** The operator resolved from the subdomain (`operatorId` is what the public auth routes need). */
export const useTenant = () => {
  const operator = useAppSelector((state) => state.tenant.operator);
  const subdomain = useAppSelector((state) => state.tenant.subdomain);
  return { operator, subdomain, operatorId: operator?.id ?? null };
};

/** Status of `GET /operator/resolve/:subdomain` (shares the cache entry TenantManagerLayout started). */
export const useTenantStatus = () => {
  const subdomain = useAppSelector((state) => state.tenant.subdomain);
  const { isLoading, isFetching, isError, refetch } = useResolveOperatorQuery(subdomain ?? '', {
    skip: !subdomain,
  });
  return { subdomain, isLoading, isFetching, isError, refetch, isMissingSubdomain: !subdomain };
};
