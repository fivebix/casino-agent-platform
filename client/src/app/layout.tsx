import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import ModalAggregator from '@/components/modals';
import ReduxPersistLayout from '@/layouts/ReduxPersistLayout';
import TenantManagerLayout from '@/layouts/TenantManagerLayout';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'odryn · agent panel',
  description: 'odryn agent panel — manage your players and agents on credit.',
};

type Props = Readonly<{
  children: React.ReactNode;
}>;

const RootLayout = ({ children }: Props) => (
  <html lang="en" className={`${inter.variable} h-full`} suppressHydrationWarning>
    <body className="min-h-full">
      <ReduxPersistLayout>
        <TenantManagerLayout>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'var(--popover)',
                color: 'var(--foreground)',
                border: '1px solid var(--border-strong)',
                borderRadius: '6px',
                fontSize: '14px',
              },
              success: { iconTheme: { primary: '#c8ff00', secondary: '#0c0c0e' } },
              error: { iconTheme: { primary: '#ff5a5a', secondary: '#0c0c0e' } },
            }}
          />
          <ModalAggregator />
          {children}
        </TenantManagerLayout>
      </ReduxPersistLayout>
    </body>
  </html>
);

export default RootLayout;
