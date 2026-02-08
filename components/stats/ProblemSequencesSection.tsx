'use client';

import { useState } from 'react';
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
  if (errorRate >= 50) return 'text-white/40';
  if (errorRate >= 30) return 'text-white/50';
  if (errorRate >= 20) return 'text-white/60';
  if (errorRate >= 10) return 'text-white/80';
  return 'text-white';
}

function getErrorRateBgColor(errorRate: number): string {
  if (errorRate >= 50) return 'bg-white/[0.02]';
  if (errorRate >= 30) return 'bg-white/[0.03]';
  if (errorRate >= 20) return 'bg-white/[0.04]';
  if (errorRate >= 10) return 'bg-white/[0.05]';
  return 'bg-white/[0.06]';
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
    <div className="rounded-2xl bg-white/[0.02] p-6">
      <div className="pb-4">
        <h2 className="flex items-center gap-2 text-lg font-medium text-white">
          <AlertTriangle className="h-5 w-5 text-white/60" />
          Problem sequences
        </h2>
        <p className="text-sm text-white/40 mt-1">
          Character pairs with high error rates
        </p>
      </div>
      <div className="space-y-4">
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4 pb-4 border-b border-white/[0.08]">
          <div className="text-center">
            <div className="text-sm text-white/40">Sequences tracked</div>
            <div className="font-mono text-lg font-bold text-white">{sortedData.length}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-white/40">Worst sequence</div>
            <div
              className={`font-mono text-lg font-bold ${worstSequence ? getErrorRateColor(worstSequence.errorRate) : ''}`}
            >
              {worstSequence ? formatSequence(worstSequence.sequence) : '-'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-white/40">Slowest sequence</div>
            <div className="font-mono text-lg font-bold text-white/50">
              {slowestSequence ? formatSequence(slowestSequence.sequence) : '-'}
            </div>
          </div>
        </div>

        {/* Sort toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setSortBy('errorRate')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              sortBy === 'errorRate'
                ? 'bg-white/10 text-white'
                : 'bg-white/[0.02] text-white/50 hover:text-white/70'
            }`}
          >
            <AlertTriangle className="h-3 w-3 inline mr-1" />
            Error rate
          </button>
          <button
            onClick={() => setSortBy('latency')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              sortBy === 'latency'
                ? 'bg-white/10 text-white'
                : 'bg-white/[0.02] text-white/50 hover:text-white/70'
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
              className={`p-3 rounded-lg ${getErrorRateBgColor(item.errorRate)} border border-white/[0.08]`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-white/40 w-6">
                    #{index + 1}
                  </span>
                  <div>
                    <span className="font-mono text-lg font-bold text-white">
                      {formatSequence(item.sequence)}
                    </span>
                    <div className="text-xs text-white/40">
                      {getSequenceDescription(item.sequence)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${getErrorRateColor(item.errorRate)}`}>
                    {item.errorRate}% errors
                  </div>
                  <div className="text-xs text-white/40">
                    {item.errorCount}/{item.totalAttempts} attempts •{' '}
                    {item.avgLatencyMs}ms
                  </div>
                </div>
              </div>
              {/* Error bar visualization */}
              <div className="mt-2 h-1 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all bg-white/30"
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
            className="w-full py-2 text-sm text-white/40 hover:text-white transition-colors flex items-center justify-center gap-1"
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
          <div className="mt-4 p-3 bg-white/[0.04] rounded-lg border border-white/[0.08] text-sm">
            <div className="font-semibold text-white mb-1">
              Practice tip
            </div>
            <p className="text-white/50">
              Focus on the "{formatSequence(worstSequence.sequence)}" sequence.
              Try typing it slowly and deliberately until it becomes automatic.
              You've mistyped it {worstSequence.errorCount} out of{' '}
              {worstSequence.totalAttempts} times.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
