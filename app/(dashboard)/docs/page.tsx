import { Suspense } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Code, FileText, ExternalLink, Terminal, Zap, Users, Shield } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Developer Documentation',
  description: 'Documentation and guides for using Sokudo',
};

function DocsPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Developer Documentation</h1>
        <p className="text-muted-foreground text-lg">
          Everything you need to know to use Sokudo effectively
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Getting Started */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-5 w-5 text-orange-500" />
              <CardTitle>Getting Started</CardTitle>
            </div>
            <CardDescription>
              Learn the basics and complete your onboarding
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/dashboard/onboarding">
              <Button variant="outline" className="w-full justify-between">
                Onboarding Guide
                <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/practice">
              <Button variant="outline" className="w-full justify-between">
                Start Practicing
                <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* API Documentation */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Code className="h-5 w-5 text-blue-500" />
              <CardTitle>API Documentation</CardTitle>
            </div>
            <CardDescription>
              Integrate Sokudo with your development workflow
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/api/docs" target="_blank">
              <Button variant="outline" className="w-full justify-between">
                OpenAPI Spec
                <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard/api-keys">
              <Button variant="outline" className="w-full justify-between">
                Manage API Keys
                <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Features Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              <CardTitle>Features</CardTitle>
            </div>
            <CardDescription>
              Explore all the features Sokudo has to offer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/dashboard/stats">
              <Button variant="outline" className="w-full justify-between">
                View Your Stats
                <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard/achievements">
              <Button variant="outline" className="w-full justify-between">
                Achievements
                <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Practice Modes */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Terminal className="h-5 w-5 text-green-500" />
              <CardTitle>Practice Modes</CardTitle>
            </div>
            <CardDescription>
              Different ways to practice and improve
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/practice">
              <Button variant="outline" className="w-full justify-between">
                Solo Practice
                <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard/races">
              <Button variant="outline" className="w-full justify-between">
                Multiplayer Races
                <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Team Features */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-purple-500" />
              <CardTitle>Team Features</CardTitle>
            </div>
            <CardDescription>
              Collaborate and track progress with your team
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/dashboard">
              <Button variant="outline" className="w-full justify-between">
                Team Settings
                <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard/activity">
              <Button variant="outline" className="w-full justify-between">
                Team Activity
                <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-5 w-5 text-red-500" />
              <CardTitle>Security & Auth</CardTitle>
            </div>
            <CardDescription>
              OAuth apps, SSO, and security settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/dashboard/security">
              <Button variant="outline" className="w-full justify-between">
                Security Settings
                <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard/oauth-apps">
              <Button variant="outline" className="w-full justify-between">
                OAuth Applications
                <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Additional Resources */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Additional Resources</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="font-semibold mb-2">Quick Links</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link href="/dashboard/challenges" className="text-blue-600 hover:underline">
                      Browse Community Challenges
                    </Link>
                  </li>
                  <li>
                    <Link href="/dashboard/referrals" className="text-blue-600 hover:underline">
                      Referral Program
                    </Link>
                  </li>
                  <li>
                    <Link href="/pricing" className="text-blue-600 hover:underline">
                      View Pricing Plans
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">External Resources</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a
                      href="https://github.com/yourusername/sokudo"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline inline-flex items-center gap-1"
                    >
                      GitHub Repository
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </li>
                  <li>
                    <Link href="/api/docs" target="_blank" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                      API Reference
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DocsPageLoading() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <Skeleton className="h-10 w-96 mb-2" />
        <Skeleton className="h-6 w-full max-w-2xl" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<DocsPageLoading />}>
      <DocsPage />
    </Suspense>
  );
}
