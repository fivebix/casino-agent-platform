import * as yup from 'yup';

export const backupCreditSchema = yup.object({
  amount: yup
    .number()
    .transform((value, original) => (original === '' || original == null ? undefined : value))
    .typeError('Enter a number')
    .required('Backup credit is required')
    .min(0, 'Must be 0 or more'),
});
