'use client';

import { Icon } from '@iconify/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdownMenu';
import { useAppDispatch, useAppSelector } from '@/hooks/useReduxHooks';
import { ODDS_FORMATS } from '@/lib/constants';
import { useUpdatePreferencesMutation } from '@/services/agentApi';
import { setOddsFormat } from '@/slices/appSlice';
import type { OddsFormat } from '@/types/agent';

/** Design 30: Decimal 1.91 / American -110. Saved with `PATCH /agent/auth/preferences`. */
const OddsFormatMenu = () => {
  const dispatch = useAppDispatch();
  const oddsFormat = useAppSelector((s) => s.app.oddsFormat);
  const [updatePreferences] = useUpdatePreferencesMutation();
  const current = ODDS_FORMATS.find((o) => o.value === oddsFormat);

  const change = async (value: string) => {
    const next = value as OddsFormat;
    if (next === oddsFormat) return;
    const previous = oddsFormat;
    dispatch(setOddsFormat(next));
    try {
      await updatePreferences({ oddsFormat: next }).unwrap();
    } catch {
      dispatch(setOddsFormat(previous));
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex h-full items-center gap-2 px-[22px] text-[15px] font-semibold text-foreground outline-none hover:text-lime data-[state=open]:text-lime">
        {current?.label ?? oddsFormat}
        <Icon icon="lucide:chevron-down" className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[188px]">
        <DropdownMenuRadioGroup value={oddsFormat} onValueChange={change}>
          {ODDS_FORMATS.map((o) => (
            <DropdownMenuRadioItem key={o.value} value={o.value} className="justify-between py-2">
              <span>{o.label}</span>
              <span className="text-xs text-muted group-data-[state=checked]:text-muted">
                {o.sample}
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default OddsFormatMenu;
