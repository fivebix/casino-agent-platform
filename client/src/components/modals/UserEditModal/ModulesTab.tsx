'use client';

import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import FormRow from '@/components/form/FormRow';
import { Checkbox } from '@/components/ui/checkbox';
import { useUpdateUserModulesMutation } from '@/services/agentApi';
import { MODULE_KEYS, SAVE_CACHE_KEY } from './constants';
import type { ModulesFormValues, TabProps } from './type';
import { readBool } from './utils';

/** Design 14. Toggles in the `modules` JSON (missing = on) → `PATCH /agent/:kind/:id/modules`. */
const ModulesTab = ({ kind, id, detail, formId }: TabProps) => {
  const [updateModules] = useUpdateUserModulesMutation({ fixedCacheKey: SAVE_CACHE_KEY.modules });

  const values = useMemo<ModulesFormValues>(
    () => ({
      modules: Object.fromEntries(MODULE_KEYS.map((k) => [k, readBool(detail.modules?.[k], true)])),
    }),
    [detail],
  );

  const { register, handleSubmit } = useForm<ModulesFormValues>({ values });

  const onSubmit = async (form: ModulesFormValues) => {
    try {
      await updateModules({ kind, id, modules: { ...detail.modules, ...form.modules } }).unwrap();
    } catch {
      // Global toast shows the server message.
    }
  };

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} noValidate>
      {MODULE_KEYS.map((key) => (
        <FormRow key={key} label={key} htmlFor={`ue-module-${key}`}>
          <Checkbox id={`ue-module-${key}`} {...register(`modules.${key}`)} />
        </FormRow>
      ))}
    </form>
  );
};

export default ModulesTab;
