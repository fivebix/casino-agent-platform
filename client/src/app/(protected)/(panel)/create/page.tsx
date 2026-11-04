import type { Metadata } from 'next';
import CreateUserForm from '@/components/form/CreateUserForm';

export const metadata: Metadata = { title: 'Create New Player · odryn' };

const CreatePage = () => <CreateUserForm />;

export default CreatePage;
