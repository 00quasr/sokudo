import { performance } from 'perf_hooks';

interface KeystrokeEvent {
  timestamp: number;
  expected: string;
  actual: string;
  isCorrect: boolean;
  latencyMs: number;
}

interface TypingStats {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  keystrokes: number;
  errors: number;
  durationMs: number;
}

interface TypingEngineOptions {
  content: string;
  onKeystroke?: (event: KeystrokeEvent) => void;
  onComplete?: (stats: TypingStats, keystrokeLogs: KeystrokeEvent[]) => void;
}

export class TypingEngine {
  private content: string;
  private cursorPosition: number = 0;
  private typedChars: string[] = [];
  private errors: Map<number, string> = new Map();
  private keystrokeLogs: KeystrokeEvent[] = [];
  private startTime: number = 0;
  private lastKeystrokeTime: number = 0;
  private isStarted: boolean = false;
  private isComplete: boolean = false;
  private onKeystroke?: (event: KeystrokeEvent) => void;
  private onComplete?: (stats: TypingStats, keystrokeLogs: KeystrokeEvent[]) => void;

  constructor(options: TypingEngineOptions) {
    this.content = options.content;
    this.onKeystroke = options.onKeystroke;
    this.onComplete = options.onComplete;
  }

  private start(): void {
    if (!this.isStarted) {
      this.startTime = performance.now();
      this.lastKeystrokeTime = this.startTime;
      this.isStarted = true;
    }
  }

  private calculateStats(): TypingStats {
    const now = performance.now();
    const durationMs = now - this.startTime;
    const durationMin = durationMs / 60000;

    const totalKeystrokes = this.keystrokeLogs.length;
    const correctKeystrokes = this.keystrokeLogs.filter(k => k.isCorrect).length;
    const errorCount = this.errors.size;

    const correctChars = this.typedChars.filter(
      (char, idx) => char === this.content[idx]
    ).length;

    const wpm = durationMin > 0 ? (correctChars / 5) / durationMin : 0;
    const rawWpm = durationMin > 0 ? (totalKeystrokes / 5) / durationMin : 0;
    const accuracy = totalKeystrokes > 0 ? (correctKeystrokes / totalKeystrokes) * 100 : 100;

    return {
      wpm: Math.round(wpm),
      rawWpm: Math.round(rawWpm),
      accuracy: Math.round(accuracy * 100) / 100,
      keystrokes: totalKeystrokes,
      errors: errorCount,
      durationMs: Math.round(durationMs),
    };
  }

  handleKey(char: string): void {
    // Start timer on first keystroke
    if (!this.isStarted) {
      this.start();
    }

    const now = performance.now();
    const expected = this.content[this.cursorPosition];

    // Handle backspace
    if (char === '\x7f' || char === '\b') {
      if (this.cursorPosition > 0) {
        this.cursorPosition--;
        this.typedChars.pop();
        this.errors.delete(this.cursorPosition);
      }
      return;
    }

    // Handle escape (restart)
    if (char === '\x1b') {
      this.reset();
      return;
    }

    // Record keystroke
    const isCorrect = char === expected;
    const latency = now - this.lastKeystrokeTime;

    const event: KeystrokeEvent = {
      timestamp: Math.round(now - this.startTime),
      expected,
      actual: char,
      isCorrect,
      latencyMs: Math.round(latency),
    };

    this.keystrokeLogs.push(event);
    this.typedChars.push(char);

    if (!isCorrect) {
      this.errors.set(this.cursorPosition, char);
    }

    this.lastKeystrokeTime = now;
    this.cursorPosition++;

    // Trigger callback
    if (this.onKeystroke) {
      this.onKeystroke(event);
    }

    // Check completion
    if (this.cursorPosition >= this.content.length) {
      this.complete();
    }
  }

  private complete(): void {
    if (this.isComplete) return;

    this.isComplete = true;
    const stats = this.calculateStats();

    if (this.onComplete) {
      this.onComplete(stats, this.keystrokeLogs);
    }
  }

  private reset(): void {
    this.cursorPosition = 0;
    this.typedChars = [];
    this.errors.clear();
    this.keystrokeLogs = [];
    this.startTime = 0;
    this.lastKeystrokeTime = 0;
    this.isStarted = false;
    this.isComplete = false;
  }

  getCursorPosition(): number {
    return this.cursorPosition;
  }

  getTypedChars(): string[] {
    return this.typedChars;
  }

  getErrors(): Map<number, string> {
    return this.errors;
  }

  getIsComplete(): boolean {
    return this.isComplete;
  }

  getCurrentStats(): TypingStats {
    return this.calculateStats();
  }
}

export function formatTypingDisplay(
  content: string,
  typedChars: string[],
  cursorPosition: number,
  errors: Map<number, string>
): string {
  const chars = content.split('');
  let display = '';

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    const typed = typedChars[i];

    if (i < cursorPosition) {
      // Already typed
      if (errors.has(i)) {
        // Error - red background
        display += `\x1b[41m\x1b[37m${typed}\x1b[0m`;
      } else {
        // Correct - green
        display += `\x1b[32m${char}\x1b[0m`;
      }
    } else if (i === cursorPosition) {
      // Current cursor - highlighted with underline
      display += `\x1b[4m\x1b[1m${char}\x1b[0m`;
    } else {
      // Not yet typed - dimmed
      display += `\x1b[2m${char}\x1b[0m`;
    }
  }

  return display;
}
