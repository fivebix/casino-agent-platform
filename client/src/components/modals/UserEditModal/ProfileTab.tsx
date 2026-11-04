'use client';

import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import FormRow from '@/components/form/FormRow';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { formatAmount } from '@/lib/format';
import { useUpdateUserProfileMutation } from '@/services/agentApi';
import type { UpdateProfileRequest } from '@/types/agent';
import { SAVE_CACHE_KEY } from './constants';
import { profileSchema } from './schema';
import type { ProfileFormValues, TabProps } from './type';

const FIELD = 'max-w-[280px]';

/** Design 10. `PATCH /agent/:kind/:id/profile`; the password is sent only when typed. */
const ProfileTab = ({ kind, id, detail, formId }: TabProps) => {
  const [updateProfile] = useUpdateUserProfileMutation({ fixedCacheKey: SAVE_CACHE_KEY.profile });

  const values = useMemo<ProfileFormValues>(
    () => ({
      name: detail.name,
      password: '',
      confirmPassword: '',
      isActive: detail.isActive,
      autoWeeklyCredit: detail.autoWeeklyCredit,
      autoWeeklyEnabled: detail.autoWeeklyEnabled,
    }),
    [detail],
  );

  const {
    register,
    handleSubmit,
    resetField,
    formState: { errors },
  } = useForm<ProfileFormValues>({ resolver: yupResolver(profileSchema), values });

  const onSubmit = async (form: ProfileFormValues) => {
    const body: UpdateProfileRequest = {
      name: form.name,
      isActive: form.isActive,
      autoWeeklyCredit: form.autoWeeklyCredit,
      autoWeeklyEnabled: form.autoWeeklyEnabled,
      ...(form.password ? { password: form.password } : {}),
    };
    try {
      await updateProfile({ kind, id, body }).unwrap();
      resetField('password');
      resetField('confirmPassword');
    } catch {
      // Global toast shows the server message.
    }
  };

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} noValidate>
      <FormRow label="Username">{detail.username}</FormRow>
      <FormRow label="Name" htmlFor="ue-name" error={errors.name?.message}>
        <Input id="ue-name" className={FIELD} autoComplete="off" {...register('name')} />
      </FormRow>
      <FormRow label="Password" htmlFor="ue-password" error={errors.password?.message}>
        <Input
          id="ue-password"
          type="password"
          className={FIELD}
          autoComplete="new-password"
          {...register('password')}
        />
      </FormRow>
      <FormRow
        label="Confirm password"
        htmlFor="ue-confirm"
        error={errors.confirmPassword?.message}
      >
        <Input
          id="ue-confirm"
          type="password"
          className={FIELD}
          autoComplete="new-password"
          {...register('confirmPassword')}
        />
      </FormRow>
      <FormRow label="User is active">
        <Checkbox aria-label="User is active" {...register('isActive')} />
      </FormRow>
      <FormRow label="Leader of group">{detail.leaderName ?? '—'}</FormRow>
      <FormRow label="Credit amount">
        <Input
          aria-label="Credit amount"
          className={FIELD}
          value={formatAmount(detail.creditLimit)}
          readOnly
          disabled
        />
      </FormRow>
      <FormRow
        label="Auto weekly credit"
        htmlFor="ue-auto-weekly"
        error={errors.autoWeeklyCredit?.message}
      >
        <div className="flex items-center gap-3">
          <Input
            id="ue-auto-weekly"
            type="number"
            min={0}
            step="0.01"
            wrapperClassName="w-[160px]"
            {...register('autoWeeklyCredit', { valueAsNumber: true })}
          />
          <Checkbox tone="lime" label="every Tuesday 11:00" {...register('autoWeeklyEnabled')} />
        </div>
      </FormRow>
      <FormRow label="Bonus of lose">{formatAmount(detail.sportsDiscount)}</FormRow>
      <FormRow label="Our slice">{formatAmount(detail.sportShare)}</FormRow>
      <FormRow label="Our casino slice">{formatAmount(detail.casinoShare)}</FormRow>
      <FormRow label="Multiplier">{formatAmount(detail.multiplier)}</FormRow>
    </form>
  );
};

export default ProfileTab;
