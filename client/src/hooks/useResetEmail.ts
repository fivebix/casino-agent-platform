import { useSyncExternalStore } from 'react';
import { RESET_EMAIL_STORAGE_KEY } from '@/lib/constants';

const EVENT = 'odryn:reset-email';

const read = () => {
  try {
    return sessionStorage.getItem(RESET_EMAIL_STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
};

const subscribe = (onChange: () => void) => {
  window.addEventListener(EVENT, onChange);
  return () => window.removeEventListener(EVENT, onChange);
};

/** Email kept between the forgot-password dialog and /reset-password (sessionStorage, never the URL). */
export const setResetEmail = (email: string | null) => {
  try {
    if (email) sessionStorage.setItem(RESET_EMAIL_STORAGE_KEY, email);
    else sessionStorage.removeItem(RESET_EMAIL_STORAGE_KEY);
  } catch {
    // Storage blocked: the reset screen then asks for a new code.
  }
  window.dispatchEvent(new Event(EVENT));
};

export const useResetEmail = () => useSyncExternalStore(subscribe, read, () => '');
