'use client';

import { useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useRouter } from 'next/navigation';
import PageCard from '@/components/common/PageCard';
import FormRow from '@/components/form/FormRow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { LANGUAGES, ROUTES } from '@/lib/constants';
import { browserTimeZone, getCountryOptions, timeZoneOptions } from '@/lib/timezone';
import {
  useCreateAgentMutation,
  useCreatePlayerMutation,
  useGetUsersTreeQuery,
} from '@/services/agentApi';
import { createUserSchema } from './schema';
import type { CreateUserFormValues } from './type';

const ROLE_LABEL = { agent: 'Agent', sub_agent: 'Sub-agent' } as const;
const LANGUAGE_OPTIONS = LANGUAGES.map((l) => ({ value: l.code, label: l.label }));

const SHARE_ROWS = [
  { name: 'sportShare', label: 'Sport share %' },
  { name: 'casinoShare', label: 'Casino share %' },
  { name: 'chanceShare', label: 'Chance share %' },
] as const;

/**
 * Design 06. Player → `POST /agent/players`, Agent (adds the three share rows) → `POST /agent/agents`.
 * An admin agent creates agents, and sub-agents and players under any agent of its tree ("Create under");
 * an agent creates sub-agents and players; a sub-agent creates players only.
 * The global toast shows the success message; then the agent lands on /users.
 */
const CreateUserForm = () => {
  const router = useRouter();
  const { agent: me } = useAuth();
  const isAdminAgent = me?.role === 'admin_agent';
  const { data: tree } = useGetUsersTreeQuery(undefined, { skip: !isAdminAgent });
  const [createPlayer, { isLoading: creatingPlayer }] = useCreatePlayerMutation();
  const [createAgent, { isLoading: creatingAgent }] = useCreateAgentMutation();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<CreateUserFormValues>({
    resolver: yupResolver(createUserSchema),
    defaultValues: {
      type: 'player',
      username: '',
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      autoWeeklyCredit: 0,
      language: 'en',
      parentId: '',
      country: '',
      timezone: browserTimeZone(),
    },
  });

  const type = useWatch({ control, name: 'type' });
  const parentId = useWatch({ control, name: 'parentId' });
  const isAgent = type === 'agent';

  // Agents of the admin agent's tree (depth relative to the caller): a new agent goes under the admin agent itself
  // or, as a sub-agent, under one of its agents; a player goes under anyone.
  const parentOptions = useMemo(() => {
    const agents = (tree?.rows ?? []).filter(
      (r) => r.kind === 'agent' && r.id !== me?.id && (!isAgent || r.depth === 1),
    );
    return [
      { value: '', label: 'Me' },
      ...agents.map((r) => ({
        value: r.id,
        label: `${r.username} (${ROLE_LABEL[r.role as keyof typeof ROLE_LABEL] ?? r.role})`,
      })),
    ];
  }, [tree, me?.id, isAgent]);

  useEffect(() => {
    if (parentId && !parentOptions.some((o) => o.value === parentId)) setValue('parentId', '');
  }, [parentId, parentOptions, setValue]);

  const newAgentLabel = me?.role === 'agent' || (isAdminAgent && parentId) ? 'Sub-agent' : 'Agent';
  const typeOptions = [
    { value: 'player', label: 'Player' },
    ...(me?.role === 'sub_agent' ? [] : [{ value: 'agent', label: newAgentLabel }]),
  ];

  const onSubmit = async (form: CreateUserFormValues) => {
    const base = {
      username: form.username,
      name: form.name,
      email: form.email,
      password: form.password,
      autoWeeklyCredit: form.autoWeeklyCredit,
      language: form.language,
      ...(form.credit !== undefined ? { credit: form.credit } : {}),
    };
    try {
      const under = isAdminAgent && form.parentId ? form.parentId : undefined;
      if (form.type === 'agent') {
        await createAgent({
          ...base,
          sportShare: form.sportShare ?? 0,
          casinoShare: form.casinoShare ?? 0,
          chanceShare: form.chanceShare ?? 0,
          country: form.country,
          timezone: form.timezone,
          ...(under ? { parentId: under } : {}),
        }).unwrap();
      } else {
        await createPlayer({ ...base, ...(under ? { agentId: under } : {}) }).unwrap();
      }
      router.push(ROUTES.home);
    } catch {
      // Global toast shows the server message (e.g. username taken).
    }
  };

  const numberProps = { type: 'number', min: 0, step: '0.01' } as const;

  return (
    <PageCard
      title={isAgent ? `Create New ${newAgentLabel}` : 'Create New Player'}
      icon="lucide:user-round"
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="px-5">
        <FormRow label="Type" htmlFor="create-type">
          <Select id="create-type" options={typeOptions} {...register('type')} />
        </FormRow>
        {isAdminAgent && (
          <FormRow label="Create under" htmlFor="create-parent">
            <Select id="create-parent" options={parentOptions} {...register('parentId')} />
          </FormRow>
        )}
        <FormRow
          label="Username"
          required
          htmlFor="create-username"
          error={errors.username?.message}
        >
          <Input id="create-username" autoComplete="off" {...register('username')} />
        </FormRow>
        <FormRow label="Name" required htmlFor="create-name" error={errors.name?.message}>
          <Input id="create-name" autoComplete="off" {...register('name')} />
        </FormRow>
        <FormRow label="Email" required htmlFor="create-email" error={errors.email?.message}>
          <Input id="create-email" type="email" autoComplete="off" {...register('email')} />
        </FormRow>
        <FormRow
          label="Password"
          required
          htmlFor="create-password"
          error={errors.password?.message}
        >
          <Input
            id="create-password"
            type="password"
            autoComplete="new-password"
            {...register('password')}
          />
        </FormRow>
        <FormRow
          label="Confirm password"
          required
          htmlFor="create-confirm"
          error={errors.confirmPassword?.message}
        >
          <Input
            id="create-confirm"
            type="password"
            autoComplete="new-password"
            {...register('confirmPassword')}
          />
        </FormRow>
        <FormRow
          label="Auto weekly credit"
          required
          htmlFor="create-auto-weekly"
          error={errors.autoWeeklyCredit?.message}
        >
          <Input
            id="create-auto-weekly"
            {...numberProps}
            {...register('autoWeeklyCredit', { valueAsNumber: true })}
          />
        </FormRow>
        <FormRow label="Credit" htmlFor="create-credit" error={errors.credit?.message}>
          <Input
            id="create-credit"
            {...numberProps}
            {...register('credit', { valueAsNumber: true })}
          />
        </FormRow>
        {isAgent &&
          SHARE_ROWS.map((row) => (
            <FormRow
              key={row.name}
              label={row.label}
              required
              htmlFor={`create-${row.name}`}
              error={errors[row.name]?.message}
            >
              <Input
                id={`create-${row.name}`}
                {...numberProps}
                max={100}
                {...register(row.name, { valueAsNumber: true })}
              />
            </FormRow>
          ))}
        {isAgent && (
          <>
            <FormRow
              label="Country"
              required
              htmlFor="create-country"
              error={errors.country?.message}
            >
              <Select
                id="create-country"
                placeholder="Choose a country"
                options={getCountryOptions()}
                wrapperClassName="w-[280px]"
                {...register('country')}
              />
            </FormRow>
            <FormRow
              label="Time zone"
              required
              htmlFor="create-timezone"
              error={errors.timezone?.message}
            >
              <div className="flex flex-col gap-1">
                <Select
                  id="create-timezone"
                  options={timeZoneOptions()}
                  wrapperClassName="w-[280px]"
                  {...register('timezone')}
                />
                <span className="text-xs text-muted">
                  The week closes at Tuesday 11:00 in this time zone; the panel shows times in it.
                </span>
              </div>
            </FormRow>
          </>
        )}
        <FormRow label="Language" htmlFor="create-language">
          <Select id="create-language" options={LANGUAGE_OPTIONS} {...register('language')} />
        </FormRow>

        <div className="flex items-center justify-center gap-4 pt-6">
          <Button type="submit" size="md" isLoading={creatingPlayer || creatingAgent}>
            {isAgent ? `Create ${newAgentLabel.toLowerCase()}` : 'Create player'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => router.push(ROUTES.home)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </PageCard>
  );
};

export default CreateUserForm;
