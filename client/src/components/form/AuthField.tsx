type Props = {
  label: React.ReactNode;
  /** Grey text after the label, e.g. "· issued by your agent / master". */
  hint?: React.ReactNode;
  htmlFor: string;
  children: React.ReactNode;
  /** Right side of the label row (e.g. a "Forgot password?" link). */
  aside?: React.ReactNode;
};

/** Label row + control, as on the login / first-login cards. */
const AuthField = ({ label, hint, htmlFor, children, aside }: Props) => (
  <div className="space-y-2.5">
    <div className="flex items-baseline justify-between gap-3">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-foreground">
        {label}
        {hint && <span className="font-normal text-muted"> {hint}</span>}
      </label>
      {aside}
    </div>
    {children}
  </div>
);

export default AuthField;
