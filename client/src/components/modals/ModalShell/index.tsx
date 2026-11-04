'use client';

import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { ModalShellProps, ModalShellSize } from './type';

const SIZES: Record<ModalShellSize, string> = {
  sm: 'max-w-[520px]',
  md: 'max-w-[700px]',
  lg: 'max-w-[900px]',
};

/**
 * The dialog frame from "User Edit", "Credit amount" and "Balance": round lime user badge + title,
 * white square close button, body, a white rule, then Save (lime) / Close (grey).
 */
const ModalShell = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon = 'lucide:user-round',
  size = 'md',
  children,
  onSave,
  formId,
  saveLabel = 'Save',
  closeLabel = 'Close',
  isSaving = false,
  saveDisabled = false,
  footer,
  hideFooter = false,
  bodyClassName,
}: ModalShellProps) => {
  const showSave = !!onSave || !!formId;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={SIZES[size]} aria-describedby={undefined}>
        <header className="relative flex min-h-20 shrink-0 items-center justify-center gap-4 border-b border-border px-14 py-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-lime text-lime">
            <Icon icon={icon} className="h-5 w-5" />
          </span>
          <DialogTitle className="text-2xl font-normal text-foreground">{title}</DialogTitle>
          <DialogClose
            aria-label="Close"
            className="absolute right-[13px] top-[13px] flex h-8 w-8 items-center justify-center rounded-xs bg-white text-black hover:bg-white/85"
          >
            <Icon icon="lucide:x" className="h-6 w-6" />
          </DialogClose>
        </header>
        {subtitle && (
          <DialogDescription asChild>
            <div className="shrink-0 pt-2.5 text-center text-xs font-bold text-lime">
              {subtitle}
            </div>
          </DialogDescription>
        )}
        <div className={cn('min-h-0 flex-1 overflow-y-auto px-7 py-5', bodyClassName)}>
          {children}
        </div>
        {!hideFooter && (
          <footer className="shrink-0 border-t-2 border-rule px-7 py-5">
            {footer ?? (
              <div className="flex items-center justify-center gap-[120px]">
                {showSave && (
                  <Button
                    variant="primary"
                    size="lg"
                    type={formId ? 'submit' : 'button'}
                    form={formId}
                    onClick={formId ? undefined : onSave}
                    isLoading={isSaving}
                    disabled={saveDisabled}
                  >
                    {saveLabel}
                  </Button>
                )}
                <Button variant="secondary" size="lg" onClick={onClose}>
                  {closeLabel}
                </Button>
              </div>
            )}
          </footer>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ModalShell;
