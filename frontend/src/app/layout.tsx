import type { Metadata } from 'next';
import './globals.css';
import { TenantProvider } from '@/lib/tenant-context';
import { ThemeProvider } from '@/lib/theme-context';
import { ImageFallback } from '@/components/ImageFallback';

export const metadata: Metadata = {
  title: 'iDentify | DepEd Compatible School Management & Attendance System',
  description:
    'Philippine Department of Education (DepEd) compliant SaaS platform with RFID gate kiosks, SOC 2 audit trail, and automated SF1, SF2, SF5 form generation.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '48x48' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="facebook-light" className="light-theme theme-facebook-light">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-['Plus_Jakarta_Sans',sans-serif] antialiased min-h-screen light-theme theme-facebook-light">
        <ThemeProvider>
          <TenantProvider>{children}</TenantProvider>
          <ImageFallback />
        </ThemeProvider>
      </body>
    </html>
  );
}
