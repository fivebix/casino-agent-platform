import AuthGuardLayout from '@/layouts/AuthGuardLayout';

type Props = {
  children: React.ReactNode;
};

const ProtectedLayout = ({ children }: Props) => <AuthGuardLayout>{children}</AuthGuardLayout>;

export default ProtectedLayout;
