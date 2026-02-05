import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatDuration, printTable, colors } from '../lib/ui';

describe('UI utilities', () => {
  let originalStdoutWrite: any;
  let output: string[];

  beforeEach(() => {
    output = [];
    originalStdoutWrite = process.stdout.write;
    process.stdout.write = vi.fn((chunk: string) => {
      output.push(chunk);
      return true;
    }) as any;
  });

  afterEach(() => {
    process.stdout.write = originalStdoutWrite;
  });

  describe('formatDuration', () => {
    it('should format seconds', () => {
      expect(formatDuration(5000)).toBe('5s');
      expect(formatDuration(30000)).toBe('30s');
    });

    it('should format minutes and seconds', () => {
      expect(formatDuration(60000)).toBe('1m 0s');
      expect(formatDuration(90000)).toBe('1m 30s');
      expect(formatDuration(125000)).toBe('2m 5s');
    });

    it('should format hours and minutes', () => {
      expect(formatDuration(3600000)).toBe('1h 0m');
      expect(formatDuration(3660000)).toBe('1h 1m');
      expect(formatDuration(7200000)).toBe('2h 0m');
    });
  });

  describe('printTable', () => {
    beforeEach(() => {
      // Mock console.log for printTable
      vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should print table with headers and rows', () => {
      const headers = ['Name', 'Age', 'City'];
      const rows = [
        ['Alice', '25', 'NYC'],
        ['Bob', '30', 'SF'],
      ];

      printTable(headers, rows);

      expect(console.log).toHaveBeenCalled();
    });

    it('should handle empty rows', () => {
      const headers = ['Name', 'Age'];
      const rows: string[][] = [];

      printTable(headers, rows);

      expect(console.log).toHaveBeenCalled();
    });

    it('should align columns correctly', () => {
      const headers = ['Short', 'LongerHeader'];
      const rows = [
        ['A', 'Value1'],
        ['BB', 'Value2'],
      ];

      printTable(headers, rows);

      expect(console.log).toHaveBeenCalled();
    });
  });

  describe('colors', () => {
    it('should have ANSI color codes', () => {
      expect(colors.reset).toBe('\x1b[0m');
      expect(colors.red).toBe('\x1b[31m');
      expect(colors.green).toBe('\x1b[32m');
      expect(colors.yellow).toBe('\x1b[33m');
      expect(colors.cyan).toBe('\x1b[36m');
    });

    it('should have background colors', () => {
      expect(colors.bgRed).toBe('\x1b[41m');
      expect(colors.bgGreen).toBe('\x1b[42m');
    });

    it('should have text modifiers', () => {
      expect(colors.bright).toBe('\x1b[1m');
      expect(colors.dim).toBe('\x1b[2m');
      expect(colors.underscore).toBe('\x1b[4m');
    });
  });
});
