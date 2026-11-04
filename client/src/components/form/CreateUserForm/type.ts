import type { InferType } from 'yup';
import type { createUserSchema } from './schema';

export type CreateUserFormValues = InferType<typeof createUserSchema>;
export type CreateUserType = CreateUserFormValues['type'];
