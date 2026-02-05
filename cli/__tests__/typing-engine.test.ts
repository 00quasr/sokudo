import { describe, it, expect, vi } from 'vitest';
import { TypingEngine, formatTypingDisplay } from '../lib/typing-engine';

describe('TypingEngine', () => {
  it('should initialize with correct defaults', () => {
    const engine = new TypingEngine({ content: 'test' });

    expect(engine.getCursorPosition()).toBe(0);
    expect(engine.getTypedChars()).toEqual([]);
    expect(engine.getErrors().size).toBe(0);
    expect(engine.getIsComplete()).toBe(false);
  });

  it('should handle correct keystrokes', () => {
    const onKeystroke = vi.fn();
    const engine = new TypingEngine({
      content: 'test',
      onKeystroke,
    });

    engine.handleKey('t');
    expect(engine.getCursorPosition()).toBe(1);
    expect(engine.getTypedChars()).toEqual(['t']);
    expect(engine.getErrors().size).toBe(0);
    expect(onKeystroke).toHaveBeenCalledWith(
      expect.objectContaining({
        expected: 't',
        actual: 't',
        isCorrect: true,
      })
    );
  });

  it('should handle incorrect keystrokes', () => {
    const engine = new TypingEngine({ content: 'test' });

    engine.handleKey('x');
    expect(engine.getCursorPosition()).toBe(1);
    expect(engine.getTypedChars()).toEqual(['x']);
    expect(engine.getErrors().size).toBe(1);
    expect(engine.getErrors().get(0)).toBe('x');
  });

  it('should handle backspace', () => {
    const engine = new TypingEngine({ content: 'test' });

    engine.handleKey('t');
    engine.handleKey('e');
    expect(engine.getCursorPosition()).toBe(2);

    engine.handleKey('\x7f'); // Backspace
    expect(engine.getCursorPosition()).toBe(1);
    expect(engine.getTypedChars()).toEqual(['t']);
  });

  it('should handle backspace on errors', () => {
    const engine = new TypingEngine({ content: 'test' });

    engine.handleKey('x'); // Error
    expect(engine.getErrors().size).toBe(1);

    engine.handleKey('\x7f'); // Backspace
    expect(engine.getCursorPosition()).toBe(0);
    expect(engine.getErrors().size).toBe(0);
  });

  it('should not backspace at position 0', () => {
    const engine = new TypingEngine({ content: 'test' });

    engine.handleKey('\x7f');
    expect(engine.getCursorPosition()).toBe(0);
    expect(engine.getTypedChars()).toEqual([]);
  });

  it('should complete when all characters are typed', () => {
    const onComplete = vi.fn();
    const engine = new TypingEngine({
      content: 'test',
      onComplete,
    });

    engine.handleKey('t');
    engine.handleKey('e');
    engine.handleKey('s');
    expect(engine.getIsComplete()).toBe(false);

    engine.handleKey('t');
    expect(engine.getIsComplete()).toBe(true);
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        keystrokes: 4,
        errors: 0,
        accuracy: 100,
      }),
      expect.any(Array)
    );
  });

  it('should calculate WPM correctly', () => {
    const onComplete = vi.fn();
    const engine = new TypingEngine({
      content: 'hello',
      onComplete,
    });

    // Type all characters
    'hello'.split('').forEach(char => engine.handleKey(char));

    const stats = onComplete.mock.calls[0][0];
    expect(stats.wpm).toBeGreaterThan(0);
    expect(stats.keystrokes).toBe(5);
  });

  it('should calculate accuracy correctly', () => {
    const onComplete = vi.fn();
    const engine = new TypingEngine({
      content: 'test',
      onComplete,
    });

    engine.handleKey('t');
    engine.handleKey('x'); // Error
    engine.handleKey('\x7f'); // Backspace
    engine.handleKey('e');
    engine.handleKey('s');
    engine.handleKey('t');

    const stats = onComplete.mock.calls[0][0];
    expect(stats.keystrokes).toBe(5); // Including the error keystroke
    expect(stats.errors).toBe(0); // Error was corrected
  });

  it('should track keystroke latency', () => {
    const onKeystroke = vi.fn();
    const engine = new TypingEngine({
      content: 'test',
      onKeystroke,
    });

    engine.handleKey('t');
    engine.handleKey('e');

    const firstCall = onKeystroke.mock.calls[0][0];
    const secondCall = onKeystroke.mock.calls[1][0];

    expect(firstCall.latencyMs).toBeGreaterThanOrEqual(0);
    expect(secondCall.latencyMs).toBeGreaterThanOrEqual(0);
    expect(typeof secondCall.latencyMs).toBe('number');
  });
});

describe('formatTypingDisplay', () => {
  it('should format untyped text as dimmed', () => {
    const display = formatTypingDisplay('test', [], 0, new Map());
    expect(display).toContain('\x1b[4m'); // Cursor on first char
    expect(display).toContain('\x1b[2m'); // Dimmed remaining chars
  });

  it('should format correct typed text as green', () => {
    const display = formatTypingDisplay('test', ['t', 'e'], 2, new Map());
    expect(display).toContain('\x1b[32m'); // Green for correct chars
  });

  it('should format errors with red background', () => {
    const errors = new Map([[0, 'x']]);
    const display = formatTypingDisplay('test', ['x'], 1, errors);
    expect(display).toContain('\x1b[41m'); // Red background for error
  });

  it('should highlight cursor position', () => {
    const display = formatTypingDisplay('test', ['t'], 1, new Map());
    expect(display).toContain('\x1b[4m'); // Underline for cursor
  });
});
