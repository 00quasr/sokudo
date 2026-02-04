'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, CheckCircle2 } from 'lucide-react';

export interface CategoryMasteryData {
  categoryId: number;
  categoryName: string;
  categorySlug: string;
  totalChallenges: number;
  completedChallenges: number;
  percentComplete: number;
  avgWpm: number;
  avgAccuracy: number;
  accuracyTrend: number;
  sessions: number;
}

interface CategoryMasterySectionProps {
  data: CategoryMasteryData[];
}

function TrendIndicator({ trend }: { trend: number }) {
  if (trend === 0) {
    return <Minus className="h-3 w-3 text-gray-400" />;
  }
  if (trend > 0) {
    return (
      <span className="flex items-center gap-0.5 text-green-600">
        <TrendingUp className="h-3 w-3" />
        <span className="text-xs font-medium">+{trend}%</span>
      </span>
    );
  }
  return (
    <span className="flex items-center gap-0.5 text-red-500">
      <TrendingDown className="h-3 w-3" />
      <span className="text-xs font-medium">{trend}%</span>
    </span>
  );
}

function ProgressBar({ percent }: { percent: number }) {
  const getColorClass = (p: number) => {
    if (p >= 80) return 'bg-green-500';
    if (p >= 50) return 'bg-orange-500';
    if (p >= 25) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  return (
    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-300 ${getColorClass(percent)}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

export function CategoryMasterySection({ data }: CategoryMasterySectionProps) {
  // Filter to only show categories with challenges
  const categoriesWithChallenges = data.filter((cat) => cat.totalChallenges > 0);

  if (categoriesWithChallenges.length === 0) {
    return null;
  }

  // Sort by percent complete (descending), then by sessions (descending)
  const sortedData = [...categoriesWithChallenges].sort((a, b) => {
    if (b.percentComplete !== a.percentComplete) {
      return b.percentComplete - a.percentComplete;
    }
    return b.sessions - a.sessions;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-orange-500" />
          Category Mastery
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedData.map((cat) => (
            <div
              key={cat.categoryId}
              className="space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 truncate">
                      {cat.categoryName}
                    </p>
                    {cat.percentComplete === 100 && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        Complete
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {cat.completedChallenges}/{cat.totalChallenges} challenges
                    {cat.sessions > 0 && ` · ${cat.sessions} session${cat.sessions !== 1 ? 's' : ''}`}
                  </p>
                </div>
                {cat.sessions > 0 && (
                  <div className="flex items-center gap-4 ml-4">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">WPM</p>
                      <p className="font-mono font-semibold text-sm">{cat.avgWpm}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Accuracy</p>
                      <div className="flex items-center gap-1">
                        <p className="font-mono font-semibold text-sm">{cat.avgAccuracy}%</p>
                        {cat.accuracyTrend !== 0 && (
                          <TrendIndicator trend={cat.accuracyTrend} />
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <ProgressBar percent={cat.percentComplete} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
