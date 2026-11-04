import type { InferType } from 'yup';
import type { ModalBaseProps } from '@/types/common';
import type { UserKindPath, WeekStart } from '@/types/agent';
import type { calculationSchema } from './schema';

export type CalculationForm = InferType<typeof calculationSchema>;

export type CalculationModalProps = ModalBaseProps & {
  kind: UserKindPath;
  id: string;
  username: string;
  /** The week shown in the list; the backend only adds corrections to the current week. */
  weekStart?: WeekStart;
  isCurrentWeek: boolean;
};
