/**
 * Extracts bigram (2-character sequence) data from keystroke logs.
 * Used to track which character sequences a user struggles with,
 * enabling personalized practice content that targets problem sequences.
 */

interface KeystrokeLog {
  expected: string;
  actual: string;
  isCorrect: boolean;
  latencyMs: number;
}

export interface SequenceData {
  sequence: string;
  hadError: boolean;
  latencyMs: number;
}

/**
 * Extract bigram sequences from keystroke logs for sequence error tracking.
 * Looks at consecutive pairs of expected characters and tracks whether
 * the user made an error on the second character of the pair.
 */
export function extractSequences(logs: KeystrokeLog[]): SequenceData[] {
  if (logs.length < 2) return [];

  const sequenceMap = new Map<string, { totalLatency: number; count: number; errorCount: number }>();

  for (let i = 1; i < logs.length; i++) {
    const prev = logs[i - 1];
    const curr = logs[i];

    // Only track sequences of printable single characters
    if (prev.expected.length !== 1 || curr.expected.length !== 1) continue;

    const sequence = (prev.expected + curr.expected).toLowerCase();

    // Skip sequences with whitespace-only characters
    if (sequence.trim().length === 0) continue;

    const existing = sequenceMap.get(sequence);
    const hadError = !curr.isCorrect;

    if (existing) {
      existing.totalLatency += curr.latencyMs;
      existing.count += 1;
      if (hadError) existing.errorCount += 1;
    } else {
      sequenceMap.set(sequence, {
        totalLatency: curr.latencyMs,
        count: 1,
        errorCount: hadError ? 1 : 0,
      });
    }
  }

  // Convert to the format expected by batchUpsertSequenceErrorPatterns.
  // For each unique sequence, emit one entry per occurrence so the
  // upsert function can properly update running averages.
  const results: SequenceData[] = [];

  for (const [sequence, data] of sequenceMap) {
    const avgLatency = Math.round(data.totalLatency / data.count);
    const hadError = data.errorCount > 0;
    results.push({ sequence, hadError, latencyMs: avgLatency });
  }

  return results;
}
