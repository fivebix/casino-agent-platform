import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ModalType } from '@/components/modals/types';

export type ModalEntry = {
  type: ModalType;
  /** Must be serializable (it lives in Redux). Pass ids, not callbacks. */
  props?: Record<string, unknown>;
};

export type ModalState = {
  stack: ModalEntry[];
};

const initialState: ModalState = {
  stack: [],
};

const modalSlice = createSlice({
  name: 'modal',
  initialState,
  reducers: {
    openModal: (state, action: PayloadAction<ModalEntry>) => {
      // Re-opening a modal moves it to the top instead of stacking a duplicate.
      state.stack = state.stack.filter((m) => m.type !== action.payload.type);
      state.stack.push(action.payload);
    },
    closeModal: (state) => {
      state.stack.pop();
    },
    closeAllModals: (state) => {
      state.stack = [];
    },
  },
});

export const { openModal, closeModal, closeAllModals } = modalSlice.actions;

export const selectModalStack = (state: { modal: ModalState }) => state.modal.stack;

export default modalSlice.reducer;
