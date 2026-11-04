import type { Metadata } from 'next';
import BetList from '@/components/bets/BetList';

export const metadata: Metadata = { title: 'Bet List · odryn' };

const BetsPage = () => <BetList />;

export default BetsPage;
