'use client';

import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import InfoTip from '@/components/common/InfoTip';
import StateMessage from '@/components/common/StateMessage';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useGetUsersQuery, useSetExtraCreditsMutation } from '@/services/agentApi';
import { extraCreditsSchema } from './schema';
import type { ExtraCreditsFormValues } from './type';

const cell = 'border border-[#3a3a40] px-1.5 py-1';

/**
 * Design 08. One `POST /agent/extra-credits { target, amount }` per ticked row: `'all'` for the first row,
 * otherwise the player's user id. Players come from `GET /agent/users` (`kind === 'player'`).
 */
const ExtraCreditsForm = () => {
  const { data, isLoading, isError, refetch } = useGetUsersQuery({});
  const [setExtraCredits, { isLoading: isSaving }] = useSetExtraCreditsMutation();

  const values = useMemo<ExtraCreditsFormValues>(
    () => ({
      rows: [
        { target: 'all', label: 'All users', selected: false, amount: 0 },
        ...(data?.rows ?? [])
          .filter((r) => r.kind === 'player' && r.isActive)
          .map((r) => ({ target: r.id, label: r.username, selected: false, amount: 0 })),
      ],
    }),
    [data],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExtraCreditsFormValues>({
    resolver: yupResolver(extraCreditsSchema),
    values,
    // Each save refetches the players; keep what the agent typed.
    resetOptions: { keepDirtyValues: true },
  });

  // Rows that went through are cleared; failed ones stay ticked, so a retry cannot pay anyone twice.
  const onSubmit = async ({ rows }: ExtraCreditsFormValues) => {
    const next = [...rows];
    for (const [i, r] of rows.entries()) {
      if (!r.selected || !r.amount) continue;
      try {
        await setExtraCredits({ target: r.target, amount: r.amount }).unwrap();
        next[i] = { ...r, selected: false, amount: 0 };
      } catch {
        // Global toast shows the server message.
      }
    }
    reset({ rows: next });
  };

  if (isLoading) return <StateMessage variant="loading" className="justify-center" />;
  if (isError) {
    return (
      <StateMessage
        variant="error"
        message="Could not load your players"
        onRetry={refetch}
        className="justify-center"
      />
    );
  }

  const rowsError = errors.rows?.root?.message ?? errors.rows?.message;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="mx-auto max-w-[760px]">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="text-[11px] font-semibold uppercase text-foreground">
            <th className={cn(cell, 'h-10 w-[125px] text-left')}>
              <span className="inline-flex items-center gap-1">
                User
                <InfoTip
                  text="All players, or one of your players, to give extra credit to."
                  placement="bottom"
                />
              </span>
            </th>
            <th className={cn(cell, 'w-[46px]')}>
              <span className="sr-only">Selected</span>
            </th>
            <th className={cell}>
              <span className="inline-flex items-center justify-center gap-1">
                Amount
                <InfoTip
                  text="Extra credit to add to each selected player, from your own pool."
                  placement="bottom"
                />
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {values.rows.map((r, i) => {
            const amountError = errors.rows?.[i]?.amount?.message;
            return (
              <tr key={r.target} className="bg-panel">
                <td className={cn(cell, 'h-[39px]', i === 0 && 'font-semibold')}>{r.label}</td>
                <td className={cn(cell, 'text-center')}>
                  <Checkbox aria-label={`Select ${r.label}`} {...register(`rows.${i}.selected`)} />
                </td>
                <td className={cn(cell, 'text-center')}>
                  <Input
                    aria-label={`Amount for ${r.label}`}
                    type="number"
                    min={0}
                    step="0.01"
                    wrapperClassName="mx-auto w-[160px]"
                    className="h-[30px] border-border-strong text-center"
                    error={amountError}
                    {...register(`rows.${i}.amount`, { valueAsNumber: true })}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {values.rows.length === 1 && (
        <StateMessage
          variant="empty"
          message="You have no players yet"
          className="justify-center"
        />
      )}
      {rowsError && <p className="mt-2 text-center text-xs text-negative">{rowsError}</p>}

      <div className="mt-7 flex items-center justify-center gap-4">
        <Button type="button" variant="secondary" size="md" onClick={() => reset(values)}>
          Reset
        </Button>
        <Button type="submit" size="lg" isLoading={isSaving}>
          Save
        </Button>
      </div>
    </form>
  );
};

export default ExtraCreditsForm;
