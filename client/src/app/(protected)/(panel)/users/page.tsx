import { Suspense } from 'react';
import type { Metadata } from 'next';
import UsersList from '@/components/users/UsersList';

export const metadata: Metadata = { title: 'Users List · odryn' };

// UsersList reads its filters from the URL (useSearchParams), which needs a Suspense boundary.
const UsersPage = () => (
  <Suspense fallback={null}>
    <UsersList />
  </Suspense>
);

export default UsersPage;
