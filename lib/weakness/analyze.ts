import type { KeyAccuracy, CharErrorPattern } from '@/lib/db/schema';
import type { SequenceErrorData } from '@/lib/db/queries';

export interface WeakKey {
  key: string;
  accuracy: number;
  totalPresses: number;
  correctPresses: number;
  avgLatencyMs: number;
}

export interface SlowKey {
  key: string;
  avgLatencyMs: number;
  totalPresses: number;
  accuracy: number;
}

export interface CommonTypo {
  expected: string;
  actual: string;
  count: number;
}

export interface WeaknessReport {
  weakestKeys: WeakKey[];
  slowestKeys: SlowKey[];
  commonTypos: CommonTypo[];
  problemSequences: SequenceErrorData[];
  summary: WeaknessSummary;
}

export interface WeaknessSummary {
  overallAccuracy: number;
  avgLatencyMs: number;
  totalKeysTracked: number;
  keysNeedingWork: number;
  sequencesNeedingWork: number;
  topWeakness: string | null;
}

const MIN_PRESSES = 5;
const WEAK_ACCURACY_THRESHOLD = 90;
const HIGH_ERROR_RATE_THRESHOLD = 20;

export function analyzeWeaknesses(
  keyData: KeyAccuracy[],
  errorPatterns: CharErrorPattern[],
  sequenceData: SequenceErrorData[],
  options: { weakKeyLimit?: number; slowKeyLimit?: number; typoLimit?: number; sequenceLimit?: number } = {}
): WeaknessReport {
  const {
    weakKeyLimit = 10,
    slowKeyLimit = 10,
    typoLimit = 10,
    sequenceLimit = 10,
  } = options;

  const significantKeys = keyData.filter((k) => k.totalPresses >= MIN_PRESSES);

  const weakestKeys = computeWeakestKeys(significantKeys, weakKeyLimit);
  const slowestKeys = computeSlowestKeys(significantKeys, slowKeyLimit);
  const commonTypos = computeCommonTypos(errorPatterns, typoLimit);
  const problemSequences = sequenceData.slice(0, sequenceLimit);
  const summary = computeSummary(significantKeys, problemSequences);

  return {
    weakestKeys,
    slowestKeys,
    commonTypos,
    problemSequences,
    summary,
  };
}

function computeWeakestKeys(keys: KeyAccuracy[], limit: number): WeakKey[] {
  return keys
    .map((k) => ({
      key: k.key,
      accuracy: Math.round((k.correctPresses / k.totalPresses) * 100),
      totalPresses: k.totalPresses,
      correctPresses: k.correctPresses,
      avgLatencyMs: k.avgLatencyMs,
    }))
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, limit);
}

function computeSlowestKeys(keys: KeyAccuracy[], limit: number): SlowKey[] {
  return keys
    .map((k) => ({
      key: k.key,
      avgLatencyMs: k.avgLatencyMs,
      totalPresses: k.totalPresses,
      accuracy: Math.round((k.correctPresses / k.totalPresses) * 100),
    }))
    .sort((a, b) => b.avgLatencyMs - a.avgLatencyMs)
    .slice(0, limit);
}

function computeCommonTypos(patterns: CharErrorPattern[], limit: number): CommonTypo[] {
  return patterns
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map((p) => ({
      expected: p.expectedChar,
      actual: p.actualChar,
      count: p.count,
    }));
}

function computeSummary(
  significantKeys: KeyAccuracy[],
  problemSequences: SequenceErrorData[]
): WeaknessSummary {
  const sequencesNeedingWork = problemSequences.filter(
    (s) => s.errorRate >= HIGH_ERROR_RATE_THRESHOLD
  ).length;

  if (significantKeys.length === 0) {
    // Determine top weakness from sequences if no key data yet
    let topWeakness: string | null = null;
    if (sequencesNeedingWork > 0 && problemSequences.length > 0) {
      const worst = problemSequences[0];
      topWeakness = `Sequence "${worst.sequence}" at ${worst.errorRate}% error rate`;
    }

    return {
      overallAccuracy: 0,
      avgLatencyMs: 0,
      totalKeysTracked: 0,
      keysNeedingWork: 0,
      sequencesNeedingWork,
      topWeakness,
    };
  }

  const totalPresses = significantKeys.reduce((sum, k) => sum + k.totalPresses, 0);
  const totalCorrect = significantKeys.reduce((sum, k) => sum + k.correctPresses, 0);
  const overallAccuracy = totalPresses > 0
    ? Math.round((totalCorrect / totalPresses) * 100)
    : 0;

  const totalLatency = significantKeys.reduce(
    (sum, k) => sum + k.avgLatencyMs * k.totalPresses,
    0
  );
  const avgLatencyMs = totalPresses > 0
    ? Math.round(totalLatency / totalPresses)
    : 0;

  const keysNeedingWork = significantKeys.filter((k) => {
    const acc = (k.correctPresses / k.totalPresses) * 100;
    return acc < WEAK_ACCURACY_THRESHOLD;
  }).length;

  // Find top weakness
  let topWeakness: string | null = null;
  if (keysNeedingWork > 0) {
    const worstKey = significantKeys.reduce((worst, k) => {
      const worstAcc = worst.correctPresses / worst.totalPresses;
      const kAcc = k.correctPresses / k.totalPresses;
      return kAcc < worstAcc ? k : worst;
    });
    const worstAcc = Math.round((worstKey.correctPresses / worstKey.totalPresses) * 100);
    topWeakness = `Key "${formatKeyLabel(worstKey.key)}" at ${worstAcc}% accuracy`;
  } else if (sequencesNeedingWork > 0 && problemSequences.length > 0) {
    const worst = problemSequences[0];
    topWeakness = `Sequence "${worst.sequence}" at ${worst.errorRate}% error rate`;
  }

  return {
    overallAccuracy,
    avgLatencyMs,
    totalKeysTracked: significantKeys.length,
    keysNeedingWork,
    sequencesNeedingWork,
    topWeakness,
  };
}

function formatKeyLabel(key: string): string {
  if (key === ' ') return 'Space';
  if (key === '\t') return 'Tab';
  if (key === '\n') return 'Enter';
  return key.toUpperCase();
}
