import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'e-BizCard - Digital Business Card Platform',
  description: 'สร้างและแชร์นามบัตรดิจิทัลของคุณได้อย่างง่ายดาย',
  keywords: 'digital business card, นามบัตรดิจิทัล, QR code, contact sharing',
  authors: [{ name: 'e-BizCard Team' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#3b82f6',
  manifest: '/manifest.json',
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
        </Providers>
      </body>
    </html>
  );
}
