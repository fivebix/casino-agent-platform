'use client';

import { Provider } from 'react-redux';
import { store } from '@/store';

/** Provides the Redux store to the tree (App Router pattern), same as the back office. */
export default function StoreProvider({ children }: { children: React.ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}
