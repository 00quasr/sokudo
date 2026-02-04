import { describe, it, expect } from 'vitest';
import { extractSequences, SequenceData } from '../extract-sequences';

describe('extractSequences', () => {
  it('should return empty array for empty logs', () => {
    expect(extractSequences([])).toEqual([]);
  });

  it('should return empty array for single keystroke', () => {
    const logs = [
      { expected: 'a', actual: 'a', isCorrect: true, latencyMs: 100 },
    ];
    expect(extractSequences(logs)).toEqual([]);
  });

  it('should extract a single bigram from two keystrokes', () => {
    const logs = [
      { expected: 'h', actual: 'h', isCorrect: true, latencyMs: 100 },
      { expected: 'e', actual: 'e', isCorrect: true, latencyMs: 120 },
    ];
    const result = extractSequences(logs);
    expect(result).toHaveLength(1);
    expect(result[0].sequence).toBe('he');
    expect(result[0].hadError).toBe(false);
    expect(result[0].latencyMs).toBe(120);
  });

  it('should track errors on the second character of a bigram', () => {
    const logs = [
      { expected: 't', actual: 't', isCorrect: true, latencyMs: 100 },
      { expected: 'h', actual: 'j', isCorrect: false, latencyMs: 150 },
    ];
    const result = extractSequences(logs);
    expect(result).toHaveLength(1);
    expect(result[0].sequence).toBe('th');
    expect(result[0].hadError).toBe(true);
    expect(result[0].latencyMs).toBe(150);
  });

  it('should aggregate repeated bigrams', () => {
    const logs = [
      { expected: 't', actual: 't', isCorrect: true, latencyMs: 100 },
      { expected: 'h', actual: 'h', isCorrect: true, latencyMs: 120 },
      { expected: 'e', actual: 'e', isCorrect: true, latencyMs: 110 },
      { expected: ' ', actual: ' ', isCorrect: true, latencyMs: 90 },
      { expected: 't', actual: 't', isCorrect: true, latencyMs: 105 },
      { expected: 'h', actual: 'j', isCorrect: false, latencyMs: 180 },
    ];
    const result = extractSequences(logs);

    // Should have "th" (aggregated), "he", "e " (skipped - whitespace), " t", "th" already counted
    const thSequence = result.find((s) => s.sequence === 'th');
    expect(thSequence).toBeDefined();
    expect(thSequence!.hadError).toBe(true); // At least one error
    expect(thSequence!.latencyMs).toBe(150); // Average of 120 and 180
  });

  it('should skip multi-character expected values', () => {
    const logs = [
      { expected: 'Tab', actual: 'Tab', isCorrect: true, latencyMs: 100 },
      { expected: 'a', actual: 'a', isCorrect: true, latencyMs: 120 },
    ];
    const result = extractSequences(logs);
    expect(result).toHaveLength(0);
  });

  it('should skip whitespace-only sequences', () => {
    const logs = [
      { expected: ' ', actual: ' ', isCorrect: true, latencyMs: 100 },
      { expected: ' ', actual: ' ', isCorrect: true, latencyMs: 90 },
    ];
    const result = extractSequences(logs);
    expect(result).toHaveLength(0);
  });

  it('should lowercase sequences for consistent tracking', () => {
    const logs = [
      { expected: 'A', actual: 'A', isCorrect: true, latencyMs: 100 },
      { expected: 'B', actual: 'B', isCorrect: true, latencyMs: 120 },
    ];
    const result = extractSequences(logs);
    expect(result).toHaveLength(1);
    expect(result[0].sequence).toBe('ab');
  });

  it('should extract multiple distinct bigrams from a longer sequence', () => {
    const logs = [
      { expected: 'c', actual: 'c', isCorrect: true, latencyMs: 100 },
      { expected: 'o', actual: 'o', isCorrect: true, latencyMs: 110 },
      { expected: 'n', actual: 'n', isCorrect: true, latencyMs: 105 },
      { expected: 's', actual: 's', isCorrect: true, latencyMs: 120 },
      { expected: 't', actual: 't', isCorrect: true, latencyMs: 95 },
    ];
    const result = extractSequences(logs);

    const sequences = result.map((s) => s.sequence);
    expect(sequences).toContain('co');
    expect(sequences).toContain('on');
    expect(sequences).toContain('ns');
    expect(sequences).toContain('st');
    expect(result).toHaveLength(4);
  });

  it('should handle mixed correct and incorrect keystrokes', () => {
    const logs = [
      { expected: 'g', actual: 'g', isCorrect: true, latencyMs: 100 },
      { expected: 'i', actual: 'i', isCorrect: true, latencyMs: 110 },
      { expected: 't', actual: 'r', isCorrect: false, latencyMs: 200 },
      { expected: ' ', actual: ' ', isCorrect: true, latencyMs: 80 },
      { expected: 'a', actual: 'a', isCorrect: true, latencyMs: 90 },
    ];
    const result = extractSequences(logs);

    const itSeq = result.find((s) => s.sequence === 'it');
    expect(itSeq).toBeDefined();
    expect(itSeq!.hadError).toBe(true);
  });
});
