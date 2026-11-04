'use client';

import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';

type Props = {
  className?: string;
  /** Centre it in a full-height block. */
  fullScreen?: boolean;
};

const Spinner = ({ className, fullScreen }: Props) => {
  const icon = (
    <Icon icon="lucide:loader-2" className={cn('h-6 w-6 animate-spin text-lime', className)} />
  );
  if (!fullScreen) return icon;
  return <div className="flex min-h-screen w-full items-center justify-center">{icon}</div>;
};

export default Spinner;
