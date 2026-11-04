import type { Metadata } from 'next';
import SettingsScreen from '@/components/settings/SettingsScreen';

export const metadata: Metadata = { title: 'Settings · odryn' };

const SettingsPage = () => <SettingsScreen />;

export default SettingsPage;
