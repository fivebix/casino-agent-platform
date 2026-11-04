import type { InferType } from 'yup';
import type { ModalBaseProps } from '@/types/common';
import type { forgotPasswordSchema } from './schema';

export type ForgotPasswordForm = InferType<typeof forgotPasswordSchema>;

export type ForgotPasswordModalProps = ModalBaseProps & {
  /** Pre-fills the field (e.g. "Resend code" on /reset-password). */
  email?: string;
};
