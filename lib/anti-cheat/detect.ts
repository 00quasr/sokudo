import { calculateWpm, calculateAccuracy } from '../typing/wpm';

export interface AntiCheatInput {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  keystrokes: number;
  errors: number;
  durationMs: number;
  keystrokeLogs?: KeystrokeLogInput[];
}

export interface KeystrokeLogInput {
  timestamp: number;
  expected: string;
  actual: string;
  isCorrect: boolean;
  latencyMs: number;
}

export type AntiCheatFlag =
  | 'UNREALISTIC_WPM'
  | 'WPM_MISMATCH'
  | 'ACCURACY_MISMATCH'
  | 'ROBOTIC_TIMING'
  | 'IMPOSSIBLY_FAST_KEYSTROKES'
  | 'DURATION_MISMATCH'
  | 'KEYSTROKE_COUNT_MISMATCH';

export interface AntiCheatViolation {
  flag: AntiCheatFlag;
  message: string;
}

export interface AntiCheatResult {
  passed: boolean;
  violations: AntiCheatViolation[];
}

// Thresholds
const MAX_LEGITIMATE_WPM = 250;
const MIN_KEYSTROKE_LATENCY_MS = 15;
const WPM_TOLERANCE = 0.25;
const ACCURACY_TOLERANCE = 5;
const MIN_LATENCY_STDDEV_MS = 5;
const DURATION_TOLERANCE = 0.20;

export function detectAntiCheat(input: AntiCheatInput): AntiCheatResult {
  const violations: AntiCheatViolation[] = [];

  violations.push(...checkUnrealisticWpm(input));
  violations.push(...checkWpmConsistency(input));
  violations.push(...checkAccuracyConsistency(input));

  if (input.keystrokeLogs && input.keystrokeLogs.length > 0) {
    violations.push(...checkKeystrokeTiming(input.keystrokeLogs));
    violations.push(...checkRoboticTiming(input.keystrokeLogs));
    violations.push(...checkDurationConsistency(input));
    violations.push(...checkKeystrokeCountConsistency(input));
  }

  return {
    passed: violations.length === 0,
    violations,
  };
}

export function checkUnrealisticWpm(input: AntiCheatInput): AntiCheatViolation[] {
  const violations: AntiCheatViolation[] = [];

  if (input.wpm > MAX_LEGITIMATE_WPM) {
    violations.push({
      flag: 'UNREALISTIC_WPM',
      message: `WPM of ${input.wpm} exceeds maximum legitimate threshold of ${MAX_LEGITIMATE_WPM}`,
    });
  }

  if (input.rawWpm > MAX_LEGITIMATE_WPM) {
    violations.push({
      flag: 'UNREALISTIC_WPM',
      message: `Raw WPM of ${input.rawWpm} exceeds maximum legitimate threshold of ${MAX_LEGITIMATE_WPM}`,
    });
  }

  return violations;
}

export function checkWpmConsistency(input: AntiCheatInput): AntiCheatViolation[] {
  if (input.durationMs <= 0 || input.keystrokes === 0) return [];

  const correctChars = input.keystrokes - input.errors;
  const expectedWpm = calculateWpm(Math.max(0, correctChars), input.durationMs);

  if (expectedWpm === 0 && input.wpm === 0) return [];

  const denominator = Math.max(expectedWpm, input.wpm, 1);
  const diff = Math.abs(expectedWpm - input.wpm) / denominator;

  if (diff > WPM_TOLERANCE) {
    return [{
      flag: 'WPM_MISMATCH',
      message: `Reported WPM (${input.wpm}) does not match calculated WPM (${expectedWpm}) from keystrokes and duration`,
    }];
  }

  return [];
}

export function checkAccuracyConsistency(input: AntiCheatInput): AntiCheatViolation[] {
  if (input.keystrokes === 0) return [];

  const correctChars = input.keystrokes - input.errors;
  const expectedAccuracy = calculateAccuracy(Math.max(0, correctChars), input.keystrokes);
  const diff = Math.abs(expectedAccuracy - input.accuracy);

  if (diff > ACCURACY_TOLERANCE) {
    return [{
      flag: 'ACCURACY_MISMATCH',
      message: `Reported accuracy (${input.accuracy}%) does not match calculated accuracy (${expectedAccuracy}%) from keystrokes and errors`,
    }];
  }

  return [];
}

export function checkKeystrokeTiming(logs: KeystrokeLogInput[]): AntiCheatViolation[] {
  // Skip the first keystroke (latency 0 is normal for first key)
  const latencies = logs.slice(1).map((l) => l.latencyMs);
  if (latencies.length === 0) return [];

  const impossiblyFastCount = latencies.filter((l) => l > 0 && l < MIN_KEYSTROKE_LATENCY_MS).length;
  const ratio = impossiblyFastCount / latencies.length;

  // Allow up to 5% of keystrokes to be very fast (can happen with key rollover)
  if (ratio > 0.05) {
    return [{
      flag: 'IMPOSSIBLY_FAST_KEYSTROKES',
      message: `${Math.round(ratio * 100)}% of keystrokes have latency below ${MIN_KEYSTROKE_LATENCY_MS}ms, suggesting automated input`,
    }];
  }

  return [];
}

export function checkRoboticTiming(logs: KeystrokeLogInput[]): AntiCheatViolation[] {
  // Need at least 10 keystrokes to detect patterns
  const latencies = logs.slice(1).map((l) => l.latencyMs).filter((l) => l > 0);
  if (latencies.length < 10) return [];

  const avg = latencies.reduce((sum, l) => sum + l, 0) / latencies.length;
  const squaredDiffs = latencies.map((l) => Math.pow(l - avg, 2));
  const variance = squaredDiffs.reduce((sum, d) => sum + d, 0) / latencies.length;
  const stdDev = Math.sqrt(variance);

  // Real human typing has significant natural variance.
  // Bots/macros tend to have very uniform timing.
  if (stdDev < MIN_LATENCY_STDDEV_MS && avg > 0) {
    return [{
      flag: 'ROBOTIC_TIMING',
      message: `Keystroke latency standard deviation (${Math.round(stdDev)}ms) is below ${MIN_LATENCY_STDDEV_MS}ms, suggesting automated input`,
    }];
  }

  return [];
}

export function checkDurationConsistency(input: AntiCheatInput): AntiCheatViolation[] {
  if (!input.keystrokeLogs || input.keystrokeLogs.length === 0) return [];

  const lastLog = input.keystrokeLogs[input.keystrokeLogs.length - 1];
  const logDuration = lastLog.timestamp + lastLog.latencyMs;

  if (logDuration === 0 && input.durationMs === 0) return [];

  const denominator = Math.max(logDuration, input.durationMs, 1);
  const diff = Math.abs(logDuration - input.durationMs) / denominator;

  if (diff > DURATION_TOLERANCE) {
    return [{
      flag: 'DURATION_MISMATCH',
      message: `Reported duration (${input.durationMs}ms) does not match keystroke log duration (~${logDuration}ms)`,
    }];
  }

  return [];
}

export function checkKeystrokeCountConsistency(input: AntiCheatInput): AntiCheatViolation[] {
  if (!input.keystrokeLogs) return [];

  if (input.keystrokeLogs.length !== input.keystrokes) {
    return [{
      flag: 'KEYSTROKE_COUNT_MISMATCH',
      message: `Reported keystroke count (${input.keystrokes}) does not match keystroke log count (${input.keystrokeLogs.length})`,
    }];
  }

  return [];
}
