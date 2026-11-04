import { useCallback } from 'react';
import { useAppDispatch } from '@/hooks/useReduxHooks';
import { closeAllModals, closeModal, openModal } from '@/slices/modalSlice';
import type { ModalPropsMap, ModalType } from '@/components/modals/types';

/**
 * `const { open, close } = useModal(); open(MODAL_TYPES.BALANCE);`
 * `open(MODAL_TYPES.SOME_MODAL, { userId })` — props are typed per modal through `ModalPropsMap`.
 */
export const useModal = () => {
  const dispatch = useAppDispatch();

  const open = useCallback(
    <T extends ModalType>(type: T, props?: ModalPropsMap[T]) =>
      dispatch(openModal({ type, props: props as Record<string, unknown> | undefined })),
    [dispatch],
  );
  const close = useCallback(() => dispatch(closeModal()), [dispatch]);
  const closeAll = useCallback(() => dispatch(closeAllModals()), [dispatch]);

  return { open, close, closeAll };
};
