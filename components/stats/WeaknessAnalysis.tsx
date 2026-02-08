'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  Zap,
  Clock,
  ArrowRightLeft,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { WeaknessReport, WeakKey, SlowKey, CommonTypo } from '@/lib/weakness/analyze';
import type { SequenceErrorData } from '@/lib/db/queries';

interface WeaknessAnalysisProps {
  report: WeaknessReport;
}

function formatKeyLabel(key: string): string {
  if (key === ' ') return 'Space';
  if (key === '\t') return 'Tab';
  if (key === '\n') return 'Enter';
  return key.toUpperCase();
}

function getAccuracyColor(accuracy: number): string {
  if (accuracy >= 95) return 'text-emerald-400';
  if (accuracy >= 90) return 'text-sky-400';
  if (accuracy >= 80) return 'text-amber-400';
  return 'text-rose-400';
}

function getLatencyColor(latencyMs: number): string {
  if (latencyMs <= 100) return 'text-emerald-400';
  if (latencyMs <= 150) return 'text-sky-400';
  if (latencyMs <= 200) return 'text-amber-400';
  return 'text-rose-400';
}

function getErrorRateColor(errorRate: number): string {
  if (errorRate >= 50) return 'text-rose-400';
  if (errorRate >= 30) return 'text-amber-400';
  if (errorRate >= 20) return 'text-sky-400';
  return 'text-emerald-400';
}

function WeakKeysTable({ keys }: { keys: WeakKey[] }) {
  const [expanded, setExpanded] = useState(false);
  const displayKeys = expanded ? keys : keys.slice(0, 5);

  if (keys.length === 0) {
    return (
      <p className="text-sm text-white/40 py-4 text-center">
        Not enough data yet. Keep practicing!
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-2 text-xs text-white/40 tracking-wide px-3 pb-1">
        <span>Key</span>
        <span className="text-right">Accuracy</span>
        <span className="text-right">Latency</span>
        <span className="text-right">Presses</span>
      </div>
      {displayKeys.map((k) => (
        <div
          key={k.key}
          className="grid grid-cols-4 gap-2 items-center px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.08]"
        >
          <span className="font-mono font-bold text-lg text-white">
            {formatKeyLabel(k.key)}
          </span>
          <span className={`text-right font-mono font-semibold ${getAccuracyColor(k.accuracy)}`}>
            {k.accuracy}%
          </span>
          <span className={`text-right font-mono text-sm ${getLatencyColor(k.avgLatencyMs)}`}>
            {k.avgLatencyMs}ms
          </span>
          <span className="text-right font-mono text-sm text-white/40">
            {k.totalPresses}
          </span>
        </div>
      ))}
      {keys.length > 5 && (
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
              Show all {keys.length} keys
            </>
          )}
        </button>
      )}
    </div>
  );
}

function SlowKeysTable({ keys }: { keys: SlowKey[] }) {
  const [expanded, setExpanded] = useState(false);
  const displayKeys = expanded ? keys : keys.slice(0, 5);

  if (keys.length === 0) {
    return (
      <p className="text-sm text-white/40 py-4 text-center">
        Not enough data yet. Keep practicing!
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2 text-xs text-white/40 tracking-wide px-3 pb-1">
        <span>Key</span>
        <span className="text-right">Avg latency</span>
        <span className="text-right">Accuracy</span>
      </div>
      {displayKeys.map((k) => (
        <div
          key={k.key}
          className="grid grid-cols-3 gap-2 items-center px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.08]"
        >
          <span className="font-mono font-bold text-lg text-white">
            {formatKeyLabel(k.key)}
          </span>
          <span className={`text-right font-mono font-semibold ${getLatencyColor(k.avgLatencyMs)}`}>
            {k.avgLatencyMs}ms
          </span>
          <span className={`text-right font-mono text-sm ${getAccuracyColor(k.accuracy)}`}>
            {k.accuracy}%
          </span>
        </div>
      ))}
      {keys.length > 5 && (
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
              Show all {keys.length} keys
            </>
          )}
        </button>
      )}
    </div>
  );
}

function TyposTable({ typos }: { typos: CommonTypo[] }) {
  if (typos.length === 0) {
    return (
      <p className="text-sm text-white/40 py-4 text-center">
        No typo patterns detected yet.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2 text-xs text-white/40 tracking-wide px-3 pb-1">
        <span>Expected</span>
        <span>Typed instead</span>
        <span className="text-right">Count</span>
      </div>
      {typos.map((t) => (
        <div
          key={`${t.expected}-${t.actual}`}
          className="grid grid-cols-3 gap-2 items-center px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.08]"
        >
          <span className="font-mono font-bold text-white">
            {formatKeyLabel(t.expected)}
          </span>
          <span className="font-mono font-bold text-white/60">
            {formatKeyLabel(t.actual)}
          </span>
          <span className="text-right font-mono text-sm text-white/40">
            {t.count}x
          </span>
        </div>
      ))}
    </div>
  );
}

function ProblemSequencesList({ sequences }: { sequences: SequenceErrorData[] }) {
  if (sequences.length === 0) {
    return (
      <p className="text-sm text-white/40 py-4 text-center">
        No problem sequences detected yet.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {sequences.slice(0, 5).map((s, i) => (
        <div
          key={s.sequence}
          className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.08]"
        >
          <div className="flex items-center gap-3">
            <span className="text-sm text-white/40 w-5">#{i + 1}</span>
            <span className="font-mono font-bold text-lg text-white">
              {s.sequence.split('').map((c) => (c === ' ' ? '\u2423' : c)).join('')}
            </span>
          </div>
          <div className="text-right">
            <span className={`font-mono font-semibold ${getErrorRateColor(s.errorRate)}`}>
              {s.errorRate}% errors
            </span>
            <span className="text-xs text-white/40 ml-2">
              {s.avgLatencyMs}ms
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function WeaknessAnalysis({ report }: WeaknessAnalysisProps) {
  const { summary, weakestKeys, slowestKeys, commonTypos, problemSequences } = report;
  const [activeTab, setActiveTab] = useState<'keys' | 'speed' | 'typos' | 'sequences'>('keys');

  const hasData = summary.totalKeysTracked > 0;

  if (!hasData) {
    return null;
  }

  const tabs = [
    { id: 'keys' as const, label: 'Weak keys', icon: AlertTriangle, count: summary.keysNeedingWork },
    { id: 'speed' as const, label: 'Slow keys', icon: Clock, count: slowestKeys.length },
    { id: 'typos' as const, label: 'Common typos', icon: ArrowRightLeft, count: commonTypos.length },
    { id: 'sequences' as const, label: 'Sequences', icon: Zap, count: summary.sequencesNeedingWork },
  ];

  return (
    <div className="rounded-2xl bg-white/[0.02] p-6">
      <div className="pb-4">
        <h2 className="flex items-center gap-2 text-lg font-medium text-white">
          <AlertTriangle className="h-5 w-5 text-white/60" />
          Weakness analysis
        </h2>
        <p className="text-sm text-white/40 mt-1">
          Areas that need the most practice
        </p>
      </div>
      <div className="space-y-4">
        {/* Summary bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pb-4 border-b border-white/[0.08]">
          <div className="text-center">
            <div className="text-xs text-white/40">Key accuracy</div>
            <div className={`font-mono text-lg font-bold ${getAccuracyColor(summary.overallAccuracy)}`}>
              {summary.overallAccuracy}%
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-white/40">Avg latency</div>
            <div className={`font-mono text-lg font-bold ${getLatencyColor(summary.avgLatencyMs)}`}>
              {summary.avgLatencyMs}ms
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-white/40">Keys needing work</div>
            <div className="font-mono text-lg font-bold text-white/60">
              {summary.keysNeedingWork}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-white/40">Problem sequences</div>
            <div className="font-mono text-lg font-bold text-white/60">
              {summary.sequencesNeedingWork}
            </div>
          </div>
        </div>

        {/* Top weakness callout */}
        {summary.topWeakness && (
          <div className="p-3 bg-white/[0.04] border border-white/[0.08] rounded-lg">
            <div className="text-sm font-semibold text-white mb-0.5">
              Top weakness
            </div>
            <p className="text-sm text-white/50">
              {summary.topWeakness}
            </p>
          </div>
        )}

        {/* Tab navigation */}
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-white/10 text-white'
                  : 'bg-white/[0.02] text-white/50 hover:text-white/70'
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-1 text-xs bg-white/10 px-1.5 py-0.5 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div>
          {activeTab === 'keys' && <WeakKeysTable keys={weakestKeys} />}
          {activeTab === 'speed' && <SlowKeysTable keys={slowestKeys} />}
          {activeTab === 'typos' && <TyposTable typos={commonTypos} />}
          {activeTab === 'sequences' && <ProblemSequencesList sequences={problemSequences} />}
        </div>
      </div>
    </div>
  );
}
