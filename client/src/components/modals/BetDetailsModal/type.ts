import type { ModalBaseProps } from '@/types/common';
import type { ChanceBet, SportBet } from '@/types/agent';

export type BetDetailsModalProps = ModalBaseProps & {
  /** The row as the table received it (plain data, so it can live in the modal slice). */
  bet: SportBet | ChanceBet;
};

export type DetailRow = {
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
};
