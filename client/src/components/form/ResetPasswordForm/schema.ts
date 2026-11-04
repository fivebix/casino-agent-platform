import * as yup from 'yup';
import { newPasswordFields } from '@/components/form/FirstLoginForm/schema';

export const resetPasswordSchema = yup.object({
  otp: yup
    .string()
    .trim()
    .required('Enter the code from the email')
    .matches(/^\d{6}$/, 'The code is 6 digits'),
  ...newPasswordFields,
});
