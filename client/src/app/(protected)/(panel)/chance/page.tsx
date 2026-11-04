import type { Metadata } from 'next';
import ChanceList from '@/components/bets/ChanceList';

export const metadata: Metadata = { title: 'Chance · odryn' };

const ChancePage = () => <ChanceList />;

export default ChancePage;
