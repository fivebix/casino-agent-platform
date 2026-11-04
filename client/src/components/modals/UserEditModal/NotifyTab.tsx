'use client';

import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useUpdateUserNotifyMutation } from '@/services/agentApi';
import { NOTIFY_ROWS, SAVE_CACHE_KEY } from './constants';
import { notifySchema } from './schema';
import type { NotifyFormValues, TabProps } from './type';
import { asRecord, readBool, readNumber } from './utils';

/**
 * Design 15. `notify` JSON = `{ [row]: { enabled, value? } }` → `PATCH /agent/:kind/:id/notify`.
 * `lowCredit.value` is a percent of the credit.
 */
const NotifyTab = ({ kind, id, detail, formId }: TabProps) => {
  const [updateNotify] = useUpdateUserNotifyMutation({ fixedCacheKey: SAVE_CACHE_KEY.notify });

  const values = useMemo<NotifyFormValues>(
    () => ({
      notify: Object.fromEntries(
        NOTIFY_ROWS.map((row) => {
          const s = asRecord(detail.notify?.[row.key]);
          return [row.key, { enabled: readBool(s.enabled), value: readNumber(s.value) }];
        }),
      ),
    }),
    [detail],
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NotifyFormValues>({
    // The schema's rows are built from NOTIFY_ROWS, so its inferred type is looser than the form's.
    resolver: yupResolver(notifySchema) as never,
    values,
  });

  const onSubmit = async (form: NotifyFormValues) => {
    const notify = Object.fromEntries(
      NOTIFY_ROWS.map((row) => {
        const v = form.notify[row.key];
        return [
          row.key,
          row.threshold ? { enabled: v.enabled, value: v.value } : { enabled: v.enabled },
        ];
      }),
    );
    try {
      await updateNotify({ kind, id, notify: { ...detail.notify, ...notify } }).unwrap();
    } catch {
      // Global toast shows the server message.
    }
  };

  return (
    <form
      id={formId}
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="mx-auto max-w-[640px]"
    >
      {NOTIFY_ROWS.map((row) => {
        const error = errors.notify?.[row.key]?.value?.message;
        return (
          <div key={row.key} className="border-b border-[#3a3a40] py-2">
            <div className="flex min-h-[30px] items-center justify-between gap-4">
              <Checkbox label={row.label} {...register(`notify.${row.key}.enabled`)} />
              {row.threshold && (
                <div className="flex shrink-0 items-center gap-2">
                  <Input
                    aria-label={`${row.label} threshold`}
                    type="number"
                    min={0}
                    max={row.threshold === 'percent' ? 100 : undefined}
                    step="0.01"
                    wrapperClassName="w-[224px]"
                    className="h-[30px] border-border-strong"
                    {...register(`notify.${row.key}.value`, { valueAsNumber: true })}
                  />
                  {row.threshold === 'percent' && (
                    <span className="text-xs text-foreground">%</span>
                  )}
                </div>
              )}
            </div>
            {error && <p className="mt-1 text-right text-xs text-negative">{error}</p>}
          </div>
        );
      })}
    </form>
  );
};

export default NotifyTab;
