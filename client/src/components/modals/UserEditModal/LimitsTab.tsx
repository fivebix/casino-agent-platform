'use client';

import { Fragment, useMemo, useState } from 'react';
import { useForm, type UseFormRegister } from 'react-hook-form';
import { Icon } from '@iconify/react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useUpdateUserLimitsMutation } from '@/services/agentApi';
import {
  LEAGUE_MARKETS,
  LIMIT_SPORTS,
  SAVE_CACHE_KEY,
  leagueId,
  type LimitSport,
} from './constants';
import type { LeagueLimits, LimitsFormValues, SportLimits, TabProps } from './type';
import { asRecord, cleanNumber, readNumber } from './utils';

const buildValues = (limits: Record<string, unknown> | null | undefined): LimitsFormValues => {
  const saved = asRecord(limits?.sports);
  const sports: Record<string, SportLimits> = {};
  for (const sport of LIMIT_SPORTS) {
    const s = asRecord(saved[sport.key]);
    const savedLeagues = asRecord(s.leagues);
    const leagues: Record<string, LeagueLimits> = {};
    for (const name of sport.leagues) {
      const lid = leagueId(name);
      const l = asRecord(savedLeagues[lid]);
      leagues[lid] = Object.fromEntries(LEAGUE_MARKETS.map((m) => [m.key, readNumber(l[m.key])]));
    }
    sports[sport.key] = { prematch: readNumber(s.prematch), live: readNumber(s.live), leagues };
  }
  return { sports };
};

/** Drops leagues whose markets are all 0 so the JSON stays small. */
const toPayload = (form: LimitsFormValues) => {
  const sports: Record<string, unknown> = {};
  for (const [key, s] of Object.entries(form.sports)) {
    const leagues: Record<string, LeagueLimits> = {};
    for (const [lid, markets] of Object.entries(s.leagues ?? {})) {
      const clean = Object.fromEntries(
        Object.entries(markets).map(([m, v]) => [m, Math.max(0, cleanNumber(v))]),
      );
      if (Object.values(clean).some((v) => v > 0)) leagues[lid] = clean;
    }
    sports[key] = {
      prematch: Math.max(0, cleanNumber(s.prematch)),
      live: Math.max(0, cleanNumber(s.live)),
      ...(Object.keys(leagues).length ? { leagues } : {}),
    };
  }
  return { sports };
};

const numberProps = { type: 'number', min: 0, step: '0.01' } as const;

type LeagueTableProps = {
  sport: LimitSport;
  register: UseFormRegister<LimitsFormValues>;
};

/** Design 36: the league search + FT/HT market grid under an expanded sport. */
const LeagueTable = ({ sport, register }: LeagueTableProps) => {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const leagues = q ? sport.leagues.filter((l) => l.toLowerCase().includes(q)) : sport.leagues;

  return (
    <div className="border-b border-[#3a3a40] pb-3">
      <input
        aria-label={`Search ${sport.label} leagues`}
        placeholder="Search league"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mt-2 h-[30px] w-full rounded-xs border border-border-strong bg-[#232327] px-3 text-sm text-foreground outline-none placeholder:text-faint focus:border-lime/60"
      />
      {leagues.length === 0 ? (
        <p className="px-2 py-3 text-sm text-muted">No leagues match “{query.trim()}”.</p>
      ) : (
        <div className="mt-3 grid grid-cols-[minmax(160px,1.6fr)_repeat(6,minmax(56px,1fr))] items-center gap-x-1 gap-y-2">
          <span />
          {LEAGUE_MARKETS.map((m) => (
            <span key={m.key} className="text-center text-[11px] text-lime">
              {m.label}
            </span>
          ))}
          {leagues.map((name) => {
            const lid = leagueId(name);
            return (
              <Fragment key={lid}>
                <span className="truncate px-2 text-sm text-foreground">{name}</span>
                {LEAGUE_MARKETS.map((m) => (
                  <Input
                    key={m.key}
                    aria-label={`${name} ${m.label}`}
                    className="h-[30px] border-border-strong bg-[#232327] text-right"
                    {...numberProps}
                    {...register(`sports.${sport.key}.leagues.${lid}.${m.key}`, {
                      valueAsNumber: true,
                    })}
                  />
                ))}
              </Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
};

/** Designs 12 + 36. Stored in the `limits` JSON → `PATCH /agent/:kind/:id/limits`. Reset zeroes the form. */
const LimitsTab = ({ kind, id, detail, formId }: TabProps) => {
  const [updateLimits] = useUpdateUserLimitsMutation({ fixedCacheKey: SAVE_CACHE_KEY.limits });
  const [open, setOpen] = useState<string | null>(null);

  const values = useMemo(() => buildValues(detail.limits), [detail]);
  const zeros = useMemo(() => buildValues({}), []);

  const { register, handleSubmit, reset } = useForm<LimitsFormValues>({ values });

  const onSubmit = async (form: LimitsFormValues) => {
    try {
      await updateLimits({ kind, id, limits: { ...detail.limits, ...toPayload(form) } }).unwrap();
    } catch {
      // Global toast shows the server message.
    }
  };

  return (
    <form
      id={formId}
      onSubmit={handleSubmit(onSubmit)}
      onReset={(e) => {
        e.preventDefault();
        reset(zeros);
      }}
      noValidate
    >
      <div className="grid grid-cols-[1fr_1fr_1fr] gap-2 bg-[#1d1d21] px-2 py-2.5 text-center text-xs text-lime">
        <span>Sport</span>
        <span>Prematch</span>
        <span>Live</span>
      </div>
      {LIMIT_SPORTS.map((sport, index) => {
        const expandable = sport.leagues.length > 0;
        const isOpen = open === sport.key;
        return (
          <div key={sport.key}>
            <div className="grid grid-cols-[1fr_1fr_1fr] items-center gap-2 border-b border-[#3a3a40] py-1">
              {expandable ? (
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : sport.key)}
                  className="flex items-center justify-between px-2 text-left text-sm text-foreground hover:text-lime"
                >
                  {sport.label}
                  <Icon
                    icon={isOpen ? 'lucide:chevron-up' : 'lucide:chevron-down'}
                    className="h-4 w-4"
                  />
                </button>
              ) : (
                <span className={cn('px-2 text-sm text-foreground', index === 0 && 'font-bold')}>
                  {sport.label}
                </span>
              )}
              <Input
                aria-label={`${sport.label} prematch limit`}
                className="h-[30px] border-border-strong"
                {...numberProps}
                {...register(`sports.${sport.key}.prematch`, { valueAsNumber: true })}
              />
              <Input
                aria-label={`${sport.label} live limit`}
                className="h-[30px] border-border-strong"
                {...numberProps}
                {...register(`sports.${sport.key}.live`, { valueAsNumber: true })}
              />
            </div>
            {expandable && isOpen && <LeagueTable sport={sport} register={register} />}
          </div>
        );
      })}
    </form>
  );
};

export default LimitsTab;
