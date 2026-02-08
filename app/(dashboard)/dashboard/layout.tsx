'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Users, Settings, Shield, Activity, Menu, BarChart3, Trophy, FileText, Badge, Gift, Flag, KeyRound, AppWindow, Fingerprint, BookOpen } from 'lucide-react';

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { href: '/dashboard', icon: Users, label: 'Team' },
    { href: '/dashboard/general', icon: Settings, label: 'General' },
    { href: '/dashboard/onboarding', icon: BookOpen, label: 'Onboarding' },
    { href: '/dashboard/stats', icon: BarChart3, label: 'Stats' },
    { href: '/dashboard/achievements', icon: Trophy, label: 'Achievements' },
    { href: '/dashboard/challenges', icon: FileText, label: 'Challenges' },
    { href: '/dashboard/races', icon: Flag, label: 'Races' },
    { href: '/dashboard/badges', icon: Badge, label: 'Badges' },
    { href: '/dashboard/referrals', icon: Gift, label: 'Referrals' },
    { href: '/dashboard/activity', icon: Activity, label: 'Activity' },
    { href: '/dashboard/security', icon: Shield, label: 'Security' },
    { href: '/dashboard/sso', icon: Fingerprint, label: 'SSO' },
    { href: '/dashboard/api-keys', icon: KeyRound, label: 'API keys' },
    { href: '/dashboard/oauth-apps', icon: AppWindow, label: 'OAuth apps' }
  ];

  return (
    <div className="flex flex-col min-h-[calc(100dvh-64px)] max-w-[1200px] mx-auto w-full">
      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between bg-[#08090a] border-b border-white/[0.08] p-4">
        <span className="font-medium text-white">Settings</span>
        <Button
          className="-mr-3 text-white/60 hover:text-white hover:bg-white/5"
          variant="ghost"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          aria-expanded={isSidebarOpen}
          aria-controls="dashboard-navigation"
          aria-label={isSidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
        >
          <Menu className="h-6 w-6" aria-hidden="true" />
          <span className="sr-only">{isSidebarOpen ? 'Close' : 'Open'} sidebar</span>
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden h-full">
        {/* Sidebar */}
        <aside
          id="navigation"
          className={`w-56 bg-[#08090a] border-r border-white/[0.08] lg:block ${
            isSidebarOpen ? 'block' : 'hidden'
          } lg:relative absolute inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          aria-label="Dashboard navigation"
        >
          <nav
            id="dashboard-navigation"
            className="h-full overflow-y-auto p-4"
            aria-label="Dashboard settings navigation"
          >
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} passHref>
                <button
                  className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors my-0.5 ${
                    pathname === item.href
                      ? 'bg-white/[0.08] text-white'
                      : 'text-white/50 hover:text-white hover:bg-white/[0.04]'
                  }`}
                  onClick={() => setIsSidebarOpen(false)}
                  aria-current={pathname === item.href ? 'page' : undefined}
                >
                  <item.icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </button>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main id="main-content" className="flex-1 overflow-y-auto p-6 lg:p-8 bg-[#08090a]">{children}</main>
      </div>
    </div>
  );
}
