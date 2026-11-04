import AuthScreenLayout from '@/layouts/AuthScreenLayout';
import GuestGuardLayout from '@/layouts/GuestGuardLayout';

type Props = {
  children: React.ReactNode;
};

const GuestLayout = ({ children }: Props) => (
  <GuestGuardLayout>
    <AuthScreenLayout>{children}</AuthScreenLayout>
  </GuestGuardLayout>
);

export default GuestLayout;
