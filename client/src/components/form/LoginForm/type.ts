import type { InferType } from 'yup';
import type { loginSchema } from './schema';

export type LoginFormValues = InferType<typeof loginSchema>;
