import { ValueTransformer } from 'typeorm';

export const numeric: ValueTransformer = {
  to: (v: number | null | undefined) => v,
  from: (v: string | number | null | undefined) =>
    v === null || v === undefined ? null : Number(v),
};
