import type { InferType } from 'yup';
import type { extraCreditsSchema } from './schema';

export type ExtraCreditsFormValues = InferType<typeof extraCreditsSchema>;
