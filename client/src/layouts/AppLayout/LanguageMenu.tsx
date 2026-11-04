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
import { LANGUAGES } from '@/lib/constants';
import { useUpdatePreferencesMutation } from '@/services/agentApi';
import { setLanguage } from '@/slices/appSlice';

/**
 * Design 31: language list with radio circles. Saved with `PATCH /agent/auth/preferences`.
 * The panel's own strings are English-only for now (no i18n yet).
 */
const LanguageMenu = () => {
  const dispatch = useAppDispatch();
  const language = useAppSelector((s) => s.app.language);
  const [updatePreferences] = useUpdatePreferencesMutation();
  const current = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];

  const change = async (code: string) => {
    if (code === language) return;
    const previous = language;
    dispatch(setLanguage(code));
    try {
      await updatePreferences({ language: code }).unwrap();
    } catch {
      dispatch(setLanguage(previous));
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex h-full items-center gap-2 px-[22px] text-[15px] text-foreground outline-none hover:text-lime data-[state=open]:text-lime">
        {current.flag && <Icon icon={current.flag} className="h-3.5 w-3.5" />}
        {current.label}
        <Icon icon="lucide:chevron-down" className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="max-h-[70vh] w-[228px] overflow-y-auto">
        <DropdownMenuRadioGroup value={language} onValueChange={change}>
          {LANGUAGES.map((l) => (
            <DropdownMenuRadioItem key={l.code} value={l.code} className="justify-between">
              <span className="flex items-center gap-2">
                {l.flag && <Icon icon={l.flag} className="h-3.5 w-3.5" />}
                {l.label}
              </span>
              <span className="flex h-4 w-4 items-center justify-center rounded-full border-[1.5px] border-[#8a8a92] group-data-[state=checked]:border-lime group-data-[state=checked]:bg-lime">
                <span className="hidden h-1.5 w-1.5 rounded-full bg-lime-ink group-data-[state=checked]:block" />
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageMenu;
