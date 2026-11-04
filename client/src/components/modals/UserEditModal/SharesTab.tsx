'use client';

import { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import FormRow from '@/components/form/FormRow';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { formatAmount } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useUpdateUserSharesMutation } from '@/services/agentApi';
import type { UpdateSharesRequest } from '@/types/agent';
import { BONUS_SPLIT_OPTIONS, MIN_SPORTS_BETS_PRESETS, SAVE_CACHE_KEY } from './constants';
import { sharesSchema } from './schema';
import type { SharesFormValues, TabProps } from './type';
import { cleanNumber } from './utils';

const DEFAULT_SPLIT = 'agent50-company50';
const numberBox = 'h-[30px] border-border-strong text-center';

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="mb-2 text-[13px] font-bold text-lime">{children}</h3>
);

type RuleProps = { enabled: boolean; discount: number; minBets: number };

/** The live "Rule:" example under the discount fields; recomputed from the inputs. */
const RuleExample = ({ enabled, discount, minBets }: RuleProps) => {
  const [lost, setLost] = useState(100);
  const above = minBets + 2;
  const below = Math.max(0, Math.floor(minBets * 0.6));
  const pays = Math.round(lost * (1 - discount / 100) * 100) / 100;

  return (
    <div className="mt-4 rounded-xs border border-border-strong bg-[#1d1d21] px-4 py-4 text-[13px] leading-5">
      <p className="font-semibold text-foreground">
        Rule: the discount applies only when the player ends the week with a{' '}
        <span className="text-lime">loss</span> AND placed at least{' '}
        <span className="text-lime">{minBets}</span> sports bets.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-foreground">
        <span>Lost</span>
        <Input
          aria-label="Example loss"
          type="number"
          min={0}
          value={Number.isFinite(lost) ? lost : ''}
          onChange={(e) => setLost(cleanNumber(e.target.valueAsNumber))}
          wrapperClassName="w-[90px]"
          className={numberBox}
        />
        {enabled ? (
          <>
            <span>
              · {above} bets (≥ {minBets}) → discount {formatAmount(discount)}% →
            </span>
            <span className="font-bold text-lime">pays {formatAmount(pays)}</span>
          </>
        ) : (
          <span>
            · discount is off →{' '}
            <span className="font-bold text-lime">pays {formatAmount(lost)}</span>
          </span>
        )}
      </div>
      {enabled && (
        <p className="mt-2 text-muted">
          Lost {formatAmount(lost)} · {below} bets (&lt; {minBets}) → no discount → pays{' '}
          {formatAmount(lost)}
        </p>
      )}
      <p className="mt-2 text-muted">Won the week → nothing to discount</p>
    </div>
  );
};

/**
 * Design 25. `PATCH /agent/:kind/:id/shares`. Shares and the bonus split are agent-only, so a player sees
 * only the loss-discount column. The backend rejects values above the caller's own.
 */
const SharesTab = ({ kind, id, detail, formId }: TabProps) => {
  const [updateShares] = useUpdateUserSharesMutation({ fixedCacheKey: SAVE_CACHE_KEY.shares });
  const isAgent = kind === 'agents';
  const maxDiscount = useAuth().agent?.maxDiscount ?? 100;

  const values = useMemo<SharesFormValues>(
    () => ({
      sportShare: detail.sportShare,
      casinoShare: detail.casinoShare,
      chanceShare: detail.chanceShare,
      bonusSplit: detail.bonusSplit || DEFAULT_SPLIT,
      discountEnabled: detail.discountEnabled,
      sportsDiscount: detail.sportsDiscount,
      casinoDiscount: detail.casinoDiscount,
      chanceDiscount: detail.chanceDiscount,
      minSportsBets: detail.minSportsBets,
      minCasinoBets: detail.minCasinoBets,
    }),
    [detail],
  );

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    control,
    formState: { errors, dirtyFields },
  } = useForm<SharesFormValues>({ resolver: yupResolver(sharesSchema), values });

  const [sportShare, casinoShare, chanceShare, enabled, sportsDiscount, minSportsBets] = useWatch({
    control,
    name: [
      'sportShare',
      'casinoShare',
      'chanceShare',
      'discountEnabled',
      'sportsDiscount',
      'minSportsBets',
    ],
  });

  // Only changed fields go out: re-sending an untouched value that is now out of bounds would fail the save.
  const onSubmit = async (form: SharesFormValues) => {
    const keys: (keyof SharesFormValues)[] = [
      'discountEnabled',
      'sportsDiscount',
      'casinoDiscount',
      'chanceDiscount',
      'minSportsBets',
      'minCasinoBets',
      ...(isAgent ? (['sportShare', 'casinoShare', 'chanceShare', 'bonusSplit'] as const) : []),
    ];
    const changed = keys.filter((key) => dirtyFields[key]);
    const tooHigh = changed.filter(
      (key) =>
        (key === 'sportsDiscount' || key === 'casinoDiscount' || key === 'chanceDiscount') &&
        form[key] > maxDiscount,
    );
    if (tooHigh.length) {
      tooHigh.forEach((key) =>
        setError(key, { message: `At most ${formatAmount(maxDiscount)}%` }),
      );
      return;
    }
    if (!changed.length) return;
    const body = Object.fromEntries(
      changed.map((key) => [key, form[key]]),
    ) as UpdateSharesRequest;
    try {
      await updateShares({ kind, id, body }).unwrap();
    } catch {
      // Global toast shows the server message (e.g. a value above the caller's own).
    }
  };

  const shareRows = [
    { name: 'sportShare', label: 'Sport share %', value: sportShare },
    { name: 'casinoShare', label: 'Casino share %', value: casinoShare },
    { name: 'chanceShare', label: 'Chance share %', value: chanceShare },
  ] as const;

  const discountRows = [
    { name: 'sportsDiscount', label: 'Sports discount %' },
    { name: 'casinoDiscount', label: 'Casino discount %' },
    { name: 'chanceDiscount', label: 'Chance discount %' },
  ] as const;

  const rowClass = 'gap-x-6 sm:grid-cols-[1fr_auto]';

  return (
    <form
      id={formId}
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className={cn('grid gap-x-10 gap-y-6', isAgent && 'md:grid-cols-2')}
    >
      {isAgent && (
        <section>
          <SectionTitle>Agent share (what the agent receives)</SectionTitle>
          {shareRows.map((row) => (
            <FormRow
              key={row.name}
              label={row.label}
              htmlFor={`ue-${row.name}`}
              error={errors[row.name]?.message}
              className={rowClass}
            >
              <div className="flex items-center gap-3">
                <Input
                  id={`ue-${row.name}`}
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  wrapperClassName="w-[120px]"
                  className={numberBox}
                  {...register(row.name, { valueAsNumber: true })}
                />
                <span className="w-[64px] text-[10px] leading-[14px] text-muted">
                  company keeps {formatAmount(Math.max(0, 100 - cleanNumber(row.value)))}%
                </span>
              </div>
            </FormRow>
          ))}
          <FormRow
            label="Bonus / free bet cost split"
            htmlFor="ue-bonus-split"
            className={rowClass}
          >
            <Select
              id="ue-bonus-split"
              options={BONUS_SPLIT_OPTIONS}
              wrapperClassName="w-[220px]"
              {...register('bonusSplit')}
            />
          </FormRow>
        </section>
      )}

      <section>
        <SectionTitle>Loss discount (bonus of lose)</SectionTitle>
        <p className="-mt-1 mb-2 text-[11px] text-muted">
          You can give at most {formatAmount(maxDiscount)}%.
        </p>
        <FormRow label="Discount enabled" className={rowClass}>
          <Checkbox tone="lime" label="On" className="w-[120px]" {...register('discountEnabled')} />
        </FormRow>
        {discountRows.map((row) => (
          <FormRow
            key={row.name}
            label={row.label}
            htmlFor={`ue-${row.name}`}
            error={errors[row.name]?.message}
            className={rowClass}
          >
            <Input
              id={`ue-${row.name}`}
              type="number"
              min={0}
              max={maxDiscount}
              step="0.01"
              wrapperClassName="w-[120px]"
              className={numberBox}
              {...register(row.name, { valueAsNumber: true })}
            />
          </FormRow>
        ))}
        <FormRow
          label="Min. sports bets to qualify"
          htmlFor="ue-min-sports"
          error={errors.minSportsBets?.message}
          className={rowClass}
        >
          <div className="flex items-center gap-2">
            <Input
              id="ue-min-sports"
              type="number"
              min={0}
              step={1}
              wrapperClassName="w-[110px]"
              className={numberBox}
              {...register('minSportsBets', { valueAsNumber: true })}
            />
            {MIN_SPORTS_BETS_PRESETS.map((n) => (
              <Button
                key={n}
                type="button"
                size="sm"
                variant={minSportsBets === n ? 'primary' : 'secondary'}
                aria-pressed={minSportsBets === n}
                className="w-12 px-0"
                onClick={() =>
                  setValue('minSportsBets', n, { shouldDirty: true, shouldValidate: true })
                }
              >
                {n}
              </Button>
            ))}
          </div>
        </FormRow>
        <FormRow
          label="Min. casino bets to qualify"
          htmlFor="ue-min-casino"
          error={errors.minCasinoBets?.message}
          className={rowClass}
        >
          <Input
            id="ue-min-casino"
            type="number"
            min={0}
            step={1}
            wrapperClassName="w-[120px]"
            className={numberBox}
            {...register('minCasinoBets', { valueAsNumber: true })}
          />
        </FormRow>
        <FormRow label="Applies" htmlFor="ue-applies" className={rowClass}>
          <Select
            id="ue-applies"
            disabled
            options={[{ value: 'weekly', label: 'Weekly (Tue 11:00 → Tue 11:00)' }]}
            wrapperClassName="w-[260px]"
          />
        </FormRow>
        <RuleExample
          enabled={!!enabled}
          discount={cleanNumber(sportsDiscount)}
          minBets={cleanNumber(minSportsBets)}
        />
      </section>
    </form>
  );
};

export default SharesTab;
