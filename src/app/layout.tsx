import type { Metadata, Viewport } from 'next';
import { Press_Start_2P, VT323 } from 'next/font/google';
import Script from 'next/script';
import PwaSetup from '@/components/PwaSetup';
import './globals.css';

const pressStart = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-press-start',
  display: 'swap',
});

const vt323 = VT323({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-vt323',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'BITLING — Virtual Pixel Pet',
  description: 'A nostalgic pixel-art virtual pet you can check in on from work.',
  applicationName: 'BITLING',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'BITLING' },
  icons: {
    icon: [{ url: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
    apple: [{ url: '/icon-192.png' }],
  },
  openGraph: {
    title: 'BITLING',
    description: 'Raise your own pixel pet. Share it. See how long it survives.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#2D0A6B',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${pressStart.variable} ${vt323.variable}`}>
      <head>
        {/* Google AdSense */}
        <Script
          id="adsense"
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1848768296315827"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body>
        {children}
        <PwaSetup />
      </body>
    </html>
  );
}
