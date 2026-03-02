import { Button } from '@/components/ui/button';
import { ArrowRight, Terminal, GitBranch, Keyboard, Container, Package, Database, FileCode, MoreHorizontal } from 'lucide-react';
import { ProductShowcase } from '@/components/bento/ProductShowcase';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Home',
  description: 'Build muscle memory for git workflows, terminal commands, React patterns, and AI prompts. Type your way to effortless coding through deliberate practice.',
  openGraph: {
    title: 'Hayaku (速く) - Master Developer Commands at Speed',
    description: 'Build muscle memory for git workflows, terminal commands, React patterns, and AI prompts. Start with 15 minutes a day of free practice.',
    url: '/',
  },
  twitter: {
    title: 'Hayaku (速く) - Master Developer Commands at Speed',
    description: 'Build muscle memory for git workflows, terminal commands, React patterns, and AI prompts.',
  },
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#08090a]">
      {/* Hero */}
      <section className="pt-32 pb-20 md:pt-44 md:pb-28">
        <div className="max-w-[800px] mx-auto text-center px-6">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-white leading-[1.15]">
            Type developer commands
            <br />
            <span className="text-white/40">without thinking</span>
          </h1>

          <p className="mt-6 text-lg text-white/50 max-w-[500px] mx-auto leading-relaxed">
            Practice git, terminal, and code patterns until they become muscle memory.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/sign-up">
              <Button className="rounded-lg bg-white text-black hover:bg-white/90 px-6 py-5 text-sm font-medium h-auto">
                Start practicing
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/practice">
              <Button variant="ghost" className="rounded-lg text-white/50 hover:text-white hover:bg-white/5 px-6 py-5 text-sm h-auto">
                View challenges
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Product Showcase */}
      <section className="pb-24 md:pb-32">
        <div className="px-6">
          <ProductShowcase />
        </div>
      </section>

      {/* What you practice */}
      <section className="py-20 border-t border-white/[0.04]">
        <div className="max-w-[900px] mx-auto px-6 text-center">
          <p className="text-xs text-white/30 uppercase tracking-widest mb-10">
            What you&apos;ll practice
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <div className="flex items-center gap-2 text-white/30 hover:text-white/50 transition-colors">
              <GitBranch className="h-4 w-4" />
              <span className="text-sm">git</span>
            </div>
            <div className="flex items-center gap-2 text-white/30 hover:text-white/50 transition-colors">
              <Container className="h-4 w-4" />
              <span className="text-sm">docker</span>
            </div>
            <div className="flex items-center gap-2 text-white/30 hover:text-white/50 transition-colors">
              <Terminal className="h-4 w-4" />
              <span className="text-sm">terminal</span>
            </div>
            <div className="flex items-center gap-2 text-white/30 hover:text-white/50 transition-colors">
              <Package className="h-4 w-4" />
              <span className="text-sm">npm</span>
            </div>
            <div className="flex items-center gap-2 text-white/30 hover:text-white/50 transition-colors">
              <FileCode className="h-4 w-4" />
              <span className="text-sm">react</span>
            </div>
            <div className="flex items-center gap-2 text-white/30 hover:text-white/50 transition-colors">
              <Database className="h-4 w-4" />
              <span className="text-sm">sql</span>
            </div>
            <div className="flex items-center gap-2 text-white/30">
              <MoreHorizontal className="h-4 w-4" />
              <span className="text-sm">etc</span>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 md:py-28">
        <div className="max-w-[1000px] mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-medium text-white text-center mb-16">
            How it works
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-10 h-10 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto mb-5">
                <Terminal className="h-4 w-4 text-white/50" />
              </div>
              <h3 className="text-sm font-medium text-white mb-2">Pick a category</h3>
              <p className="text-sm text-white/40 leading-relaxed">
                Git, Docker, terminal, or React. Practice what you actually use.
              </p>
            </div>

            <div className="text-center">
              <div className="w-10 h-10 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto mb-5">
                <Keyboard className="h-4 w-4 text-white/50" />
              </div>
              <h3 className="text-sm font-medium text-white mb-2">Type with feedback</h3>
              <p className="text-sm text-white/40 leading-relaxed">
                See mistakes in real-time. Build correct patterns from day one.
              </p>
            </div>

            <div className="text-center">
              <div className="w-10 h-10 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto mb-5">
                <GitBranch className="h-4 w-4 text-white/50" />
              </div>
              <h3 className="text-sm font-medium text-white mb-2">Track progress</h3>
              <p className="text-sm text-white/40 leading-relaxed">
                WPM, accuracy, weak spots. Watch your speed improve over time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-t border-white/[0.04]">
        <div className="max-w-[800px] mx-auto px-6">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-2xl md:text-3xl font-medium text-white">500+</p>
              <p className="text-xs text-white/30 mt-1">challenges</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-medium text-white">15</p>
              <p className="text-xs text-white/30 mt-1">categories</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-medium text-white">5 min</p>
              <p className="text-xs text-white/30 mt-1">daily practice</p>
            </div>
          </div>
        </div>
      </section>

      {/* Smart practice */}
      <section className="py-20 md:py-28">
        <div className="max-w-[900px] mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs text-white/30 uppercase tracking-widest mb-3">Smart practice</p>
              <h2 className="text-2xl md:text-3xl font-medium text-white mb-4">
                AI finds your weak spots
              </h2>
              <p className="text-white/40 leading-relaxed mb-6">
                The algorithm analyzes your keystrokes to find problem patterns.
                Get exercises that target where you actually struggle.
              </p>
              <Link href="/practice/smart">
                <Button variant="ghost" className="rounded-lg text-white/50 hover:text-white hover:bg-white/5 px-0 h-auto text-sm">
                  Try smart practice
                  <ArrowRight className="ml-2 h-3 w-3" />
                </Button>
              </Link>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 font-mono text-sm">
              <div className="flex justify-between py-2 border-b border-white/[0.04]">
                <span className="text-white/40">weak keys</span>
                <span className="text-white/70">q, z, x</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/[0.04]">
                <span className="text-white/40">slow sequences</span>
                <span className="text-white/70">git st, --force</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-white/40">focus area</span>
                <span className="text-white/70">git commands</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 md:py-32 border-t border-white/[0.04]">
        <div className="max-w-[500px] mx-auto text-center px-6">
          <h2 className="text-2xl md:text-3xl font-medium text-white mb-4">
            Start practicing
          </h2>
          <p className="text-white/40 mb-8">
            Free to use. No account required to try.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/sign-up">
              <Button className="rounded-lg bg-white text-black hover:bg-white/90 px-6 py-5 text-sm font-medium h-auto">
                Create account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/practice">
              <Button variant="ghost" className="rounded-lg text-white/50 hover:text-white hover:bg-white/5 px-6 py-5 text-sm h-auto">
                Try without account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-white/[0.04]">
        <div className="max-w-[1000px] mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-white text-black font-medium text-xs">
                速
              </div>
              <span className="text-white/40 text-sm">Hayaku</span>
            </div>
            <div className="flex items-center gap-6 text-xs text-white/30">
              <Link href="/practice" className="hover:text-white/50 transition-colors">Practice</Link>
              <Link href="/pricing" className="hover:text-white/50 transition-colors">Pricing</Link>
              <Link href="/sign-in" className="hover:text-white/50 transition-colors">Sign in</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
