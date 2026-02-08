'use client';

import Link from 'next/link';
import { useState, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, BarChart3, Settings } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { signOut } from '@/app/(login)/actions';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/db/schema';
import useSWR, { mutate } from 'swr';
import { LocaleSwitcher } from '@/components/locale-switcher';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function UserMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: user } = useSWR<User>('/api/user', fetcher);
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    mutate('/api/user');
    router.push('/');
  }

  if (!user) {
    return (
      <div className="flex items-center gap-4">
        <Link
          href="/pricing"
          className="text-sm text-white/60 hover:text-white transition-colors"
        >
          Pricing
        </Link>
        <Button asChild className="rounded-full bg-white text-black hover:bg-white/90 px-5">
          <Link href="/sign-up">Get started</Link>
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger className="focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-[#08090a] rounded-full">
        <Avatar className="cursor-pointer size-8 border border-white/10">
          <AvatarImage alt={user.name || user.email} />
          <AvatarFallback className="bg-white/5 text-white/70 text-sm">
            {user.email
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-[#111113] border-white/[0.08]">
        <DropdownMenuItem className="cursor-pointer focus:bg-white/5">
          <Link href="/dashboard" className="flex w-full items-center text-white/70">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer focus:bg-white/5">
          <Link href="/dashboard/stats" className="flex w-full items-center text-white/70">
            <BarChart3 className="mr-2 h-4 w-4" />
            <span>Statistics</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-white/[0.08]" />
        <form action={handleSignOut} className="w-full">
          <button type="submit" className="flex w-full">
            <DropdownMenuItem className="w-full flex-1 cursor-pointer text-white/50 focus:bg-white/5 focus:text-white/70">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#08090a]/80 backdrop-blur-xl border-b border-white/[0.08]">
      <nav className="max-w-[1200px] mx-auto flex items-center justify-between h-16 px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-black font-semibold text-sm">
            速
          </div>
          <span className="text-[15px] font-medium text-white/90 group-hover:text-white transition-colors">
            Hayaku
          </span>
        </Link>

        {/* Nav */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            href="/practice"
            className="text-sm text-white/60 hover:text-white transition-colors"
          >
            Practice
          </Link>
          <Link
            href="/dashboard/stats"
            className="text-sm text-white/60 hover:text-white transition-colors"
          >
            Stats
          </Link>
          <Link
            href="/pricing"
            className="text-sm text-white/60 hover:text-white transition-colors"
          >
            Pricing
          </Link>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:block">
            <LocaleSwitcher />
          </div>
          <Suspense fallback={<div className="h-8 w-8" />}>
            <UserMenu />
          </Suspense>
        </div>
      </nav>
    </header>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-[#08090a]">
      <Header />
      <div className="flex-1 pt-16">
        {children}
      </div>
    </div>
  );
}
