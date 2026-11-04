import * as yup from 'yup';

/** Empty input → `undefined` (not `NaN`), so the optional fields can be left blank. */
const amount = () =>
  yup
    .number()
    .transform((value, original) => (original === '' || original == null ? undefined : value))
    .typeError('Enter a number');

export const creditAmountSchema = yup.object({
  creditAmount: amount().required('Credit amount is required').min(0, 'Must be 0 or more'),
  addExtra: amount().moreThan(0, 'Must be more than 0').optional(),
  withdraw: amount().moreThan(0, 'Must be more than 0').optional(),
});
