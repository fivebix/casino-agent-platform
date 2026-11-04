import { cn } from '@/lib/utils';

type Props = {
  label: React.ReactNode;
  /** Red asterisk after the label. */
  required?: boolean;
  /** The control (Input / Select / Checkbox) or a read-only value. */
  children: React.ReactNode;
  /** Error under the control. */
  error?: string;
  htmlFor?: string;
  className?: string;
};

/**
 * Two-column form row used by Create New Player, Credit amount and User Edit: label on the left over a thin
 * rule, control (or plain value) on the right.
 */
const FormRow = ({ label, required, children, error, htmlFor, className }: Props) => (
  <div
    className={cn('grid grid-cols-1 items-center gap-x-8 gap-y-1 py-2 sm:grid-cols-2', className)}
  >
    <label
      htmlFor={htmlFor}
      className="flex h-[38px] items-end border-b border-[#3a3a40] pb-2 text-sm text-foreground"
    >
      {label}
      {required && <span className="ml-1 text-negative">*</span>}
    </label>
    <div className="min-w-0 text-sm text-foreground">
      {children}
      {error && <p className="mt-1 text-xs text-negative">{error}</p>}
    </div>
  </div>
);

export default FormRow;
