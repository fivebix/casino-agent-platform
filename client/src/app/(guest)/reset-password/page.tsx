import type { Metadata } from 'next';
import ResetPasswordForm from '@/components/form/ResetPasswordForm';

export const metadata: Metadata = { title: 'Reset password · odryn' };

const ResetPasswordPage = () => <ResetPasswordForm />;

export default ResetPasswordPage;
