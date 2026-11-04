import * as yup from 'yup';
import { PASSWORD_MIN_LENGTH } from '@/lib/constants';

export const changePasswordSchema = yup.object({
  currentPassword: yup
    .string()
    .required('Enter your current password')
    .max(128, 'At most 128 characters'),
  newPassword: yup
    .string()
    .required('Enter a new password')
    .min(PASSWORD_MIN_LENGTH, `At least ${PASSWORD_MIN_LENGTH} characters`)
    .max(128, 'At most 128 characters'),
  confirmPassword: yup
    .string()
    .required('Confirm the password')
    .oneOf([yup.ref('newPassword')], 'Passwords do not match'),
});
