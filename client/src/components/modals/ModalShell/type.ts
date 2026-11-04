export type ModalShellSize = 'sm' | 'md' | 'lg';

export type ModalShellProps = {
  isOpen: boolean;
  onClose: () => void;
  /** e.g. "Credit amount AG004", "User Edit AG004", "Balance". */
  title: React.ReactNode;
  /** Small lime line under the header (User Edit: `AG004  [21:57 25.09.26]`). */
  subtitle?: React.ReactNode;
  /** Iconify name inside the round lime badge. Default `lucide:user-round`. */
  icon?: string;
  /** sm ≈ 520px, md ≈ 700px (Balance / Credit amount), lg ≈ 900px (User Edit). Default md. */
  size?: ModalShellSize;
  children: React.ReactNode;

  /**
   * Footer. Shows `Save` only when `onSave` is given (or `formId` for a submit button), always `Close`.
   * Pass `footer` to replace it entirely, or `hideFooter`.
   */
  onSave?: () => void;
  /** Makes Save a `type="submit"` button for `<form id={formId}>` inside the body. */
  formId?: string;
  saveLabel?: string;
  closeLabel?: string;
  isSaving?: boolean;
  saveDisabled?: boolean;
  footer?: React.ReactNode;
  hideFooter?: boolean;
  bodyClassName?: string;
};
