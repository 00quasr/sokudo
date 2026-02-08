import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { SWRConfig } from 'swr';
import { PWAInit } from '@/components/pwa-init';
import { GlobalOfflineIndicator } from '@/components/GlobalOfflineIndicator';
import { SkipLinks } from '@/components/a11y/SkipLinks';
import { KeyboardShortcutsDialog } from '@/components/a11y/KeyboardShortcutsDialog';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale } from '@/lib/i18n/actions';
import { getMessages } from 'next-intl/server';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.BASE_URL || 'http://localhost:3000'),
  title: {
    default: 'Hayaku (速く) - Developer Typing Trainer',
    template: '%s | Hayaku'
  },
  description: 'Build muscle memory for git commands, terminal workflows, React patterns, and AI prompts. Master developer commands at speed with real-time feedback and targeted practice.',
  keywords: ['typing trainer', 'developer tools', 'git commands', 'terminal practice', 'coding speed', 'WPM', 'programming practice', 'React patterns', 'AI prompts', 'developer productivity'],
  authors: [{ name: 'Hayaku' }],
  creator: 'Hayaku',
  publisher: 'Hayaku',
  manifest: '/manifest.json',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'Hayaku',
    title: 'Hayaku (速く) - Developer Typing Trainer',
    description: 'Build muscle memory for git commands, terminal workflows, React patterns, and AI prompts. Master developer commands at speed.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Hayaku - Developer Typing Trainer'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hayaku (速く) - Developer Typing Trainer',
    description: 'Build muscle memory for git commands, terminal workflows, React patterns, and AI prompts.',
    images: ['/og-image.png'],
    creator: '@hayaku'
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: '',
    yandex: '',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#08090a'
};

const inter = Inter({ subsets: ['latin'] });

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`dark ${inter.className}`}
      style={{ colorScheme: 'dark' }}
    >
      <body className="min-h-[100dvh] bg-background text-foreground antialiased">
        <PWAInit />
        <GlobalOfflineIndicator />
        <SkipLinks />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <SWRConfig
            value={{
              fallback: {
                '/api/user': getUser(),
                '/api/team': getTeamForUser()
              }
            }}
          >
            {children}
          </SWRConfig>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
