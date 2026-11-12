'use client';

import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import AuthField from '@/components/form/AuthField';
import TenantNotice from '@/components/form/TenantNotice';
import { MODAL_TYPES } from '@/components/modals/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useModal } from '@/hooks/useModal';
import { useTenant } from '@/hooks/useTenant';
import { useLoginMutation } from '@/services/agentApi';
import { loginSchema } from './schema';
import type { LoginFormValues } from './type';

/**
 * Design 26. `POST /agent/auth/login`; on success the auth slice is filled and GuestGuardLayout sends the
 * agent to /first-login (mustChangePassword) or /users.
 */
const LoginForm = () => {
  const { operatorId } = useTenant();
  const { open } = useModal();
  const [login, { isLoading }] = useLoginMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: yupResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  const onSubmit = async (values: LoginFormValues) => {
    if (!operatorId) return;
    try {
      await login({ operatorId, ...values }).unwrap();
    } catch {
      // Global toast shows the server message (e.g. invalid credentials).
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <h1 className="text-[28px] font-bold tracking-tight text-foreground">Agent login</h1>
      <p className="mt-2.5 text-sm leading-5 text-muted">
        Sign in with your username and password. Signing in for the first time? Use the temporary
        password you received from your agent.
      </p>

      <div className="mt-8 space-y-6">
        <TenantNotice />
        <AuthField label="Username" htmlFor="username">
          <Input
            id="username"
            variant="auth"
            autoComplete="username"
            autoFocus
            placeholder="agent name"
            error={errors.username?.message}
            {...register('username')}
          />
        </AuthField>
        <AuthField label="Password" htmlFor="password">
          <Input
            id="password"
            type="password"
            variant="auth"
            autoComplete="current-password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => open(MODAL_TYPES.FORGOT_PASSWORD)}
              className="text-xs text-muted underline-offset-2 hover:text-lime hover:underline"
            >
              Forgot password?
            </button>
          </div>
        </AuthField>
      </div>

      <Button
        type="submit"
        size="pill"
        className="mt-5"
        isLoading={isLoading}
        disabled={!operatorId}
      >
        Sign in
      </Button>
      <p className="mt-6 text-center text-xs text-muted">
        First login? You will be asked to set your own password.
      </p>
    </form>
  );
};

export default LoginForm;
