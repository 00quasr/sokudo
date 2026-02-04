import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Target,
  TrendingUp,
  TrendingDown,
  Keyboard,
  Clock,
  AlertTriangle,
  Zap,
  Flame,
  ArrowRight,
  Lightbulb,
  FolderOpen,
} from 'lucide-react';
import type {
  PracticeRecommendation,
  RecommendationType,
} from '@/lib/practice/recommendations';

interface PracticeRecommendationsProps {
  recommendations: PracticeRecommendation[];
}

const typeIcons: Record<RecommendationType, typeof Target> = {
  weak_category: Target,
  unexplored_category: FolderOpen,
  weak_key: Keyboard,
  slow_key: Clock,
  common_typo: AlertTriangle,
  problem_sequence: Zap,
  difficulty_up: TrendingUp,
  difficulty_down: TrendingDown,
  accuracy_focus: Target,
  speed_focus: TrendingUp,
  streak_reminder: Flame,
  practice_more: Lightbulb,
};

const priorityStyles: Record<string, string> = {
  high: 'border-l-red-500 bg-red-50/50',
  medium: 'border-l-orange-400 bg-orange-50/50',
  low: 'border-l-blue-400 bg-blue-50/50',
};

export function PracticeRecommendations({
  recommendations,
}: PracticeRecommendationsProps) {
  if (recommendations.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Lightbulb className="h-5 w-5 text-orange-500" />
          You should practice...
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recommendations.map((rec, idx) => {
            const Icon = typeIcons[rec.type] || Lightbulb;

            return (
              <Link
                key={`${rec.type}-${idx}`}
                href={rec.actionHref}
                className={`group flex items-start gap-3 rounded-lg border border-l-4 p-3 transition-all hover:shadow-md ${priorityStyles[rec.priority]}`}
              >
                <div className="mt-0.5 flex-shrink-0">
                  <Icon className="h-4 w-4 text-gray-500 group-hover:text-orange-500 transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 group-hover:text-orange-600 transition-colors">
                      {rec.title}
                    </p>
                    {rec.metric && (
                      <span className="inline-flex flex-shrink-0 items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-600">
                        {rec.metric}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">
                    {rec.description}
                  </p>
                </div>
                <div className="flex-shrink-0 self-center">
                  <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-orange-400 transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
