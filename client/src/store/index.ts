import {
  combineReducers,
  configureStore,
  type Reducer,
  type UnknownAction,
} from '@reduxjs/toolkit';
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  persistReducer,
  persistStore,
  type PersistConfig,
} from 'redux-persist';
import createWebStorage from 'redux-persist/lib/storage/createWebStorage';
import { baseApiService } from '@/services/baseApiService';
import authReducer from '@/slices/authSlice';
import appReducer from '@/slices/appSlice';
import tenantReducer from '@/slices/tenantSlice';
import modalReducer from '@/slices/modalSlice';

export const rootReducer = combineReducers({
  auth: authReducer,
  app: appReducer,
  tenant: tenantReducer,
  modal: modalReducer,
  [baseApiService.reducerPath]: baseApiService.reducer,
});

export type RootState = ReturnType<typeof rootReducer>;

/** localStorage in the browser, a no-op on the server (avoids the redux-persist SSR warning). */
const storage =
  typeof window !== 'undefined'
    ? createWebStorage('local')
    : {
        getItem: () => Promise.resolve(null),
        setItem: (_key: string, value: unknown) => Promise.resolve(value),
        removeItem: () => Promise.resolve(),
      };

const persistConfig: PersistConfig<RootState> = {
  key: 'odryn-agent',
  version: 1,
  storage,
  whitelist: ['auth', 'app'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer) as unknown as Reducer<
  RootState,
  UnknownAction
>;

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(baseApiService.middleware),
});

export const persistor = persistStore(store);
