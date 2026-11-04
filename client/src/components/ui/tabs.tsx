import { cn } from '@/lib/utils';

export type TabItem<T extends string = string> = {
  value: T;
  label: React.ReactNode;
  disabled?: boolean;
};

type Props<T extends string> = {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
};

/**
 * Full-width tab strip from the User Edit dialog: equal grey cells, the active one lime, a lime rule under
 * the whole strip.
 */
const TabsBar = <T extends string>({ items, value, onChange, className }: Props<T>) => (
  <div role="tablist" className={cn('flex w-full border-b-2 border-lime bg-[#4a4a50]', className)}>
    {items.map((item) => {
      const active = item.value === value;
      return (
        <button
          key={item.value}
          type="button"
          role="tab"
          aria-selected={active}
          disabled={item.disabled}
          onClick={() => onChange(item.value)}
          className={cn(
            'flex min-h-[46px] flex-1 items-center justify-center px-3 py-1 text-center text-base font-bold leading-tight transition-colors disabled:opacity-50',
            active ? 'bg-lime text-lime-ink' : 'text-foreground hover:bg-white/10',
          )}
        >
          {item.label}
        </button>
      );
    })}
  </div>
);

export { TabsBar };
