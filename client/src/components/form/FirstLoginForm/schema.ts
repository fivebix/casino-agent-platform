import * as yup from 'yup';
import { PASSWORD_MIN_LENGTH } from '@/lib/constants';

export const newPasswordFields = {
  newPassword: yup
    .string()
    .required('Enter a new password')
    .min(PASSWORD_MIN_LENGTH, `At least ${PASSWORD_MIN_LENGTH} characters`),
  confirmPassword: yup
    .string()
    .required('Confirm the password')
    .oneOf([yup.ref('newPassword')], 'Passwords do not match'),
};

export const firstLoginSchema = yup.object(newPasswordFields);
