import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Globe, Lock, Upload, GitFork } from 'lucide-react';
import Link from 'next/link';
import { getUserCustomChallenges } from '@/lib/db/queries';
import { DeleteChallengeButton } from './delete-button';

export default async function ChallengesPage() {
  const challenges = await getUserCustomChallenges();

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
          Custom Challenges
        </h1>
        <div className="flex gap-2">
          <Link href="/dashboard/challenges/import">
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-1" />
              Import
            </Button>
          </Link>
          <Link href="/dashboard/challenges/new">
            <Button className="bg-orange-500 hover:bg-orange-600 text-white">
              <Plus className="h-4 w-4 mr-1" />
              New Challenge
            </Button>
          </Link>
        </div>
      </div>

      {challenges.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center text-center py-12">
            <FileText className="h-12 w-12 text-orange-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No custom challenges yet
            </h3>
            <p className="text-sm text-gray-500 max-w-sm mb-4">
              Create your own typing challenges with custom content like git commands, code snippets, or terminal workflows.
            </p>
            <Link href="/dashboard/challenges/new">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                <Plus className="h-4 w-4 mr-1" />
                Create Your First Challenge
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {challenges.map((challenge) => (
            <Card key={challenge.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900 truncate">
                      {challenge.name}
                    </h3>
                    {challenge.isPublic ? (
                      <Globe className="h-3.5 w-3.5 text-green-500 shrink-0" />
                    ) : (
                      <Lock className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    )}
                    {challenge.forkedFromId && (
                      <span className="inline-flex items-center gap-1 text-xs text-orange-500">
                        <GitFork className="h-3 w-3" />
                        Forked
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {challenge.content.length > 100
                      ? challenge.content.slice(0, 100) + '...'
                      : challenge.content}
                  </p>
                  <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                    <span>{challenge.content.length} chars</span>
                    <span>Completed {challenge.timesCompleted} times</span>
                    <span>
                      Created {challenge.createdAt.toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4 shrink-0">
                  <Link href={`/dashboard/challenges/${challenge.id}/edit`}>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </Link>
                  <DeleteChallengeButton challengeId={challenge.id} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
