'use client';

import ModalShell from '@/components/modals/ModalShell';
import FormRow from '@/components/form/FormRow';
import StateMessage from '@/components/common/StateMessage';
import { useGetBalanceQuery } from '@/services/agentApi';
import { formatAmount } from '@/lib/format';
import type { ModalBaseProps } from '@/types/common';

/** Design 34: opened from the wallet amount in the top bar. `GET /agent/balance`. */
const BalanceModal = ({ isOpen, onClose }: ModalBaseProps) => {
  const { data, isLoading, isError, refetch, isFetching } = useGetBalanceQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title="Balance">
      {isLoading ? (
        <StateMessage variant="loading" />
      ) : isError ? (
        <StateMessage variant="error" message="Could not load the balance" onRetry={refetch} />
      ) : (
        <div className={isFetching ? 'opacity-70' : undefined}>
          <FormRow label="Balance">{formatAmount(data?.balance)}</FormRow>
          <FormRow label="Credit Left">{formatAmount(data?.creditLeft)}</FormRow>
        </div>
      )}
    </ModalShell>
  );
};

export default BalanceModal;
