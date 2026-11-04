'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import ModalShell from '@/components/modals/ModalShell';
import FormRow from '@/components/form/FormRow';
import StateMessage from '@/components/common/StateMessage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  useClearGroupCreditMutation,
  useGetCreditQuery,
  useUpdateCreditMutation,
} from '@/services/agentApi';
import { formatAmount } from '@/lib/format';
import type { CreditInfo, UpdateCreditRequest, UserKindPath } from '@/types/agent';
import { creditAmountSchema } from './schema';
import type { CreditAmountForm, CreditAmountModalProps } from './type';

const FORM_ID = 'credit-amount-form';

type FormProps = {
  kind: UserKindPath;
  id: string;
  info: CreditInfo;
  onDone: () => void;
};

/** Mounted once the figures are loaded, so `creditAmount` is pre-filled from the server. */
const CreditAmountFormBody = ({ kind, id, info, onDone }: FormProps) => {
  const [updateCredit] = useUpdateCreditMutation({ fixedCacheKey: FORM_ID });
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CreditAmountForm>({
    resolver: yupResolver(creditAmountSchema),
    defaultValues: { creditAmount: info.creditAmount },
  });

  const onSubmit = async (values: CreditAmountForm) => {
    // The backend takes exactly one action: send only the field the user changed.
    const actions: UpdateCreditRequest[] = [];
    if (values.creditAmount !== info.creditAmount) {
      actions.push({ creditAmount: values.creditAmount });
    }
    if (values.addExtra !== undefined) actions.push({ addExtra: values.addExtra });
    if (values.withdraw !== undefined) actions.push({ withdraw: values.withdraw });

    if (actions.length !== 1) {
      setError('root', {
        message:
          actions.length === 0
            ? 'Change the credit amount, or enter extra credit or a withdrawal.'
            : 'Change only one field at a time.',
      });
      return;
    }
    try {
      await updateCredit({ kind, id, body: actions[0] }).unwrap();
      onDone();
    } catch {
      // The global toast shows the server message.
    }
  };

  return (
    <form id={FORM_ID} onSubmit={handleSubmit(onSubmit)} noValidate>
      <FormRow label="Less Credit">{formatAmount(info.lessCredit)}</FormRow>
      <FormRow label="Weekly Credit">{formatAmount(info.weeklyCredit)}</FormRow>
      <FormRow label="Extra Credit">{formatAmount(info.extraCredit)}</FormRow>
      {kind === 'agents' && (
        <>
          <FormRow label="Group credit used">{formatAmount(info.groupCreditUsed)}</FormRow>
          <FormRow label="Inactive users credit">{formatAmount(info.inactiveUsersCredit)}</FormRow>
        </>
      )}
      <FormRow label="Credit amount" required htmlFor="credit-amount">
        <Input
          id="credit-amount"
          type="number"
          inputMode="decimal"
          step="0.01"
          min={0}
          error={errors.creditAmount?.message}
          {...register('creditAmount')}
        />
      </FormRow>
      <FormRow label="Add extra credit" htmlFor="credit-add-extra">
        <Input
          id="credit-add-extra"
          type="number"
          inputMode="decimal"
          step="0.01"
          min={0}
          error={errors.addExtra?.message}
          {...register('addExtra')}
        />
      </FormRow>
      <FormRow label="Withdraw credit" htmlFor="credit-withdraw">
        <Input
          id="credit-withdraw"
          type="number"
          inputMode="decimal"
          step="0.01"
          min={0}
          error={errors.withdraw?.message}
          {...register('withdraw')}
        />
      </FormRow>
      {errors.root?.message && (
        <p role="alert" className="pt-2 text-sm text-negative">
          {errors.root.message}
        </p>
      )}
    </form>
  );
};

/**
 * Design 33, opened from CREDIT BALANCE. `GET /agent/:kind/:id/credit`, then one of set / add extra /
 * withdraw → `POST /agent/:kind/:id/credit`. Agents also get "Clear Credit of Group".
 */
const CreditAmountModal = ({ isOpen, onClose, kind, id, username }: CreditAmountModalProps) => {
  const { data, isLoading, isError, refetch } = useGetCreditQuery(
    { kind, id },
    { refetchOnMountOrArgChange: true },
  );
  // Shares the form's mutation state (same cache key) to drive the Save spinner.
  const [, { isLoading: isSaving }] = useUpdateCreditMutation({ fixedCacheKey: FORM_ID });
  const [clearGroupCredit, { isLoading: isClearing }] = useClearGroupCreditMutation();
  const [confirmClear, setConfirmClear] = useState(false);

  const onClear = async () => {
    try {
      await clearGroupCredit({ id }).unwrap();
      setConfirmClear(false);
    } catch {
      // The global toast shows the server message.
    }
  };

  const isAgent = kind === 'agents';

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={`Credit amount ${username}`}
      formId={FORM_ID}
      isSaving={isSaving}
      saveDisabled={!data}
      footer={
        isAgent ? (
          <div className="flex flex-wrap items-center justify-center gap-6">
            <Button
              variant="primary"
              size="lg"
              type="submit"
              form={FORM_ID}
              isLoading={isSaving}
              disabled={!data}
            >
              Save
            </Button>
            <Button
              variant="danger"
              size="lg"
              onClick={() => setConfirmClear(true)}
              disabled={!data || confirmClear}
            >
              Clear Credit of Group
            </Button>
            <Button variant="secondary" size="lg" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : undefined
      }
    >
      {isLoading ? (
        <StateMessage variant="loading" />
      ) : isError || !data ? (
        <StateMessage variant="error" message="Could not load the credit" onRetry={refetch} />
      ) : (
        <>
          {/* Remount when the server value changes, so "set to" compares against what is there now. */}
          <CreditAmountFormBody
            key={`${id}:${data.creditAmount}`}
            kind={kind}
            id={id}
            info={data}
            onDone={onClose}
          />
          {isAgent && confirmClear && (
            <div
              role="alertdialog"
              aria-label="Clear credit of group"
              className="mt-4 flex flex-wrap items-center gap-3 rounded-xs border border-danger/60 bg-danger/10 px-3 py-2.5 text-sm"
            >
              <span className="flex-1">
                Take back every unused credit of {username}&apos;s players and sub-agents?
              </span>
              <Button variant="danger" size="sm" isLoading={isClearing} onClick={onClear}>
                Yes, clear
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setConfirmClear(false)}>
                Cancel
              </Button>
            </div>
          )}
        </>
      )}
    </ModalShell>
  );
};

export default CreditAmountModal;
