import { redirect } from 'next/navigation';
import { ROUTES } from '@/lib/constants';

const HomePage = () => {
  redirect(ROUTES.home);
};

export default HomePage;
