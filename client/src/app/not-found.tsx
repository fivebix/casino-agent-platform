import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/constants';

const NotFound = () => (
  <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
    <h1 className="text-2xl font-bold">Page not found</h1>
    <p className="text-sm text-muted">This page does not exist in the agent panel.</p>
    <Button asChild size="md">
      <Link href={ROUTES.home}>Go to Users List</Link>
    </Button>
  </main>
);

export default NotFound;
