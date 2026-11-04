import type { InferType } from 'yup';
import type { ModalBaseProps } from '@/types/common';
import type { backupCreditSchema } from './schema';

export type BackupCreditForm = InferType<typeof backupCreditSchema>;

export type BackupCreditModalProps = ModalBaseProps & {
  /** Agent id. */
  id: string;
  username: string;
  /** Current backup credit (from the users list row). */
  amount: number;
};
