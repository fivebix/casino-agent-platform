import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import StoreProvider from '@/components/StoreProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Agent Platform — Console',
  description: 'Operator console for the agent-platform API',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <body>
        <StoreProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'var(--surface)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                fontSize: '13px',
              },
            }}
          />
        </StoreProvider>
      </body>
    </html>
  );
}
