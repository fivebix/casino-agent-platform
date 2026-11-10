'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Icon } from '@iconify/react';
import ModalShell from '@/components/modals/ModalShell';
import StateMessage from '@/components/common/StateMessage';
import { Input } from '@/components/ui/input';
import { AmountCell } from '@/components/tables/cellRenderers';
import { useAddCorrectionMutation, useGetCorrectionsQuery } from '@/services/agentApi';
import InfoTip from '@/components/common/InfoTip';
import { formatAmount, formatTimeDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { calculationSchema } from './schema';
import type { CalculationForm, CalculationModalProps } from './type';

const FORM_ID = 'calculation-form';

/** White inputs from design 16. */
const whiteInput = 'h-[30px] bg-white text-[#18181b] placeholder:text-[#71717a]';

const HISTORY_COLUMNS = [
  { label: 'Date', info: 'When the correction was added, in your time zone.' },
  { label: 'Sum', info: 'The amount added to (or, if negative, taken from) the calc.' },
  { label: 'Comment', info: 'The note written with the correction.' },
  { label: 'By', info: 'Who added the correction.' },
];

/**
 * Design 16, opened from CALC. `GET /agent/:kind/:id/corrections` (current sum + history + whether the week is
 * still open for this user), Save → `POST /agent/:kind/:id/corrections { amount, comment, weekStart }`. Once a week
 * is over nothing can be added to it: the form is hidden and the backend refuses it (AGENT_WEEK_CLOSED).
 */
const CalculationModal = ({
  isOpen,
  onClose,
  kind,
  id,
  username,
  weekStart,
  isCurrentWeek,
}: CalculationModalProps) => {
  const [showHistory, setShowHistory] = useState(false);
  const { data, isLoading, isError, refetch } = useGetCorrectionsQuery(
    { kind, id, weekStart },
    { refetchOnMountOrArgChange: true },
  );
  const [addCorrection, { isLoading: isSaving }] = useAddCorrectionMutation();
  // Open only while both the list's week and this user's own week (its time zone) are still running.
  const canEdit = isCurrentWeek && (data ? data.isCurrent : !isLoading);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CalculationForm>({ resolver: yupResolver(calculationSchema) });

  const onSubmit = async (values: CalculationForm) => {
    try {
      await addCorrection({
        kind,
        id,
        amount: values.amount,
        comment: values.comment || undefined,
        weekStart,
      }).unwrap();
      reset({ amount: undefined, comment: '' });
      onClose();
    } catch {
      // The global toast shows the server message.
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={`Calculation ${username}`}
      size="lg"
      formId={canEdit ? FORM_ID : undefined}
      isSaving={isSaving}
      bodyClassName="px-0 py-5"
    >
      <div className="flex h-9 items-center justify-center gap-2 bg-panel-2 text-sm font-bold text-lime">
        Current sum
        {isLoading ? (
          <span className="inline-block h-3 w-10 animate-pulse rounded-xs bg-white/10" />
        ) : (
          <span>{formatAmount(data?.currentSum)}</span>
        )}
      </div>
      {isError && (
        <StateMessage
          variant="error"
          message="Could not load the calculation"
          onRetry={refetch}
          className="px-6"
        />
      )}

      {canEdit ? (
        <form
          id={FORM_ID}
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="grid grid-cols-1 gap-x-10 gap-y-3 px-6 pt-4 sm:grid-cols-2"
        >
          <div className="flex flex-col items-center gap-2">
            <label htmlFor="correction-sum" className="text-sm text-foreground">
              Correction sum
            </label>
            <Input
              id="correction-sum"
              type="number"
              inputMode="decimal"
              step="0.01"
              autoFocus
              className={whiteInput}
              error={errors.amount?.message}
              {...register('amount')}
            />
          </div>
          <div className="flex flex-col items-center gap-2">
            <label htmlFor="correction-comment" className="text-sm text-foreground">
              Comment
            </label>
            <Input
              id="correction-comment"
              maxLength={255}
              className={whiteInput}
              error={errors.comment?.message}
              {...register('comment')}
            />
          </div>
        </form>
      ) : (
        <p className="px-6 pt-4 text-center text-sm text-muted">
          {isLoading
            ? 'Loading…'
            : 'This week is closed. Its figures can no longer be changed; corrections go on the current week only.'}
        </p>
      )}

      <div className="relative mt-5 flex h-8 items-center justify-center px-6">
        <button
          type="button"
          onClick={() => setShowHistory((v) => !v)}
          aria-expanded={showHistory}
          aria-label={showHistory ? 'Hide correction history' : 'Show correction history'}
          className="absolute left-6 flex h-[18px] w-[18px] items-center justify-center rounded-xs bg-lime text-lime-ink"
        >
          <Icon icon={showHistory ? 'lucide:minus' : 'lucide:plus'} className="h-3.5 w-3.5" />
        </button>
        <span className="text-sm text-foreground">Correction history</span>
      </div>

      {showHistory && (
        <div className="px-6 pt-2">
          {isLoading ? (
            <StateMessage variant="loading" />
          ) : !data?.items.length ? (
            <StateMessage variant="empty" message="No corrections this week" />
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  {HISTORY_COLUMNS.map((h) => (
                    <th
                      key={h.label}
                      scope="col"
                      className="h-8 border border-[#36363c] bg-panel-2 px-2 text-[11px] font-bold uppercase"
                    >
                      <span className="inline-flex items-center justify-center gap-1">
                        {h.label}
                        <InfoTip text={h.info} placement="bottom" />
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.items.map((c) => (
                  <tr key={c.id} className="bg-row">
                    <td className={cn(cellClass, 'whitespace-nowrap')}>
                      {formatTimeDate(c.createdAt)}
                    </td>
                    <td className={cellClass}>
                      <AmountCell value={Number(c.amount)} signed />
                    </td>
                    <td className={cn(cellClass, 'text-left')}>{c.comment || '—'}</td>
                    <td className={cellClass}>{c.createdByName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </ModalShell>
  );
};

const cellClass = 'h-9 border border-[#36363c] px-2 text-center';

export default CalculationModal;
