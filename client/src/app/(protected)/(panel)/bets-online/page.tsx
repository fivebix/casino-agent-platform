import type { Metadata } from 'next';
import BetsOnline from '@/components/bets/BetsOnline';

export const metadata: Metadata = { title: 'Bets online · odryn' };

const BetsOnlinePage = () => <BetsOnline />;

export default BetsOnlinePage;
