import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { baseApiService } from '@/services/baseApiService';

/** Singleton store, same shape as the sweepstakes back office: the RTK Query API reducer + middleware. */
export const rootReducer = combineReducers({
  [baseApiService.reducerPath]: baseApiService.reducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApiService.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
