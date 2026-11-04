import type { InferType } from 'yup';
import type { resetPasswordSchema } from './schema';

export type ResetPasswordFormValues = InferType<typeof resetPasswordSchema>;
