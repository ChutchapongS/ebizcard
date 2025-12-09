import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import ConnectionStatus from '@/components/ConnectionStatus';

const inter = Inter({ subsets: ['latin'] });

// Get base URL from environment or default to localhost for development
// Handle URL parsing safely for static export compatibility
const getMetadataBase = (): URL | undefined => {
  try {
    if (process.env.NEXT_PUBLIC_SITE_URL) {
      return new URL(process.env.NEXT_PUBLIC_SITE_URL);
    }
    if (process.env.NODE_ENV === 'production') {
      return new URL('https://ebizcard.app'); // Fallback for production
    }
    return new URL('http://localhost:3000'); // Development default
  } catch (error) {
    // If URL parsing fails, return undefined (metadataBase is optional)
    console.warn('Failed to parse metadataBase URL:', error);
    return undefined;
  }
};

const metadataBase = getMetadataBase();

export const metadata: Metadata = {
  ...(metadataBase ? { metadataBase } : {}),
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
