import type { Metadata } from 'next';
import LoginForm from '@/components/form/LoginForm';

export const metadata: Metadata = { title: 'Agent login · odryn' };

const LoginPage = () => <LoginForm />;

export default LoginPage;
