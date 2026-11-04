'use client';

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/useReduxHooks';
import { closeModal, selectModalStack } from '@/slices/modalSlice';
import { MODAL_TYPES, type ModalType } from '@/components/modals/types';

export { MODAL_TYPES } from '@/components/modals/types';

// Modals are code-split and client-only.
const BalanceModal = dynamic(() => import('@/components/modals/BalanceModal'), { ssr: false });
const ForgotPasswordModal = dynamic(() => import('@/components/modals/ForgotPasswordModal'), {
  ssr: false,
});
const BetDetailsModal = dynamic(() => import('@/components/modals/BetDetailsModal'), {
  ssr: false,
});
const CreditAmountModal = dynamic(() => import('@/components/modals/CreditAmountModal'), {
  ssr: false,
});
const BackupCreditModal = dynamic(() => import('@/components/modals/BackupCreditModal'), {
  ssr: false,
});
const CalculationModal = dynamic(() => import('@/components/modals/CalculationModal'), {
  ssr: false,
});
const UserEditModal = dynamic(() => import('@/components/modals/UserEditModal'), {
  ssr: false,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MODAL_COMPONENTS: Record<ModalType, ComponentType<any>> = {
  [MODAL_TYPES.BALANCE]: BalanceModal,
  [MODAL_TYPES.FORGOT_PASSWORD]: ForgotPasswordModal,
  [MODAL_TYPES.BET_DETAILS]: BetDetailsModal,
  [MODAL_TYPES.CREDIT_AMOUNT]: CreditAmountModal,
  [MODAL_TYPES.BACKUP_CREDIT]: BackupCreditModal,
  [MODAL_TYPES.CALCULATION]: CalculationModal,
  [MODAL_TYPES.USER_EDIT]: UserEditModal,
};

/**
 * Renders the Redux modal stack (mounted once in the root layout). Open with
 * `dispatch(openModal({ type: MODAL_TYPES.X, props }))` or `useModal().open(MODAL_TYPES.X, props)`.
 * Each modal gets `isOpen`, `onClose` and its own props.
 */
const ModalAggregator = () => {
  const stack = useAppSelector(selectModalStack);
  const dispatch = useAppDispatch();

  if (stack.length === 0) return null;

  return (
    <>
      {stack.map((modal, index) => {
        const Component = MODAL_COMPONENTS[modal.type];
        if (!Component) return null;
        return (
          <Component
            key={`${modal.type}-${index}`}
            isOpen
            onClose={() => dispatch(closeModal())}
            {...modal.props}
          />
        );
      })}
    </>
  );
};

export default ModalAggregator;
