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
      <div className="rounded-2xl bg-white/[0.02] p-6">
        <h2 className="flex items-center gap-2 text-lg font-medium text-white mb-4">
          <TrendingUp className="h-5 w-5 text-emerald-500" />
          Best categories
        </h2>
        <div className="space-y-4">
          {best.byWpm && (
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-white/40">Fastest (WPM)</p>
                <p className="font-medium text-white">{best.byWpm.categoryName}</p>
              </div>
              <div className="text-right">
                <p className="font-mono font-semibold text-emerald-400">
                  {best.byWpm.avgWpm} WPM
                </p>
                <p className="text-xs text-white/40">
                  {best.byWpm.sessions} session{best.byWpm.sessions !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          )}
          {best.byAccuracy && (
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-white/40">Most accurate</p>
                <p className="font-medium text-white">{best.byAccuracy.categoryName}</p>
              </div>
              <div className="text-right">
                <p className="font-mono font-semibold text-emerald-400">
                  {best.byAccuracy.avgAccuracy}%
                </p>
                <p className="text-xs text-white/40">
                  {best.byAccuracy.sessions} session{best.byAccuracy.sessions !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Worst Categories */}
      {(worst.byWpm || worst.byAccuracy) && (
        <div className="rounded-2xl bg-white/[0.02] p-6">
          <h2 className="flex items-center gap-2 text-lg font-medium text-white mb-4">
            <TrendingDown className="h-5 w-5 text-amber-500" />
            Needs improvement
          </h2>
          <div className="space-y-4">
            {worst.byWpm && (
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-white/40">Slowest (WPM)</p>
                  <p className="font-medium text-white">{worst.byWpm.categoryName}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-semibold text-amber-400">
                    {worst.byWpm.avgWpm} WPM
                  </p>
                  <p className="text-xs text-white/40">
                    {worst.byWpm.sessions} session{worst.byWpm.sessions !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            )}
            {worst.byAccuracy && (
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-white/40">Least accurate</p>
                  <p className="font-medium text-white">{worst.byAccuracy.categoryName}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-semibold text-amber-400">
                    {worst.byAccuracy.avgAccuracy}%
                  </p>
                  <p className="text-xs text-white/40">
                    {worst.byAccuracy.sessions} session{worst.byAccuracy.sessions !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
