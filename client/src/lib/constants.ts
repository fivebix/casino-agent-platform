import type { OddsFormat, Product } from '@/types/agent';

/** Contract: passwords are at least 8 characters (enforced by the backend). */
export const PASSWORD_MIN_LENGTH = 8;

/** sessionStorage key holding the email between the forgot-password dialog and /reset-password. */
export const RESET_EMAIL_STORAGE_KEY = 'odryn.resetEmail';

export const EXTERNAL_LINKS = {
  odryn: process.env.NEXT_PUBLIC_ODRYN_URL || '',
  telegram: process.env.NEXT_PUBLIC_TELEGRAM_URL || '',
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_URL || '',
};

export const ROUTES = {
  login: '/login',
  resetPassword: '/reset-password',
  firstLogin: '/first-login',
  home: '/users',
} as const;

/** Language menu (design 31). `flag` is an Iconify icon name. */
export const LANGUAGES: { code: string; label: string; flag?: string }[] = [
  { code: 'en', label: 'English', flag: 'twemoji:flag-united-kingdom' },
  { code: 'ru', label: 'Русский' },
  { code: 'he', label: 'Hebrew' },
  { code: 'ar', label: 'Arabian' },
  { code: 'zh', label: 'Chinese' },
  { code: 'es', label: 'Español' },
  { code: 'ja', label: '日本語' },
  { code: 'pt', label: 'Português' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'id', label: 'Indonesian' },
  { code: 'ko', label: '한국어' },
  { code: 'pl', label: 'Polski' },
  { code: 'th', label: 'ประเทศไทย' },
  { code: 'tr', label: 'Türkçe' },
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'fi', label: 'Suomi' },
];

/** Odds format menu (design 30). The contract also allows `fractional`; the design shows only these two. */
export const ODDS_FORMATS: { value: OddsFormat; label: string; sample: string }[] = [
  { value: 'decimal', label: 'Decimal', sample: '1.91' },
  { value: 'american', label: 'American', sample: '-110' },
];

export const PRODUCTS: { value: Product; label: string }[] = [
  { value: 'sport', label: 'SportBook' },
  { value: 'casino', label: 'Casino' },
  { value: 'chance', label: 'Chance' },
  { value: 'overall', label: 'Overall' },
];
