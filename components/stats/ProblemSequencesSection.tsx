'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Clock, ChevronDown, ChevronUp } from 'lucide-react';

export interface SequenceErrorData {
  sequence: string;
  totalAttempts: number;
  errorCount: number;
  errorRate: number;
  avgLatencyMs: number;
}

interface ProblemSequencesSectionProps {
  data: SequenceErrorData[];
  minAttempts?: number;
}

function getErrorRateColor(errorRate: number): string {
  if (errorRate >= 50) return 'text-red-500';
  if (errorRate >= 30) return 'text-orange-500';
  if (errorRate >= 20) return 'text-orange-400';
  if (errorRate >= 10) return 'text-yellow-400';
  return 'text-green-400';
}

function getErrorRateBgColor(errorRate: number): string {
  if (errorRate >= 50) return 'bg-red-500/20';
  if (errorRate >= 30) return 'bg-orange-500/20';
  if (errorRate >= 20) return 'bg-orange-400/20';
  if (errorRate >= 10) return 'bg-yellow-400/20';
  return 'bg-green-400/20';
}

function formatSequence(sequence: string): string {
  return sequence
    .split('')
    .map((char) => {
      if (char === ' ') return '␣';
      if (char === '\t') return '⇥';
      if (char === '\n') return '↵';
      return char;
    })
    .join('');
}

function getSequenceDescription(sequence: string): string {
  const chars = sequence.split('');
  const descriptions: string[] = [];

  for (const char of chars) {
    if (char === ' ') {
      descriptions.push('space');
    } else if (char === '\t') {
      descriptions.push('tab');
    } else if (char === '\n') {
      descriptions.push('enter');
    } else if (char.match(/[a-z]/)) {
      descriptions.push(char);
    } else if (char.match(/[A-Z]/)) {
      descriptions.push(`shift+${char.toLowerCase()}`);
    } else if (char.match(/[0-9]/)) {
      descriptions.push(char);
    } else {
      descriptions.push(`"${char}"`);
    }
  }

  return descriptions.join(' → ');
}

export function ProblemSequencesSection({
  data,
  minAttempts = 5,
}: ProblemSequencesSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const [sortBy, setSortBy] = useState<'errorRate' | 'latency'>('errorRate');

  const significantData = data.filter((d) => d.totalAttempts >= minAttempts);

  if (significantData.length === 0) {
    return null;
  }

  const sortedData = [...significantData].sort((a, b) => {
    if (sortBy === 'errorRate') {
      return b.errorRate - a.errorRate || b.errorCount - a.errorCount;
    }
    return b.avgLatencyMs - a.avgLatencyMs;
  });

  const displayData = expanded ? sortedData : sortedData.slice(0, 5);

  // Calculate summary stats
  const avgErrorRate =
    sortedData.length > 0
      ? Math.round(
          sortedData.reduce((sum, d) => sum + d.errorRate, 0) / sortedData.length
        )
      : 0;

  const worstSequence = sortedData[0];
  const slowestSequence = [...sortedData].sort(
    (a, b) => b.avgLatencyMs - a.avgLatencyMs
  )[0];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Problem Sequences
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Character pairs with high error rates
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-4 pb-4 border-b border-gray-800">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Sequences Tracked</div>
              <div className="font-mono text-lg font-bold">{sortedData.length}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Worst Sequence</div>
              <div
                className={`font-mono text-lg font-bold ${worstSequence ? getErrorRateColor(worstSequence.errorRate) : ''}`}
              >
                {worstSequence ? formatSequence(worstSequence.sequence) : '-'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Slowest Sequence</div>
              <div className="font-mono text-lg font-bold text-orange-400">
                {slowestSequence ? formatSequence(slowestSequence.sequence) : '-'}
              </div>
            </div>
          </div>

          {/* Sort toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy('errorRate')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                sortBy === 'errorRate'
                  ? 'bg-orange-500/20 text-orange-400'
                  : 'bg-gray-800 text-gray-400 hover:text-gray-300'
              }`}
            >
              <AlertTriangle className="h-3 w-3 inline mr-1" />
              Error Rate
            </button>
            <button
              onClick={() => setSortBy('latency')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                sortBy === 'latency'
                  ? 'bg-orange-500/20 text-orange-400'
                  : 'bg-gray-800 text-gray-400 hover:text-gray-300'
              }`}
            >
              <Clock className="h-3 w-3 inline mr-1" />
              Latency
            </button>
          </div>

          {/* Sequence list */}
          <div className="space-y-2">
            {displayData.map((item, index) => (
              <div
                key={item.sequence}
                className={`p-3 rounded-lg ${getErrorRateBgColor(item.errorRate)} border border-gray-800`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground w-6">
                      #{index + 1}
                    </span>
                    <div>
                      <span className="font-mono text-lg font-bold">
                        {formatSequence(item.sequence)}
                      </span>
                      <div className="text-xs text-muted-foreground">
                        {getSequenceDescription(item.sequence)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${getErrorRateColor(item.errorRate)}`}>
                      {item.errorRate}% errors
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.errorCount}/{item.totalAttempts} attempts •{' '}
                      {item.avgLatencyMs}ms
                    </div>
                  </div>
                </div>
                {/* Error bar visualization */}
                <div className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      item.errorRate >= 50
                        ? 'bg-red-500'
                        : item.errorRate >= 30
                          ? 'bg-orange-500'
                          : item.errorRate >= 20
                            ? 'bg-orange-400'
                            : item.errorRate >= 10
                              ? 'bg-yellow-400'
                              : 'bg-green-400'
                    }`}
                    style={{ width: `${Math.min(item.errorRate, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Expand/collapse button */}
          {sortedData.length > 5 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1"
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Show all {sortedData.length} sequences
                </>
              )}
            </button>
          )}

          {/* Tips */}
          {worstSequence && worstSequence.errorRate >= 20 && (
            <div className="mt-4 p-3 bg-gray-900 rounded-lg text-sm">
              <div className="font-semibold text-orange-400 mb-1">
                Practice Tip
              </div>
              <p className="text-muted-foreground">
                Focus on the "{formatSequence(worstSequence.sequence)}" sequence.
                Try typing it slowly and deliberately until it becomes automatic.
                You've mistyped it {worstSequence.errorCount} out of{' '}
                {worstSequence.totalAttempts} times.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
