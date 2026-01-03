import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Hima Admin Dashboard',
  description: 'Admin and Liquidity Provider Dashboard for Hima',
};

import { Toaster } from 'sonner';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Toaster position="top-right" theme="dark" closeButton richColors />
        {children}
      </body>
    </html>
  );
}
