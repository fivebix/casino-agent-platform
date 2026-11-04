'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import toast from 'react-hot-toast';
import AuthField from '@/components/form/AuthField';
import PasswordChecklist from '@/components/form/PasswordChecklist';
import TenantNotice from '@/components/form/TenantNotice';
import { MODAL_TYPES } from '@/components/modals/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useModal } from '@/hooks/useModal';
import { useTenant } from '@/hooks/useTenant';
import { setResetEmail, useResetEmail } from '@/hooks/useResetEmail';
import { PASSWORD_MIN_LENGTH, ROUTES } from '@/lib/constants';
import { useResetPasswordMutation } from '@/services/agentApi';
import { resetPasswordSchema } from './schema';
import type { ResetPasswordFormValues } from './type';

/**
 * OTP + new password → `POST /agent/auth/reset-password`. The email comes from sessionStorage, written by
 * the forgot-password dialog; without it the screen asks the agent to request a code first.
 */
const ResetPasswordForm = () => {
  const router = useRouter();
  const { open } = useModal();
  const { operatorId } = useTenant();
  const email = useResetEmail();
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: yupResolver(resetPasswordSchema),
    defaultValues: { otp: '', newPassword: '', confirmPassword: '' },
  });
  const [newPassword, confirmPassword] = useWatch({
    control,
    name: ['newPassword', 'confirmPassword'],
  });

  const onSubmit = async ({ otp, newPassword: value }: ResetPasswordFormValues) => {
    if (!operatorId || !email) return;
    try {
      await resetPassword({ operatorId, email, otp, newPassword: value }).unwrap();
      setResetEmail(null);
      toast.success('Password changed. Sign in with your new password.', { id: 'reset-ok' });
      router.replace(ROUTES.login);
    } catch {
      // Global toast shows the server message (e.g. wrong or expired code).
    }
  };

  if (!email) {
    return (
      <div>
        <h1 className="text-[28px] font-bold tracking-tight text-foreground">Reset password</h1>
        <p className="mt-2.5 text-sm leading-5 text-muted">
          Request a reset code first. We will email you a 6-digit code.
        </p>
        <Button size="pill" className="mt-8" onClick={() => open(MODAL_TYPES.FORGOT_PASSWORD)}>
          Send me a code
        </Button>
        <p className="mt-5 text-center text-xs text-muted">
          <Link href={ROUTES.login} className="text-foreground hover:text-lime">
            Back to login
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <h1 className="text-[28px] font-bold tracking-tight text-foreground">Reset password</h1>
      <p className="mt-2.5 text-sm leading-5 text-muted">
        We sent a 6-digit code to <span className="text-foreground">{email}</span>. It is valid for
        10 minutes.
      </p>

      <div className="mt-8 space-y-6">
        <TenantNotice />
        <AuthField
          label="Code"
          htmlFor="otp"
          aside={
            <button
              type="button"
              onClick={() => open(MODAL_TYPES.FORGOT_PASSWORD, { email })}
              className="text-xs text-muted hover:text-lime"
            >
              Resend code
            </button>
          }
        >
          <Input
            id="otp"
            variant="auth"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            autoFocus
            placeholder="000000"
            className="tracking-[0.4em]"
            error={errors.otp?.message}
            {...register('otp')}
          />
        </AuthField>
        <AuthField label="New password" htmlFor="newPassword">
          <Input
            id="newPassword"
            type="password"
            variant="auth"
            autoComplete="new-password"
            error={errors.newPassword?.message}
            {...register('newPassword')}
          />
        </AuthField>
        <AuthField label="Confirm password" htmlFor="confirmPassword">
          <Input
            id="confirmPassword"
            type="password"
            variant="auth"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
        </AuthField>
      </div>

      <div className="mt-5">
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

      <Button
        type="submit"
        size="pill"
        className="mt-7"
        isLoading={isLoading}
        disabled={!operatorId}
      >
        Set new password
      </Button>
      <p className="mt-5 text-center text-xs text-muted">
        <Link href={ROUTES.login} className="text-foreground hover:text-lime">
          Back to login
        </Link>
      </p>
    </form>
  );
};

export default ResetPasswordForm;
