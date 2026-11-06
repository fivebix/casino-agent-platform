import type { Viewport } from 'next';
import PhoneMarker from '@/components/common/PhoneMarker';
import AppLayout from '@/layouts/AppLayout';

/**
 * After login the panel is desktop-only, like 50bet: a phone lays the page out at this width and
 * zooms out to fit, so it shows the same view as a desktop. The login screens keep the device width.
 */
export const viewport: Viewport = { width: '1280', initialScale: undefined };

type Props = {
  children: React.ReactNode;
};

const PanelLayout = ({ children }: Props) => (
  <AppLayout>
    <PhoneMarker />
    {children}
  </AppLayout>
);

export default PanelLayout;
