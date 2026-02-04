import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Lock, AlertCircle } from 'lucide-react';
import { getUserAchievements } from '@/lib/db/queries';
import { AchievementCard } from '@/components/achievements/AchievementCard';

type CriteriaType = 'wpm' | 'accuracy' | 'streak' | 'sessions_completed' | 'category_mastery';

interface Criteria {
  type: CriteriaType;
}

function getCategoryLabel(type: CriteriaType): string {
  switch (type) {
    case 'wpm':
      return 'Speed';
    case 'accuracy':
      return 'Accuracy';
    case 'streak':
      return 'Streak';
    case 'sessions_completed':
      return 'Practice';
    case 'category_mastery':
      return 'Mastery';
    default:
      return 'Other';
  }
}

const categoryOrder: CriteriaType[] = [
  'wpm',
  'accuracy',
  'streak',
  'sessions_completed',
  'category_mastery',
];

export default async function AchievementsPage() {
  const achievements = await getUserAchievements();

  const earned = achievements.filter((a) => a.earnedAt !== null);
  const total = achievements.length;

  // Group achievements by criteria type
  const grouped = new Map<CriteriaType, typeof achievements>();
  for (const achievement of achievements) {
    const criteria = achievement.criteria as Criteria;
    const type = criteria.type;
    const existing = grouped.get(type) ?? [];
    existing.push(achievement);
    grouped.set(type, existing);
  }

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">
        Achievements
      </h1>

      {total === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center text-center py-12">
            <AlertCircle className="h-12 w-12 text-orange-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No achievements available
            </h3>
            <p className="text-sm text-gray-500 max-w-sm">
              Achievement definitions haven&apos;t been set up yet. Run the
              achievement seed to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="bg-yellow-100 rounded-full p-2">
                    <Trophy className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Earned
                    </p>
                    <p className="text-2xl font-mono font-semibold">
                      {earned.length}
                      <span className="text-sm text-muted-foreground font-normal">
                        /{total}
                      </span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 rounded-full p-2">
                    <Trophy className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Completion
                    </p>
                    <p className="text-2xl font-mono font-semibold">
                      {total > 0
                        ? Math.round((earned.length / total) * 100)
                        : 0}
                      %
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-2 lg:col-span-1">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="bg-gray-100 rounded-full p-2">
                    <Lock className="h-5 w-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Remaining
                    </p>
                    <p className="text-2xl font-mono font-semibold">
                      {total - earned.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Achievement Categories */}
          {categoryOrder.map((type) => {
            const items = grouped.get(type);
            if (!items || items.length === 0) return null;

            return (
              <Card key={type}>
                <CardHeader>
                  <CardTitle>{getCategoryLabel(type)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((achievement) => (
                      <AchievementCard
                        key={achievement.id}
                        achievement={achievement}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
