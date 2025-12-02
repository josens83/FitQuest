import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FitQuest - 게이미피케이션 홈 피트니스',
  description: '운동을 RPG처럼 즐기세요. 레벨업하고, 업적을 달성하고, 건강해지세요!',
  keywords: ['피트니스', '홈트레이닝', '운동', '게이미피케이션', '다이어트', '건강'],
  authors: [{ name: 'FitQuest Team' }],
  applicationName: 'FitQuest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FitQuest',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: 'https://fitquest.app',
    title: 'FitQuest - 게이미피케이션 홈 피트니스',
    description: '운동을 RPG처럼 즐기세요. 레벨업하고, 업적을 달성하고, 건강해지세요!',
    siteName: 'FitQuest',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FitQuest - 게이미피케이션 홈 피트니스',
    description: '운동을 RPG처럼 즐기세요. 레벨업하고, 업적을 달성하고, 건강해지세요!',
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: [
      { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: '#6366f1',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
