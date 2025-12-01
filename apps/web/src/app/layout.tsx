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
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#10B981',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
