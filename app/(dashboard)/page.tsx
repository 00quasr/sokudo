import { Button } from '@/components/ui/button';
import { ArrowRight, Zap, Target, TrendingUp } from 'lucide-react';
import { Terminal } from './terminal';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Home',
  description: 'Build muscle memory for git workflows, terminal commands, React patterns, and AI prompts. Type your way to effortless coding through deliberate practice.',
  openGraph: {
    title: 'Sokudo (速度) - Master Developer Commands at Speed',
    description: 'Build muscle memory for git workflows, terminal commands, React patterns, and AI prompts. Start with 15 minutes a day of free practice.',
    url: '/',
  },
  twitter: {
    title: 'Sokudo (速度) - Master Developer Commands at Speed',
    description: 'Build muscle memory for git workflows, terminal commands, React patterns, and AI prompts.',
  },
};

export default function HomePage() {
  return (
    <main>
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight sm:text-5xl md:text-6xl">
                Master Developer Commands
                <span className="block text-orange-500">At Speed (速度)</span>
              </h1>
              <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                Build muscle memory for git workflows, terminal commands, React patterns, and AI prompts.
                Type your way to effortless coding through deliberate practice.
              </p>
              <div className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0">
                <Link href="/sign-up">
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-lg rounded-full"
                  >
                    Start Training Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
              <Terminal />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            <div>
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white">
                <Zap className="h-6 w-6" />
              </div>
              <div className="mt-5">
                <h2 className="text-lg font-medium text-gray-900">
                  Real-Time Feedback
                </h2>
                <p className="mt-2 text-base text-gray-500">
                  Instant keystroke accuracy tracking with syntax-highlighted commands.
                  See your mistakes as you type and build correct patterns.
                </p>
              </div>
            </div>

            <div className="mt-10 lg:mt-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white">
                <Target className="h-6 w-6" />
              </div>
              <div className="mt-5">
                <h2 className="text-lg font-medium text-gray-900">
                  Targeted Practice
                </h2>
                <p className="mt-2 text-base text-gray-500">
                  Categories for git workflows, Docker commands, React patterns, bash scripts,
                  and AI prompt engineering. Focus on what matters to you.
                </p>
              </div>
            </div>

            <div className="mt-10 lg:mt-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div className="mt-5">
                <h2 className="text-lg font-medium text-gray-900">
                  Track Progress
                </h2>
                <p className="mt-2 text-base text-gray-500">
                  Monitor your WPM, accuracy, and keystroke latency over time.
                  Identify weak spots and watch your speed improve.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                Ready to type faster?
              </h2>
              <p className="mt-3 max-w-3xl text-lg text-gray-500">
                Start with 15 minutes a day of free practice. Build the muscle memory
                that separates good developers from great ones.
              </p>
            </div>
            <div className="mt-8 lg:mt-0 flex justify-center lg:justify-end">
              <Link href="/practice">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg rounded-full"
                >
                  Start Practicing
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
