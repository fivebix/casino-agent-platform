'use client';

import { useForm, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import AuthField from '@/components/form/AuthField';
import PasswordChecklist from '@/components/form/PasswordChecklist';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLogout } from '@/hooks/useLogout';
import { PASSWORD_MIN_LENGTH } from '@/lib/constants';
import { useSetPasswordMutation } from '@/services/agentApi';
import { firstLoginSchema } from './schema';
import type { FirstLoginFormValues } from './type';

/**
 * Design 27. `POST /agent/auth/set-password` with only `newPassword` (allowed while `mustChangePassword`).
 * Success clears `mustChangePassword` in the auth slice; AuthGuardLayout then sends the agent to /users.
 *
 * Note: the design copy says "no rules, no minimum", but the API contract requires 8+ characters, so the
 * copy and the checklist follow the contract.
 */
const FirstLoginForm = () => {
  const [setPassword, { isLoading }] = useSetPasswordMutation();
  const { logout } = useLogout();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid },
  } = useForm<FirstLoginFormValues>({
    resolver: yupResolver(firstLoginSchema),
    mode: 'onChange',
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const [newPassword, confirmPassword] = useWatch({
    control,
    name: ['newPassword', 'confirmPassword'],
  });

  const onSubmit = async ({ newPassword: value }: FirstLoginFormValues) => {
    try {
      await setPassword({ newPassword: value }).unwrap();
    } catch {
      // Global toast shows the server message.
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <span className="inline-block rounded-full border border-lime/70 bg-lime/10 px-2.5 py-1 text-[10px] font-bold tracking-[0.14em] text-lime">
        FIRST LOGIN · STEP 2 OF 2
      </span>
      <h1 className="mt-4 text-[28px] font-bold tracking-tight text-foreground">
        Create your new password
      </h1>
      <p className="mt-2.5 text-sm leading-5 text-muted">
        The temporary password from your agent works once. Choose your own password to enter the
        panel.
      </p>

      <div className="mt-8 space-y-6">
        <AuthField label="New password" htmlFor="newPassword">
          <Input
            id="newPassword"
            type="password"
            variant="auth"
            autoComplete="new-password"
            autoFocus
            placeholder="••••"
            {...register('newPassword')}
          />
        </AuthField>
        <AuthField label="Confirm password" htmlFor="confirmPassword">
          <Input
            id="confirmPassword"
            type="password"
            variant="auth"
            autoComplete="new-password"
            placeholder="••••"
            error={confirmPassword ? errors.confirmPassword?.message : undefined}
            {...register('confirmPassword')}
          />
        </AuthField>
      </div>

      <p className="mt-3 text-xs leading-[18px] text-muted">
        At least {PASSWORD_MIN_LENGTH} characters. No other rules.
      </p>
      <div className="mt-4">
        <PasswordChecklist
          rules={[
            {
              label: `At least ${PASSWORD_MIN_LENGTH} characters`,
              met: (newPassword?.length ?? 0) >= PASSWORD_MIN_LENGTH,
            },
            { label: 'Both fields match', met: !!newPassword && newPassword === confirmPassword },
          ]}
        />
      </div>

      <Button type="submit" size="pill" className="mt-7" isLoading={isLoading} disabled={!isValid}>
        Save password &amp; enter the panel
      </Button>
      <p className="mt-5 text-center text-xs text-muted">
        Not you?{' '}
        <button type="button" onClick={logout} className="text-foreground hover:text-lime">
          Sign out
        </button>
      </p>
    </form>
  );
};

export default FirstLoginForm;
