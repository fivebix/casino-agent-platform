'use client';

import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import InfoTip from '@/components/common/InfoTip';
import FormRow from '@/components/form/FormRow';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useUpdateUserSettingsMutation } from '@/services/agentApi';
import { SAVE_CACHE_KEY, SETTINGS_DEFAULTS, SETTINGS_ROWS } from './constants';
import { settingsSchema } from './schema';
import type { SettingsFormValues, TabProps } from './type';
import { readBool, readNumber, readString } from './utils';

/** Design 11. Every value lives in the `settings` JSON → `PATCH /agent/:kind/:id/settings`. */
const SettingsTab = ({ kind, id, detail, formId }: TabProps) => {
  const [updateSettings] = useUpdateUserSettingsMutation({
    fixedCacheKey: SAVE_CACHE_KEY.settings,
  });

  const values = useMemo<SettingsFormValues>(() => {
    const s = detail.settings ?? {};
    const d = SETTINGS_DEFAULTS;
    return {
      odds: readString(s.odds, d.odds),
      live: readString(s.live, d.live),
      parlay: readString(s.parlay, d.parlay),
      percent1x2Prematch: readNumber(s.percent1x2Prematch, d.percent1x2Prematch),
      percent1x2Live: readNumber(s.percent1x2Live, d.percent1x2Live),
      percentPropositions: readNumber(s.percentPropositions, d.percentPropositions),
      limitProposition: readNumber(s.limitProposition, d.limitProposition),
      maxBetLimit: readNumber(s.maxBetLimit, d.maxBetLimit),
      limitUserPerGame: readNumber(s.limitUserPerGame, d.limitUserPerGame),
      limitUserPerGameLive: readNumber(s.limitUserPerGameLive, d.limitUserPerGameLive),
      limitUserCombo: readNumber(s.limitUserCombo, d.limitUserCombo),
      maxCountBetsOnGame: readString(s.maxCountBetsOnGame, d.maxCountBetsOnGame),
      allowRejectedForMaxCount: readBool(s.allowRejectedForMaxCount, d.allowRejectedForMaxCount),
      ignoreLeagueMaxBetCount: readBool(s.ignoreLeagueMaxBetCount, d.ignoreLeagueMaxBetCount),
    };
  }, [detail]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SettingsFormValues>({ resolver: yupResolver(settingsSchema), values });

  const onSubmit = async (form: SettingsFormValues) => {
    try {
      // Keep keys this screen does not know about.
      await updateSettings({
        kind,
        id,
        settings: {
          ...detail.settings,
          ...form,
          odds: Number(form.odds),
          live: Number(form.live),
          parlay: Number(form.parlay),
          maxCountBetsOnGame: Number(form.maxCountBetsOnGame),
        },
      }).unwrap();
    } catch {
      // Global toast shows the server message.
    }
  };

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} noValidate>
      {SETTINGS_ROWS.map((row) => {
        const inputId = `ue-settings-${row.name}`;
        const label = (
          <span className="flex w-full items-center justify-between gap-2">
            {row.label}
            <InfoTip text={row.tip} />
          </span>
        );
        return (
          <FormRow
            key={row.name}
            label={label}
            htmlFor={row.kind === 'check' ? undefined : inputId}
            error={errors[row.name]?.message}
          >
            {row.kind === 'select' ? (
              <Select
                id={inputId}
                options={row.options}
                wrapperClassName="w-full"
                {...register(row.name)}
              />
            ) : row.kind === 'number' ? (
              <Input
                id={inputId}
                type="number"
                min={0}
                step="0.01"
                {...register(row.name, { valueAsNumber: true })}
              />
            ) : (
              <Checkbox aria-label={row.label} {...register(row.name)} />
            )}
          </FormRow>
        );
      })}
    </form>
  );
};

export default SettingsTab;
