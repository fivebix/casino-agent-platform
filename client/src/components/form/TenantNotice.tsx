'use client';

import { Button } from '@/components/ui/button';
import { useTenantStatus } from '@/hooks/useTenant';

/** Shown on the public auth screens when the operator could not be resolved (nothing can be submitted). */
const TenantNotice = () => {
  const { isMissingSubdomain, isError, isFetching, refetch } = useTenantStatus();
  if (!isMissingSubdomain && !isError) return null;

  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-3 rounded-lg border border-negative/40 bg-negative/10 px-3 py-2.5 text-sm text-negative"
    >
      <span>
        {isMissingSubdomain
          ? 'No operator for this address. Set NEXT_PUBLIC_DEFAULT_SUBDOMAIN or open the panel on its subdomain.'
          : 'Could not load the operator. Check your connection.'}
      </span>
      {!isMissingSubdomain && (
        <Button variant="secondary" size="sm" onClick={refetch} isLoading={isFetching}>
          Retry
        </Button>
      )}
    </div>
  );
};

export default TenantNotice;
