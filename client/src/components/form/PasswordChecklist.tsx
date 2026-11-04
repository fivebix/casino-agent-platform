'use client';

import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';

export type PasswordRule = { label: string; met: boolean };

type Props = {
  rules: PasswordRule[];
};

/** The round-check list under the password fields (design 27); a rule turns lime once met. */
const PasswordChecklist = ({ rules }: Props) => (
  <ul className="space-y-2.5">
    {rules.map((rule) => (
      <li key={rule.label} className="flex items-center gap-2.5 text-sm text-muted">
        <span
          className={cn(
            'flex h-4 w-4 items-center justify-center rounded-full border-[1.5px] transition-colors',
            rule.met ? 'border-lime bg-lime text-lime-ink' : 'border-[#6b6b73]',
          )}
        >
          {rule.met && <Icon icon="lucide:check" className="h-2.5 w-2.5" />}
        </span>
        <span className={rule.met ? 'text-foreground' : undefined}>{rule.label}</span>
      </li>
    ))}
  </ul>
);

export default PasswordChecklist;
