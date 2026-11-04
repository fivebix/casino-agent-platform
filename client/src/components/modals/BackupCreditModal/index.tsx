'use client';

import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import ModalShell from '@/components/modals/ModalShell';
import FormRow from '@/components/form/FormRow';
import { Input } from '@/components/ui/input';
import { useSetBackupCreditMutation } from '@/services/agentApi';
import { formatAmount } from '@/lib/format';
import { backupCreditSchema } from './schema';
import type { BackupCreditForm, BackupCreditModalProps } from './type';

const FORM_ID = 'backup-credit-form';

/**
 * Opened from the BACKUP CREDIT cell of an agent row (no own design; same frame as "Credit amount").
 * `PATCH /agent/agents/:id/backup-credit { amount }`.
 */
const BackupCreditModal = ({ isOpen, onClose, id, username, amount }: BackupCreditModalProps) => {
  const [setBackupCredit, { isLoading }] = useSetBackupCreditMutation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BackupCreditForm>({
    resolver: yupResolver(backupCreditSchema),
    defaultValues: { amount },
  });

  const onSubmit = async (values: BackupCreditForm) => {
    try {
      await setBackupCredit({ id, amount: values.amount }).unwrap();
      onClose();
    } catch {
      // The global toast shows the server message.
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={`Backup credit ${username}`}
      icon="lucide:shield-plus"
      formId={FORM_ID}
      isSaving={isLoading}
    >
      <form id={FORM_ID} onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormRow label="Current backup credit">{formatAmount(amount)}</FormRow>
        <FormRow label="Backup credit" required htmlFor="backup-credit-amount">
          <Input
            id="backup-credit-amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            min={0}
            autoFocus
            error={errors.amount?.message}
            {...register('amount')}
          />
        </FormRow>
      </form>
    </ModalShell>
  );
};

export default BackupCreditModal;
