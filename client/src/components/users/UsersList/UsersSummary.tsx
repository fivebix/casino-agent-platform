import PageCard from '@/components/common/PageCard';
import { KeyValuePanel, type KeyValueRow } from '@/components/ui/keyValuePanel';
import { formatAmount } from '@/lib/format';
// import { formatPercent } from '@/lib/format'; // used only by the commented-out discount lines
import type { AgentSummary } from '@/types/agent';

type Props = {
  summary?: AgentSummary;
  isLoading: boolean;
};

/** The two panels under the Users List (designs 01 / 24). */
const UsersSummary = ({ summary: s, isLoading }: Props) => {
  const left: KeyValueRow[] = [
    { label: 'Total Balance', value: formatAmount(s?.totalBalance) },
    { label: 'Balance Spend', value: formatAmount(s?.balanceSpend) },
    { label: 'Current Balance', value: formatAmount(s?.currentBalance) },
    { label: 'Sports Commission', value: formatAmount(s?.sportsCommission) },
    { label: 'Casino Commission', value: formatAmount(s?.casinoCommission) },
    { label: 'Chance Commission', value: formatAmount(s?.chanceCommission) },
    // Loss discount commented out:
    // { label: 'Sports Discount', value: formatPercent(s?.sportsDiscount) },
    // { label: 'Casino Discount', value: formatPercent(s?.casinoDiscount) },
    // { label: 'Chance Discount', value: formatPercent(s?.chanceDiscount) },
    { label: 'Backup Credit', value: s ? (s.backupCredit ? 'Yes' : 'No') : '—' },
    { label: 'Backup Credit Amount', value: formatAmount(s?.backupCreditAmount) },
    { label: 'Used Backup Credit', value: formatAmount(s?.usedBackupCredit) },
  ];
  const right: KeyValueRow[] = [
    { label: 'Turnover', value: formatAmount(s?.turnover) },
    // Loss discount commented out:
    // { label: 'Total Discount', value: formatAmount(s?.totalDiscount) },
    { label: 'Agent Profits', value: formatAmount(s?.agentProfits) },
    { label: 'Platform profits', value: formatAmount(s?.platformProfits) },
    { label: 'Platform Debt', value: formatAmount(s?.platformDebt) },
  ];

  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.74fr)]">
      <PageCard>
        <KeyValuePanel rows={left} isLoading={isLoading} />
      </PageCard>
      <PageCard>
        <KeyValuePanel rows={right} isLoading={isLoading} />
      </PageCard>
    </div>
  );
};

export default UsersSummary;
