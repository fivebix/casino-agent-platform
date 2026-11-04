'use client';

import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useRouter } from 'next/navigation';
import ModalShell from '@/components/modals/ModalShell';
import { Input } from '@/components/ui/input';
import { useForgotPasswordMutation } from '@/services/agentApi';
import { setResetEmail } from '@/hooks/useResetEmail';
import { useTenant } from '@/hooks/useTenant';
import { ROUTES } from '@/lib/constants';
import { forgotPasswordSchema } from './schema';
import type { ForgotPasswordForm, ForgotPasswordModalProps } from './type';

const FORM_ID = 'forgot-password-form';

/**
 * Email → `POST /agent/auth/forgot-password` (always 200; a 6-digit OTP is emailed), then /reset-password.
 * The email travels in sessionStorage, never in the URL.
 */
const ForgotPasswordModal = ({ isOpen, onClose, email }: ForgotPasswordModalProps) => {
  const router = useRouter();
  const { operatorId } = useTenant();
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: yupResolver(forgotPasswordSchema),
    defaultValues: { email: email ?? '' },
  });

  const onSubmit = async ({ email: value }: ForgotPasswordForm) => {
    if (!operatorId) return;
    try {
      await forgotPassword({ operatorId, email: value }).unwrap();
      setResetEmail(value);
      onClose();
      router.push(ROUTES.resetPassword);
    } catch {
      // The global toast shows the server message.
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Forgot password"
      icon="lucide:key-round"
      size="sm"
      formId={FORM_ID}
      saveLabel="Send code"
      isSaving={isLoading}
      saveDisabled={!operatorId}
    >
      <form id={FORM_ID} onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3">
        <p className="text-sm text-muted">
          Enter the email on your agent account. We will send you a 6-digit code to set a new
          password.
        </p>
        <label htmlFor="forgot-email" className="block text-sm font-semibold">
          Email
        </label>
        <Input
          id="forgot-email"
          type="email"
          autoComplete="email"
          autoFocus
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />
        {!operatorId && (
          <p className="text-xs text-negative">Operator not resolved — reload the page.</p>
        )}
      </form>
    </ModalShell>
  );
};

export default ForgotPasswordModal;
