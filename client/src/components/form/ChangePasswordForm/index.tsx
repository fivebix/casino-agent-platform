'use client';

import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PASSWORD_MIN_LENGTH } from '@/lib/constants';
import { useSetPasswordMutation } from '@/services/agentApi';
import { changePasswordSchema } from './schema';
import type { ChangePasswordFormValues } from './type';

const FIELDS = [
  { name: 'currentPassword', label: 'Password Current', autoComplete: 'current-password' },
  { name: 'newPassword', label: 'Password New', autoComplete: 'new-password' },
  { name: 'confirmPassword', label: 'Password Confirm', autoComplete: 'new-password' },
] as const;

/** Design 09 (the Live tab). `POST /agent/auth/set-password { currentPassword, newPassword }`. */
const ChangePasswordForm = () => {
  const [setPassword, { isLoading }] = useSetPasswordMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: yupResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onSubmit = async ({ currentPassword, newPassword }: ChangePasswordFormValues) => {
    try {
      await setPassword({ currentPassword, newPassword }).unwrap();
      reset();
    } catch {
      // Global toast shows the server message (e.g. wrong current password).
    }
  };

  return (
    <section className="mx-auto w-full max-w-[274px] rounded-md border border-border bg-panel/95 px-10 pb-8 pt-9">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <h1 className="border-b-2 border-lime pb-2 text-center font-serif text-[26px] font-normal text-foreground">
          Change Password
        </h1>
        <p className="mt-1.5 bg-[#1d1d21] px-1 py-1 text-center text-[11px] text-lime">
          Password min length is {PASSWORD_MIN_LENGTH} characters
        </p>
        <div className="mt-5 space-y-5">
          {FIELDS.map((f) => (
            <div key={f.name}>
              <label htmlFor={`cp-${f.name}`} className="mb-2 block text-xs text-foreground">
                {f.label}
              </label>
              <Input
                id={`cp-${f.name}`}
                type="password"
                autoComplete={f.autoComplete}
                className="h-[30px] rounded-xs border-[#d4d4d8] bg-white text-black"
                error={errors[f.name]?.message}
                {...register(f.name)}
              />
            </div>
          ))}
        </div>
        <div className="mt-7 flex justify-center">
          <Button type="submit" size="md" isLoading={isLoading} className="font-bold">
            SAVE
          </Button>
        </div>
      </form>
    </section>
  );
};

export default ChangePasswordForm;
