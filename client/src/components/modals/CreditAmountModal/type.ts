import type { InferType } from 'yup';
import type { ModalBaseProps } from '@/types/common';
import type { UserKindPath } from '@/types/agent';
import type { creditAmountSchema } from './schema';

export type CreditAmountForm = InferType<typeof creditAmountSchema>;

export type CreditAmountModalProps = ModalBaseProps & {
  kind: UserKindPath;
  id: string;
  username: string;
};
