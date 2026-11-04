import type { Metadata } from 'next';
import ChangePasswordForm from '@/components/form/ChangePasswordForm';

export const metadata: Metadata = { title: 'Live · odryn' };

const LivePage = () => <ChangePasswordForm />;

export default LivePage;
