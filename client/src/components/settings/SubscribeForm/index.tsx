'use client';

import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Icon } from '@iconify/react';
import StateMessage from '@/components/common/StateMessage';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { EXTERNAL_LINKS } from '@/lib/constants';
import {
  useGetSubscribeSettingsQuery,
  useUpdateSubscribeSettingsMutation,
} from '@/services/agentApi';
import type { SubscribeSettings } from '@/types/agent';
import { SUBSCRIBE_ROWS, subscribeSchema } from './schema';
import type { SubscribeFormValues } from './type';

const toForm = (s: Partial<SubscribeSettings> | undefined): SubscribeFormValues => ({
  rows: Object.fromEntries(
    SUBSCRIBE_ROWS.map((r) => {
      const v = s?.[r.key];
      return r.threshold
        ? [r.key, { enabled: typeof v === 'number', value: typeof v === 'number' ? v : 0 }]
        : [r.key, { enabled: v === true, value: 0 }];
    }),
  ),
});

/** Design 07. `GET` / `PUT /agent/settings/subscribe` (the caller's own Telegram alerts). */
const SubscribeForm = () => {
  const { data, isLoading, isError, refetch } = useGetSubscribeSettingsQuery();
  const [save, { isLoading: isSaving }] = useUpdateSubscribeSettingsMutation();

  const values = useMemo(() => (data ? toForm(data) : undefined), [data]);

  const { register, handleSubmit, formState } = useForm<SubscribeFormValues>({
    // The schema's rows are built from SUBSCRIBE_ROWS, so its inferred type is looser than the form's.
    resolver: yupResolver(subscribeSchema) as never,
    defaultValues: toForm(undefined),
    values,
  });

  const onSubmit = async ({ rows }: SubscribeFormValues) => {
    const body = { telegramChatId: data?.telegramChatId ?? null } as SubscribeSettings;
    for (const r of SUBSCRIBE_ROWS) {
      const { enabled, value } = rows[r.key];
      if (r.threshold) body[r.key] = enabled ? value : null;
      else body[r.key] = enabled;
    }
    try {
      await save(body).unwrap();
    } catch {
      // Global toast shows the server message.
    }
  };

  if (isLoading) return <StateMessage variant="loading" className="justify-center" />;
  if (isError) {
    return (
      <StateMessage
        variant="error"
        message="Could not load the settings"
        onRetry={refetch}
        className="justify-center"
      />
    );
  }

  const subscribed = !!data?.telegramChatId;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="mx-auto max-w-[760px]">
      <div className="mx-auto flex w-full max-w-[420px] flex-col items-center gap-5 rounded-xs bg-panel-2 px-6 py-10">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-telegram text-white">
          <Icon icon="lucide:send" className="h-8 w-8" />
        </span>
        {EXTERNAL_LINKS.telegram ? (
          <Button asChild variant="light" size="md" className="w-[168px]">
            <a href={EXTERNAL_LINKS.telegram} target="_blank" rel="noreferrer">
              <Icon icon="lucide:send" className="h-4 w-4 text-telegram" />
              {subscribed ? 'Subscribed' : 'Subscribe'}
            </a>
          </Button>
        ) : (
          <Button type="button" variant="light" size="md" className="w-[168px]" disabled>
            <Icon icon="lucide:send" className="h-4 w-4 text-telegram" />
            Subscribe
          </Button>
        )}
      </div>

      <div className="mt-6">
        {SUBSCRIBE_ROWS.map((r) => {
          const error = formState.errors.rows?.[r.key]?.value?.message;
          return (
            <div key={r.key} className="border-b border-[#3a3a40] px-3 py-2.5">
              <div className="flex min-h-[30px] items-center justify-between gap-4">
                <Checkbox label={r.label} {...register(`rows.${r.key}.enabled`)} />
                {r.threshold && (
                  <Input
                    variant="compact"
                    aria-label={`${r.label} threshold`}
                    type="number"
                    min={0}
                    step="0.01"
                    className="border-border-strong"
                    {...register(`rows.${r.key}.value`, { valueAsNumber: true })}
                  />
                )}
              </div>
              {error && <p className="mt-1 text-right text-xs text-negative">{error}</p>}
            </div>
          );
        })}
      </div>

      <div className="mt-7 flex justify-center">
        <Button type="submit" size="lg" isLoading={isSaving}>
          Save
        </Button>
      </div>
    </form>
  );
};

export default SubscribeForm;
