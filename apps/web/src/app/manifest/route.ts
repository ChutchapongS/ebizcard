import { NextResponse } from 'next/server';

export async function GET() {
  const manifest = {
    name: 'e-BizCard - Digital Business Card Platform',
    short_name: 'e-BizCard',
    description: 'สร้างและแชร์นามบัตรดิจิทัลของคุณได้อย่างง่ายดาย',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#3b82f6',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable any'
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable any'
      }
    ],
    categories: ['business', 'productivity', 'utilities'],
    lang: 'th',
    dir: 'ltr'
  };

  return new NextResponse(JSON.stringify(manifest), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
