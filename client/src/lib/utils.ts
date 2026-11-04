import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

/** Cents only. Tolerant of float noise: `1.15 * 100` is `114.99999999999999`. */
export const hasAtMostTwoDecimals = (v: number) => Math.abs(Math.round(v * 100) - v * 100) < 1e-6;
