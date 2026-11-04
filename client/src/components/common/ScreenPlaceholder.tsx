import PageCard from '@/components/common/PageCard';

type Props = {
  title: string;
  icon: string;
  /** Which design file the screen follows. */
  design: string;
};

/** Temporary body for routes whose screen is not built yet. Delete when the real screen lands. */
const ScreenPlaceholder = ({ title, icon, design }: Props) => (
  <PageCard title={title} icon={icon}>
    <p className="px-1 py-3 text-sm font-semibold text-foreground">This screen is not built yet.</p>
    <p className="px-1 text-xs text-muted">Design: {design}</p>
  </PageCard>
);

export default ScreenPlaceholder;
