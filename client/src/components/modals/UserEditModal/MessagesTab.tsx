'use client';

import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import FormRow from '@/components/form/FormRow';
import StateMessage from '@/components/common/StateMessage';
import { Input, inputVariants } from '@/components/ui/input';
import { formatTimeDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useGetUserMessagesQuery, useSendUserMessageMutation } from '@/services/agentApi';
import { SAVE_CACHE_KEY } from './constants';
import { messageSchema } from './schema';
import type { MessageFormValues, TabProps } from './type';

/** Design 13. `POST /agent/:kind/:id/messages`, history from `GET` below the form. */
const MessagesTab = ({ kind, id, formId }: TabProps) => {
  const [sendMessage] = useSendUserMessageMutation({ fixedCacheKey: SAVE_CACHE_KEY.messages });
  const history = useGetUserMessagesQuery({ kind, id });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MessageFormValues>({
    resolver: yupResolver(messageSchema),
    defaultValues: { title: '', body: '' },
  });

  const onSubmit = async (form: MessageFormValues) => {
    try {
      await sendMessage({ kind, id, title: form.title, body: form.body }).unwrap();
      reset();
    } catch {
      // Global toast shows the server message.
    }
  };

  return (
    <div>
      <form id={formId} onSubmit={handleSubmit(onSubmit)} noValidate>
        <p className="pb-2 text-center text-[13px] font-bold text-lime">New Mess</p>
        <FormRow label="Title*" htmlFor="ue-msg-title" error={errors.title?.message}>
          <Input id="ue-msg-title" maxLength={200} autoComplete="off" {...register('title')} />
        </FormRow>
        <FormRow label="Message Text*" htmlFor="ue-msg-body" error={errors.body?.message}>
          <textarea
            id="ue-msg-body"
            rows={5}
            maxLength={5000}
            aria-invalid={errors.body ? true : undefined}
            className={cn(inputVariants(), 'h-28 resize-y py-2')}
            {...register('body')}
          />
        </FormRow>
      </form>

      <section className="mt-6">
        <h3 className="border-b border-[#3a3a40] pb-2 text-sm font-semibold text-foreground">
          Sent messages
        </h3>
        {history.isLoading ? (
          <StateMessage variant="loading" />
        ) : history.isError ? (
          <StateMessage
            variant="error"
            message="Could not load the messages"
            onRetry={history.refetch}
          />
        ) : !history.data?.length ? (
          <StateMessage variant="empty" message="No messages yet" />
        ) : (
          <ul className="divide-y divide-[#3a3a40]">
            {history.data.map((m) => (
              <li key={m.id} className="py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-semibold text-foreground">{m.title}</span>
                  <span className="shrink-0 text-xs text-muted">
                    {m.createdByName} · {formatTimeDate(m.createdAt)}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-line break-words text-sm text-muted">{m.body}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default MessagesTab;
