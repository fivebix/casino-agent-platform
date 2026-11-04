import type { Metadata } from 'next';
import FirstLoginForm from '@/components/form/FirstLoginForm';
import AuthScreenLayout from '@/layouts/AuthScreenLayout';

export const metadata: Metadata = { title: 'Create your password · odryn' };

const FirstLoginPage = () => (
  <AuthScreenLayout>
    <FirstLoginForm />
  </AuthScreenLayout>
);

export default FirstLoginPage;
