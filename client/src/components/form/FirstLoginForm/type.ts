import type { InferType } from 'yup';
import type { firstLoginSchema } from './schema';

export type FirstLoginFormValues = InferType<typeof firstLoginSchema>;
