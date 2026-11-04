import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { agentApi } from '@/services/agentApi';
import type { OddsFormat, Product } from '@/types/agent';

/**
 * Client UI preferences. `language` / `oddsFormat` mirror the agent's saved preferences (synced from
 * `AgentMe`) and are set optimistically when the top-bar menus change them. `product` is the product tab
 * last chosen on the list screens.
 */
type AppState = {
  language: string;
  oddsFormat: OddsFormat;
  product: Product;
};

const initialState: AppState = {
  language: 'en',
  oddsFormat: 'american',
  product: 'casino',
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload;
    },
    setOddsFormat: (state, action: PayloadAction<OddsFormat>) => {
      state.oddsFormat = action.payload;
    },
    setProduct: (state, action: PayloadAction<Product>) => {
      state.product = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(
      (action) =>
        agentApi.endpoints.login.matchFulfilled(action) ||
        agentApi.endpoints.getMe.matchFulfilled(action) ||
        agentApi.endpoints.updatePreferences.matchFulfilled(action),
      (
        state,
        action: PayloadAction<{ language?: string; oddsFormat?: OddsFormat } | undefined>,
      ) => {
        if (action.payload?.language) state.language = action.payload.language;
        if (action.payload?.oddsFormat) state.oddsFormat = action.payload.oddsFormat;
      },
    );
  },
});

export const { setLanguage, setOddsFormat, setProduct } = appSlice.actions;
export default appSlice.reducer;
