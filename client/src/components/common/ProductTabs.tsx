'use client';

import { Button } from '@/components/ui/button';
import { PRODUCTS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { Product } from '@/types/agent';

type Props = {
  value: Product;
  onChange: (product: Product) => void;
  /** Limit the tabs (e.g. Bet List only has sport / chance). Defaults to all four. */
  products?: Product[];
  disabled?: boolean;
  className?: string;
};

/** SportBook / Casino / Chance / Overall — the active tab is red, the rest grey. */
const ProductTabs = ({ value, onChange, products, disabled, className }: Props) => {
  const items = products ? PRODUCTS.filter((p) => products.includes(p.value)) : PRODUCTS;
  return (
    <div role="tablist" className={cn('flex items-center gap-2', className)}>
      {items.map((p) => (
        <Button
          key={p.value}
          role="tab"
          aria-selected={p.value === value}
          size="sm"
          variant={p.value === value ? 'danger' : 'secondary'}
          disabled={disabled}
          onClick={() => onChange(p.value)}
          className="px-4"
        >
          {p.label}
        </Button>
      ))}
    </div>
  );
};

export default ProductTabs;
