import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { CategoryBreakdown } from '@/lib/db/queries';

interface CategoryBreakdownProps {
  data: CategoryBreakdown;
}

export function CategoryBreakdownSection({ data }: CategoryBreakdownProps) {
  const { best, worst } = data;

  // Don't render if no data
  if (!best.byWpm && !best.byAccuracy) {
    return null;
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Best Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Best Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {best.byWpm && (
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Fastest (WPM)</p>
                  <p className="font-medium text-gray-900">{best.byWpm.categoryName}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-semibold text-green-600">
                    {best.byWpm.avgWpm} WPM
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {best.byWpm.sessions} session{best.byWpm.sessions !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            )}
            {best.byAccuracy && (
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Most Accurate</p>
                  <p className="font-medium text-gray-900">{best.byAccuracy.categoryName}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-semibold text-green-600">
                    {best.byAccuracy.avgAccuracy}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {best.byAccuracy.sessions} session{best.byAccuracy.sessions !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Worst Categories */}
      {(worst.byWpm || worst.byAccuracy) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-orange-500" />
              Needs Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {worst.byWpm && (
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Slowest (WPM)</p>
                    <p className="font-medium text-gray-900">{worst.byWpm.categoryName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-semibold text-orange-600">
                      {worst.byWpm.avgWpm} WPM
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {worst.byWpm.sessions} session{worst.byWpm.sessions !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              )}
              {worst.byAccuracy && (
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Least Accurate</p>
                    <p className="font-medium text-gray-900">{worst.byAccuracy.categoryName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-semibold text-orange-600">
                      {worst.byAccuracy.avgAccuracy}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {worst.byAccuracy.sessions} session{worst.byAccuracy.sessions !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
