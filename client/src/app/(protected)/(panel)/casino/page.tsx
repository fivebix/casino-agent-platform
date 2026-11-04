import type { Metadata } from 'next';
import CasinoList from '@/components/casino/CasinoList';

export const metadata: Metadata = { title: 'Casino List · odryn' };

const CasinoPage = () => <CasinoList />;

export default CasinoPage;
