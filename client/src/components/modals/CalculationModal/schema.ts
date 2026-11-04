import * as yup from 'yup';

export const calculationSchema = yup.object({
  amount: yup
    .number()
    .transform((value, original) => (original === '' || original == null ? undefined : value))
    .typeError('Enter a number')
    .required('Correction sum is required')
    .notOneOf([0], 'Must not be 0'),
  comment: yup.string().trim().max(255, 'At most 255 characters').optional(),
});
