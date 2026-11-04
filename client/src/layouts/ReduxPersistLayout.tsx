'use client';

import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { persistor, store } from '@/store';

type Props = {
  children: React.ReactNode;
};

const ReduxPersistLayout = ({ children }: Props) => (
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      {children}
    </PersistGate>
  </Provider>
);

export default ReduxPersistLayout;
