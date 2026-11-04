import type { InferType } from 'yup';
import type { changePasswordSchema } from './schema';

export type ChangePasswordFormValues = InferType<typeof changePasswordSchema>;
