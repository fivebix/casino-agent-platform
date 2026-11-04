import AppLayout from '@/layouts/AppLayout';

type Props = {
  children: React.ReactNode;
};

const PanelLayout = ({ children }: Props) => <AppLayout>{children}</AppLayout>;

export default PanelLayout;
