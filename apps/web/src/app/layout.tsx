import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import ConnectionStatus from '@/components/ConnectionStatus';

const inter = Inter({ subsets: ['latin'] });

// Get base URL from environment or default to localhost for development
const metadataBase = process.env.NEXT_PUBLIC_SITE_URL 
  ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
  : process.env.NODE_ENV === 'production'
  ? new URL('https://ebizcard.app') // Fallback for production
  : new URL('http://localhost:3000'); // Development default

export const metadata: Metadata = {
  metadataBase,
  title: 'e-BizCard - Digital Business Card Platform',
  description: 'สร้างและแชร์นามบัตรดิจิทัลของคุณได้อย่างง่ายดาย',
  keywords: 'digital business card, นามบัตรดิจิทัล, QR code, contact sharing',
  authors: [{ name: 'e-BizCard Team' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#3b82f6',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'e-BizCard - Digital Business Card Platform',
    description: 'สร้างและแชร์นามบัตรดิจิทัลของคุณได้อย่างง่ายดาย',
    type: 'website',
    locale: 'th_TH',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className={inter.className}>
        <Providers>
          {children}
          <ConnectionStatus />
        </Providers>
      </body>
    </html>
  );
}
