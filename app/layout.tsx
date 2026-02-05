import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { SWRConfig } from 'swr';
import { ThemeProvider } from '@/components/theme-provider';
import { PWAInit } from '@/components/pwa-init';
import { GlobalOfflineIndicator } from '@/components/GlobalOfflineIndicator';
import { SkipLinks } from '@/components/a11y/SkipLinks';
import { KeyboardShortcutsDialog } from '@/components/a11y/KeyboardShortcutsDialog';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.BASE_URL || 'http://localhost:3000'),
  title: {
    default: 'Sokudo (速度) - Developer Typing Trainer',
    template: '%s | Sokudo'
  },
  description: 'Build muscle memory for git commands, terminal workflows, React patterns, and AI prompts. Master developer commands at speed with real-time feedback and targeted practice.',
  keywords: ['typing trainer', 'developer tools', 'git commands', 'terminal practice', 'coding speed', 'WPM', 'programming practice', 'React patterns', 'AI prompts', 'developer productivity'],
  authors: [{ name: 'Sokudo' }],
  creator: 'Sokudo',
  publisher: 'Sokudo',
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
    siteName: 'Sokudo',
    title: 'Sokudo (速度) - Developer Typing Trainer',
    description: 'Build muscle memory for git commands, terminal workflows, React patterns, and AI prompts. Master developer commands at speed.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Sokudo - Developer Typing Trainer'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sokudo (速度) - Developer Typing Trainer',
    description: 'Build muscle memory for git commands, terminal workflows, React patterns, and AI prompts.',
    images: ['/og-image.png'],
    creator: '@sokudo'
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
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0b' }
  ]
};

const manrope = Manrope({ subsets: ['latin'] });

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`bg-white dark:bg-gray-950 text-black dark:text-white ${manrope.className}`}
      suppressHydrationWarning
    >
      <body className="min-h-[100dvh] bg-gray-50">
        <PWAInit />
        <GlobalOfflineIndicator />
        <SkipLinks />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <KeyboardShortcutsDialog />
          <SWRConfig
            value={{
              fallback: {
                // We do NOT await here
                // Only components that read this data will suspend
                '/api/user': getUser(),
                '/api/team': getTeamForUser()
              }
            }}
          >
            {children}
          </SWRConfig>
        </ThemeProvider>
      </body>
    </html>
  );
}
