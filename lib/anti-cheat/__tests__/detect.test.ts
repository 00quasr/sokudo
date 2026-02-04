import { describe, it, expect } from 'vitest';
import {
  detectAntiCheat,
  checkUnrealisticWpm,
  checkWpmConsistency,
  checkAccuracyConsistency,
  checkKeystrokeTiming,
  checkRoboticTiming,
  checkDurationConsistency,
  checkKeystrokeCountConsistency,
  AntiCheatInput,
  KeystrokeLogInput,
} from '../detect';

function makeKeystrokeLogs(count: number, avgLatencyMs: number, variance: number = 30): KeystrokeLogInput[] {
  const logs: KeystrokeLogInput[] = [];
  let timestamp = 0;
  for (let i = 0; i < count; i++) {
    const latency = i === 0 ? 0 : Math.max(1, avgLatencyMs + Math.floor((Math.random() - 0.5) * 2 * variance));
    timestamp += latency;
    logs.push({
      timestamp,
      expected: 'a',
      actual: 'a',
      isCorrect: true,
      latencyMs: latency,
    });
  }
  return logs;
}

function makeUniformLogs(count: number, latencyMs: number): KeystrokeLogInput[] {
  const logs: KeystrokeLogInput[] = [];
  let timestamp = 0;
  for (let i = 0; i < count; i++) {
    const latency = i === 0 ? 0 : latencyMs;
    timestamp += latency;
    logs.push({
      timestamp,
      expected: 'a',
      actual: 'a',
      isCorrect: true,
      latencyMs: latency,
    });
  }
  return logs;
}

describe('detectAntiCheat', () => {
  it('should pass for a legitimate session', () => {
    // 100 keystrokes, 8 errors = 92 correct chars
    // WPM = (92/5) / (30000/60000) = 18.4/0.5 = 37 (rounded)
    // Accuracy = (92/100)*100 = 92%
    const input: AntiCheatInput = {
      wpm: 37,
      rawWpm: 40,
      accuracy: 92,
      keystrokes: 100,
      errors: 8,
      durationMs: 30000,
    };

    const result = detectAntiCheat(input);
    expect(result.passed).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('should pass for a legitimate session with keystroke logs', () => {
    const logs = makeKeystrokeLogs(50, 150, 40);
    const lastLog = logs[logs.length - 1];
    const durationMs = lastLog.timestamp + lastLog.latencyMs;

    // Calculate expected WPM: (50/5) / (durationMs/60000) = 10 / (durationMs/60000)
    const expectedWpm = Math.round((50 / 5) / (durationMs / 60000));

    const input: AntiCheatInput = {
      wpm: expectedWpm,
      rawWpm: expectedWpm,
      accuracy: 100,
      keystrokes: 50,
      errors: 0,
      durationMs,
      keystrokeLogs: logs,
    };

    const result = detectAntiCheat(input);
    expect(result.passed).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('should fail for multiple violations', () => {
    const input: AntiCheatInput = {
      wpm: 300,
      rawWpm: 300,
      accuracy: 50,
      keystrokes: 100,
      errors: 0,
      durationMs: 30000,
    };

    const result = detectAntiCheat(input);
    expect(result.passed).toBe(false);
    expect(result.violations.length).toBeGreaterThanOrEqual(2);
  });
});

describe('checkUnrealisticWpm', () => {
  it('should pass for WPM within range', () => {
    const result = checkUnrealisticWpm({
      wpm: 120,
      rawWpm: 125,
      accuracy: 96,
      keystrokes: 200,
      errors: 8,
      durationMs: 30000,
    });
    expect(result).toHaveLength(0);
  });

  it('should pass for WPM at exactly 250', () => {
    const result = checkUnrealisticWpm({
      wpm: 250,
      rawWpm: 250,
      accuracy: 100,
      keystrokes: 200,
      errors: 0,
      durationMs: 30000,
    });
    expect(result).toHaveLength(0);
  });

  it('should flag WPM above 250', () => {
    const result = checkUnrealisticWpm({
      wpm: 300,
      rawWpm: 200,
      accuracy: 100,
      keystrokes: 200,
      errors: 0,
      durationMs: 30000,
    });
    expect(result).toHaveLength(1);
    expect(result[0].flag).toBe('UNREALISTIC_WPM');
  });

  it('should flag raw WPM above 250', () => {
    const result = checkUnrealisticWpm({
      wpm: 200,
      rawWpm: 300,
      accuracy: 100,
      keystrokes: 200,
      errors: 0,
      durationMs: 30000,
    });
    expect(result).toHaveLength(1);
    expect(result[0].flag).toBe('UNREALISTIC_WPM');
  });

  it('should flag both WPM and raw WPM above 250', () => {
    const result = checkUnrealisticWpm({
      wpm: 300,
      rawWpm: 310,
      accuracy: 100,
      keystrokes: 200,
      errors: 0,
      durationMs: 30000,
    });
    expect(result).toHaveLength(2);
  });

  it('should pass for 0 WPM', () => {
    const result = checkUnrealisticWpm({
      wpm: 0,
      rawWpm: 0,
      accuracy: 0,
      keystrokes: 0,
      errors: 0,
      durationMs: 1000,
    });
    expect(result).toHaveLength(0);
  });
});

describe('checkWpmConsistency', () => {
  it('should pass when WPM matches keystrokes and duration', () => {
    // 100 keystrokes, 0 errors, in 60s = 100/5/1 = 20 WPM
    const result = checkWpmConsistency({
      wpm: 20,
      rawWpm: 20,
      accuracy: 100,
      keystrokes: 100,
      errors: 0,
      durationMs: 60000,
    });
    expect(result).toHaveLength(0);
  });

  it('should pass when WPM is within tolerance', () => {
    // Expected: (100-5)/5 / (60/60) = 19 WPM, reported: 22
    // Diff = |19-22| / 22 = 0.136 < 0.25
    const result = checkWpmConsistency({
      wpm: 22,
      rawWpm: 22,
      accuracy: 95,
      keystrokes: 100,
      errors: 5,
      durationMs: 60000,
    });
    expect(result).toHaveLength(0);
  });

  it('should flag when WPM significantly differs from expected', () => {
    // Expected: (100-0)/5 / (60/60) = 20 WPM, reported: 80
    const result = checkWpmConsistency({
      wpm: 80,
      rawWpm: 80,
      accuracy: 100,
      keystrokes: 100,
      errors: 0,
      durationMs: 60000,
    });
    expect(result).toHaveLength(1);
    expect(result[0].flag).toBe('WPM_MISMATCH');
  });

  it('should skip check when duration is 0', () => {
    const result = checkWpmConsistency({
      wpm: 80,
      rawWpm: 80,
      accuracy: 100,
      keystrokes: 100,
      errors: 0,
      durationMs: 0,
    });
    expect(result).toHaveLength(0);
  });

  it('should skip check when keystrokes is 0', () => {
    const result = checkWpmConsistency({
      wpm: 0,
      rawWpm: 0,
      accuracy: 100,
      keystrokes: 0,
      errors: 0,
      durationMs: 1000,
    });
    expect(result).toHaveLength(0);
  });

  it('should pass when both expected and reported WPM are 0', () => {
    const result = checkWpmConsistency({
      wpm: 0,
      rawWpm: 0,
      accuracy: 100,
      keystrokes: 0,
      errors: 0,
      durationMs: 0,
    });
    expect(result).toHaveLength(0);
  });
});

describe('checkAccuracyConsistency', () => {
  it('should pass when accuracy matches keystrokes and errors', () => {
    // (100-5)/100 = 95%
    const result = checkAccuracyConsistency({
      wpm: 60,
      rawWpm: 65,
      accuracy: 95,
      keystrokes: 100,
      errors: 5,
      durationMs: 30000,
    });
    expect(result).toHaveLength(0);
  });

  it('should pass when accuracy is within tolerance', () => {
    // Expected: (100-5)/100 = 95%, reported: 93 (diff = 2 < 5)
    const result = checkAccuracyConsistency({
      wpm: 60,
      rawWpm: 65,
      accuracy: 93,
      keystrokes: 100,
      errors: 5,
      durationMs: 30000,
    });
    expect(result).toHaveLength(0);
  });

  it('should flag when accuracy significantly differs from expected', () => {
    // Expected: (100-5)/100 = 95%, reported: 50
    const result = checkAccuracyConsistency({
      wpm: 60,
      rawWpm: 65,
      accuracy: 50,
      keystrokes: 100,
      errors: 5,
      durationMs: 30000,
    });
    expect(result).toHaveLength(1);
    expect(result[0].flag).toBe('ACCURACY_MISMATCH');
  });

  it('should skip check when keystrokes is 0', () => {
    const result = checkAccuracyConsistency({
      wpm: 0,
      rawWpm: 0,
      accuracy: 100,
      keystrokes: 0,
      errors: 0,
      durationMs: 1000,
    });
    expect(result).toHaveLength(0);
  });
});

describe('checkKeystrokeTiming', () => {
  it('should pass for normal keystroke latencies', () => {
    const logs = makeKeystrokeLogs(30, 120, 30);
    const result = checkKeystrokeTiming(logs);
    expect(result).toHaveLength(0);
  });

  it('should pass when a few keystrokes are fast (key rollover)', () => {
    // 100 keystrokes, only 3 below 15ms (3% < 5%)
    const logs = makeKeystrokeLogs(100, 120, 30);
    logs[5].latencyMs = 10;
    logs[20].latencyMs = 12;
    logs[50].latencyMs = 8;
    const result = checkKeystrokeTiming(logs);
    expect(result).toHaveLength(0);
  });

  it('should flag when many keystrokes are impossibly fast', () => {
    const logs: KeystrokeLogInput[] = [];
    let timestamp = 0;
    for (let i = 0; i < 50; i++) {
      const latency = i === 0 ? 0 : 5; // 5ms between each key = impossibly fast
      timestamp += latency;
      logs.push({
        timestamp,
        expected: 'a',
        actual: 'a',
        isCorrect: true,
        latencyMs: latency,
      });
    }

    const result = checkKeystrokeTiming(logs);
    expect(result).toHaveLength(1);
    expect(result[0].flag).toBe('IMPOSSIBLY_FAST_KEYSTROKES');
  });

  it('should pass for empty logs after first keystroke', () => {
    const logs: KeystrokeLogInput[] = [{
      timestamp: 0,
      expected: 'a',
      actual: 'a',
      isCorrect: true,
      latencyMs: 0,
    }];
    const result = checkKeystrokeTiming(logs);
    expect(result).toHaveLength(0);
  });
});

describe('checkRoboticTiming', () => {
  it('should pass for human-like typing with variance', () => {
    const logs = makeKeystrokeLogs(30, 120, 40);
    const result = checkRoboticTiming(logs);
    expect(result).toHaveLength(0);
  });

  it('should flag uniformly timed keystrokes (bot-like)', () => {
    const logs = makeUniformLogs(30, 100);
    const result = checkRoboticTiming(logs);
    expect(result).toHaveLength(1);
    expect(result[0].flag).toBe('ROBOTIC_TIMING');
  });

  it('should skip check when fewer than 10 keystrokes', () => {
    const logs = makeUniformLogs(5, 100);
    const result = checkRoboticTiming(logs);
    expect(result).toHaveLength(0);
  });

  it('should pass for slow typing with minimal variance but enough variance', () => {
    // Slow typing at ~300ms average with ~20ms stddev
    const logs = makeKeystrokeLogs(30, 300, 20);
    const result = checkRoboticTiming(logs);
    expect(result).toHaveLength(0);
  });
});

describe('checkDurationConsistency', () => {
  it('should pass when duration matches keystroke logs', () => {
    const logs = makeKeystrokeLogs(20, 100, 20);
    const lastLog = logs[logs.length - 1];
    const logDuration = lastLog.timestamp + lastLog.latencyMs;

    const result = checkDurationConsistency({
      wpm: 60,
      rawWpm: 60,
      accuracy: 100,
      keystrokes: 20,
      errors: 0,
      durationMs: logDuration,
      keystrokeLogs: logs,
    });
    expect(result).toHaveLength(0);
  });

  it('should pass when duration is within tolerance', () => {
    const logs = makeKeystrokeLogs(20, 100, 20);
    const lastLog = logs[logs.length - 1];
    const logDuration = lastLog.timestamp + lastLog.latencyMs;

    const result = checkDurationConsistency({
      wpm: 60,
      rawWpm: 60,
      accuracy: 100,
      keystrokes: 20,
      errors: 0,
      durationMs: Math.floor(logDuration * 1.15), // 15% over, within 20% tolerance
      keystrokeLogs: logs,
    });
    expect(result).toHaveLength(0);
  });

  it('should flag when duration significantly differs from keystroke logs', () => {
    const logs = makeKeystrokeLogs(20, 100, 20);

    const result = checkDurationConsistency({
      wpm: 60,
      rawWpm: 60,
      accuracy: 100,
      keystrokes: 20,
      errors: 0,
      durationMs: 100000, // Way more than log duration
      keystrokeLogs: logs,
    });
    expect(result).toHaveLength(1);
    expect(result[0].flag).toBe('DURATION_MISMATCH');
  });

  it('should skip check when no keystroke logs', () => {
    const result = checkDurationConsistency({
      wpm: 60,
      rawWpm: 60,
      accuracy: 100,
      keystrokes: 20,
      errors: 0,
      durationMs: 30000,
    });
    expect(result).toHaveLength(0);
  });

  it('should skip check when keystroke logs are empty', () => {
    const result = checkDurationConsistency({
      wpm: 60,
      rawWpm: 60,
      accuracy: 100,
      keystrokes: 0,
      errors: 0,
      durationMs: 30000,
      keystrokeLogs: [],
    });
    expect(result).toHaveLength(0);
  });
});

describe('checkKeystrokeCountConsistency', () => {
  it('should pass when keystroke count matches log length', () => {
    const logs = makeKeystrokeLogs(50, 100, 20);

    const result = checkKeystrokeCountConsistency({
      wpm: 60,
      rawWpm: 60,
      accuracy: 100,
      keystrokes: 50,
      errors: 0,
      durationMs: 30000,
      keystrokeLogs: logs,
    });
    expect(result).toHaveLength(0);
  });

  it('should flag when keystroke count does not match log length', () => {
    const logs = makeKeystrokeLogs(30, 100, 20);

    const result = checkKeystrokeCountConsistency({
      wpm: 60,
      rawWpm: 60,
      accuracy: 100,
      keystrokes: 50, // Says 50 but logs only have 30
      errors: 0,
      durationMs: 30000,
      keystrokeLogs: logs,
    });
    expect(result).toHaveLength(1);
    expect(result[0].flag).toBe('KEYSTROKE_COUNT_MISMATCH');
  });

  it('should skip check when no keystroke logs provided', () => {
    const result = checkKeystrokeCountConsistency({
      wpm: 60,
      rawWpm: 60,
      accuracy: 100,
      keystrokes: 50,
      errors: 0,
      durationMs: 30000,
    });
    expect(result).toHaveLength(0);
  });
});

describe('edge cases', () => {
  it('should handle a session with very short duration', () => {
    const result = detectAntiCheat({
      wpm: 12,
      rawWpm: 12,
      accuracy: 100,
      keystrokes: 5,
      errors: 0,
      durationMs: 5000,
    });
    expect(result.passed).toBe(true);
  });

  it('should handle a session with 0 WPM and 0 keystrokes', () => {
    const result = detectAntiCheat({
      wpm: 0,
      rawWpm: 0,
      accuracy: 100,
      keystrokes: 0,
      errors: 0,
      durationMs: 1000,
    });
    expect(result.passed).toBe(true);
  });

  it('should handle a session where all keystrokes are errors', () => {
    const result = detectAntiCheat({
      wpm: 0,
      rawWpm: 20,
      accuracy: 0,
      keystrokes: 100,
      errors: 100,
      durationMs: 60000,
    });
    expect(result.passed).toBe(true);
  });
});
