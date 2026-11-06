import type { Metadata } from 'next';
import CreateUserForm from '@/components/form/CreateUserForm';

export const metadata: Metadata = { title: 'Create New Player · odryn' };

const CreatePage = () => (
  <div data-phone-form="">
    <CreateUserForm />
  </div>
);

export default CreatePage;
