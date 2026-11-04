'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';

export type SearchField = { name: string; placeholder: string };

type Props = {
  /** Two-line caption left of the inputs, e.g. "User Search" or "Search Bet". */
  label: string;
  /** One input per field (Users List: Username; Casino List: Game + Username). */
  fields: SearchField[];
  initialValues?: Record<string, string>;
  /** Fired on Enter or the search button with the trimmed values keyed by field name. */
  onSearch: (values: Record<string, string>) => void;
  className?: string;
};

/** The grey search group at the right of the list toolbars. */
const SearchBox = ({ label, fields, initialValues, onSearch, className }: Props) => {
  const [values, setValues] = useState<Record<string, string>>(initialValues ?? {});

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(Object.fromEntries(fields.map((f) => [f.name, (values[f.name] ?? '').trim()])));
  };

  return (
    <form
      role="search"
      onSubmit={submit}
      className={cn('flex h-[42px] items-center gap-2 rounded-xs bg-[#2a2a2f] px-2', className)}
    >
      <span className="w-12 whitespace-pre-line text-[11px] leading-[12px] text-muted">
        {label.split(' ').join('\n')}
      </span>
      {fields.map((f) => (
        <input
          key={f.name}
          aria-label={f.placeholder}
          placeholder={f.placeholder}
          value={values[f.name] ?? ''}
          onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
          className="h-[30px] w-[130px] rounded-xs border border-border-strong bg-[#232327] px-3 text-sm text-foreground outline-none placeholder:text-faint focus:border-lime/60"
        />
      ))}
      <button
        type="submit"
        aria-label="Search"
        className="flex h-[30px] w-[30px] items-center justify-center rounded-xs bg-[#3a3a40] text-foreground hover:bg-[#46464c]"
      >
        <Icon icon="lucide:search" className="h-4 w-4" />
      </button>
    </form>
  );
};

export default SearchBox;
