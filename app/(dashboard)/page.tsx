import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
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
      {/* Hero Section */}
      <section className="pt-32 pb-20 md:pt-40 md:pb-32">
        <div className="max-w-[1000px] mx-auto text-center px-6">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight text-white leading-[1.05]">
            Build muscle memory for
            <span className="block bg-gradient-to-r from-white via-white/90 to-white/60 bg-clip-text text-transparent">
              developer commands
            </span>
          </h1>
          <p className="mt-8 text-xl md:text-2xl text-white/50 max-w-[650px] mx-auto leading-relaxed font-light">
            Master git, terminal, and coding patterns through deliberate practice.
            Type faster, code smarter.
          </p>
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/sign-up">
              <Button className="rounded-full bg-white text-black hover:bg-white/90 px-10 py-7 text-lg font-medium h-auto shadow-[0_0_40px_rgba(255,255,255,0.1)]">
                Get started free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/practice">
              <Button variant="ghost" className="rounded-full text-white/60 hover:text-white hover:bg-white/5 px-8 py-7 text-lg h-auto">
                View challenges
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Product Showcase Bento */}
      <section className="pb-20 md:pb-32">
        <div className="px-6 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-transparent blur-3xl -z-10 scale-110" />
          <ProductShowcase />
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 md:py-28 border-t border-white/[0.06]">
        <div className="max-w-[1000px] mx-auto px-6 text-center">
          <p className="text-lg md:text-xl text-white/40 mb-12">
            Built for developers who work with
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8">
            <div className="text-white/30 hover:text-white/50 transition-colors">
              <span className="text-2xl font-mono font-medium tracking-tight">git</span>
            </div>
            <div className="text-white/30 hover:text-white/50 transition-colors">
              <span className="text-2xl font-mono font-medium tracking-tight">docker</span>
            </div>
            <div className="text-white/30 hover:text-white/50 transition-colors">
              <span className="text-2xl font-mono font-medium tracking-tight">npm</span>
            </div>
            <div className="text-white/30 hover:text-white/50 transition-colors">
              <span className="text-2xl font-mono font-medium tracking-tight">bash</span>
            </div>
            <div className="text-white/30 hover:text-white/50 transition-colors">
              <span className="text-2xl font-mono font-medium tracking-tight">react</span>
            </div>
            <div className="text-white/30 hover:text-white/50 transition-colors">
              <span className="text-2xl font-mono font-medium tracking-tight">sql</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 md:py-32">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-20">
            <p className="text-white/40 text-sm uppercase tracking-widest mb-4">How it works</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium text-white leading-tight">
              Practice makes permanent
            </h2>
            <p className="mt-6 text-lg text-white/50 max-w-[550px] mx-auto">
              Build lasting muscle memory through focused, deliberate typing sessions.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="group p-10 rounded-3xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.04] transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center mb-8">
                <span className="text-2xl font-mono text-white/80">01</span>
              </div>
              <h3 className="text-xl font-medium text-white mb-4">
                Choose your focus
              </h3>
              <p className="text-white/50 leading-relaxed">
                Pick from git commands, Docker workflows, package managers, or React patterns.
                Practice what matters to your daily work.
              </p>
            </div>

            <div className="group p-10 rounded-3xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.04] transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center mb-8">
                <span className="text-2xl font-mono text-white/80">02</span>
              </div>
              <h3 className="text-xl font-medium text-white mb-4">
                Type with intent
              </h3>
              <p className="text-white/50 leading-relaxed">
                Real-time feedback shows exactly where you make mistakes.
                Build correct patterns from day one.
              </p>
            </div>

            <div className="group p-10 rounded-3xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.04] transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center mb-8">
                <span className="text-2xl font-mono text-white/80">03</span>
              </div>
              <h3 className="text-xl font-medium text-white mb-4">
                Track your growth
              </h3>
              <p className="text-white/50 leading-relaxed">
                Monitor WPM, accuracy, and problem areas over time.
                Watch your speed compound with consistent practice.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 md:py-28 border-t border-white/[0.06]">
        <div className="max-w-[1000px] mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-medium text-white mb-2">15+</p>
              <p className="text-white/40">Practice categories</p>
            </div>
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-medium text-white mb-2">500+</p>
              <p className="text-white/40">Challenges</p>
            </div>
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-medium text-white mb-2">60</p>
              <p className="text-white/40">Avg WPM gain</p>
            </div>
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-medium text-white mb-2">5min</p>
              <p className="text-white/40">Daily practice</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlight */}
      <section className="py-20 md:py-32">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-white/40 text-sm uppercase tracking-widest mb-4">Smart practice</p>
              <h2 className="text-3xl md:text-4xl font-medium text-white leading-tight mb-6">
                AI-powered weakness detection
              </h2>
              <p className="text-lg text-white/50 leading-relaxed mb-8">
                Our algorithm analyzes your typing patterns to identify problem keys and sequences.
                Get personalized exercises that target exactly where you struggle.
              </p>
              <Link href="/practice/smart">
                <Button variant="ghost" className="rounded-full text-white/70 hover:text-white hover:bg-white/5 px-6 py-5 text-base h-auto">
                  Try smart practice
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent blur-2xl" />
              <div className="relative bg-white/[0.02] border border-white/[0.08] rounded-2xl p-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-white/50 text-sm">Weak keys detected</span>
                    <span className="text-white/80 font-mono">q, z, x</span>
                  </div>
                  <div className="h-px bg-white/[0.08]" />
                  <div className="flex items-center justify-between">
                    <span className="text-white/50 text-sm">Problem sequences</span>
                    <span className="text-white/80 font-mono">git st, --force</span>
                  </div>
                  <div className="h-px bg-white/[0.08]" />
                  <div className="flex items-center justify-between">
                    <span className="text-white/50 text-sm">Suggested focus</span>
                    <span className="text-white/80 font-mono">Git commands</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 md:py-36">
        <div className="max-w-[800px] mx-auto text-center px-6">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium text-white leading-tight">
            Start building muscle memory
            <span className="block text-white/50 mt-2">today</span>
          </h2>
          <p className="mt-8 text-lg text-white/50 max-w-[500px] mx-auto">
            Free to start. No credit card required.
            15 minutes of daily practice included.
          </p>
          <div className="mt-12">
            <Link href="/sign-up">
              <Button className="rounded-full bg-white text-black hover:bg-white/90 px-12 py-7 text-lg font-medium h-auto shadow-[0_0_60px_rgba(255,255,255,0.15)]">
                Get started free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/[0.06]">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-black font-semibold text-sm">
                速
              </div>
              <span className="text-white/60 font-medium">Hayaku</span>
            </div>
            <div className="flex items-center gap-8 text-sm text-white/40">
              <Link href="/practice" className="hover:text-white/60 transition-colors">Practice</Link>
              <Link href="/pricing" className="hover:text-white/60 transition-colors">Pricing</Link>
              <Link href="/sign-in" className="hover:text-white/60 transition-colors">Sign in</Link>
            </div>
            <p className="text-sm text-white/30">
              Built for developers
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
