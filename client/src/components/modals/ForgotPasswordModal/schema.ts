import * as yup from 'yup';

export const forgotPasswordSchema = yup.object({
  email: yup.string().trim().required('Email is required').email('Enter a valid email'),
});
