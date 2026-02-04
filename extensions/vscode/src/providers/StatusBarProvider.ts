import * as vscode from "vscode";
import { SessionStats, calculateWpm, calculateAccuracy } from "../typing-utils";

export type { SessionStats };

export type WpmTrend = "up" | "down" | "stable";

/**
 * Tracks keystrokes over a sliding window to compute real-time editor WPM.
 * Also tracks peak WPM and WPM trend direction.
 */
export class EditorWpmTracker implements vscode.Disposable {
  private keystrokes: number[] = [];
  private disposable: vscode.Disposable | undefined;
  private decayTimer: ReturnType<typeof setInterval> | undefined;
  private _peakWpm = 0;
  private previousWpm = 0;

  /** Sliding window size in milliseconds. */
  private readonly windowMs: number;

  constructor(windowMs = 10000) {
    this.windowMs = windowMs;
  }

  /**
   * Start listening to editor text changes.
   */
  start(): void {
    this.disposable = vscode.workspace.onDidChangeTextDocument((e) => {
      this.onDocumentChange(e);
    });
    this.decayTimer = setInterval(() => this.pruneOldKeystrokes(), 1000);
  }

  /**
   * Process a text document change event.
   * Counts inserted characters (ignores deletions and programmatic bulk changes).
   */
  onDocumentChange(e: vscode.TextDocumentChangeEvent): void {
    for (const change of e.contentChanges) {
      // Only count typed characters (small inserts, not paste/format)
      const len = change.text.length;
      if (len > 0 && len <= 5) {
        const now = Date.now();
        for (let i = 0; i < len; i++) {
          this.keystrokes.push(now);
        }
      }
    }
  }

  /**
   * Calculate current WPM based on keystrokes within the sliding window.
   * Updates peak WPM and trend tracking.
   */
  getWpm(): number {
    this.pruneOldKeystrokes();
    const count = this.keystrokes.length;
    if (count === 0) return 0;
    const wpm = calculateWpm(count, this.windowMs);
    if (wpm > this._peakWpm) {
      this._peakWpm = wpm;
    }
    return wpm;
  }

  /**
   * Return the number of keystrokes in the current window.
   */
  getKeystrokeCount(): number {
    this.pruneOldKeystrokes();
    return this.keystrokes.length;
  }

  get peakWpm(): number {
    return this._peakWpm;
  }

  /**
   * Get the WPM trend direction based on current vs previous reading.
   */
  getTrend(): WpmTrend {
    const current = this.getWpm();
    const threshold = 3;
    let trend: WpmTrend;
    if (current > this.previousWpm + threshold) {
      trend = "up";
    } else if (current < this.previousWpm - threshold) {
      trend = "down";
    } else {
      trend = "stable";
    }
    this.previousWpm = current;
    return trend;
  }

  /**
   * Remove keystrokes older than the sliding window.
   */
  private pruneOldKeystrokes(): void {
    const cutoff = Date.now() - this.windowMs;
    while (this.keystrokes.length > 0 && this.keystrokes[0] < cutoff) {
      this.keystrokes.shift();
    }
  }

  /**
   * Reset all tracked keystrokes.
   */
  reset(): void {
    this.keystrokes = [];
    this._peakWpm = 0;
    this.previousWpm = 0;
  }

  dispose(): void {
    if (this.disposable) {
      this.disposable.dispose();
    }
    if (this.decayTimer !== undefined) {
      clearInterval(this.decayTimer);
    }
  }
}

/**
 * Get the trend arrow character for a WPM trend direction.
 */
export function getTrendArrow(trend: WpmTrend): string {
  switch (trend) {
    case "up":
      return "$(arrow-up)";
    case "down":
      return "$(arrow-down)";
    case "stable":
      return "";
  }
}

/**
 * Get the VS Code ThemeColor for a WPM value to provide visual feedback.
 * Uses warning (yellow) background for low WPM and error (red) background
 * when WPM drops to very low during an active session.
 * Returns undefined for normal/good WPM (no background highlight).
 */
export function getWpmBackgroundColor(
  wpm: number,
  isActive: boolean
): vscode.ThemeColor | undefined {
  if (!isActive || wpm === 0) return undefined;
  if (wpm < 20) return new vscode.ThemeColor("statusBarItem.errorBackground");
  if (wpm < 40) return new vscode.ThemeColor("statusBarItem.warningBackground");
  return undefined;
}

export class StatusBarProvider implements vscode.Disposable {
  private statusBarItem: vscode.StatusBarItem;
  private stats: SessionStats = {
    wpm: 0,
    accuracy: 100,
    totalKeystrokes: 0,
    errors: 0,
    startTime: null,
  };

  private editorTracker: EditorWpmTracker;
  private refreshTimer: ReturnType<typeof setInterval> | undefined;
  private inPracticeSession = false;
  private practicepeakWpm = 0;

  constructor(editorTracker?: EditorWpmTracker) {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.statusBarItem.command = "sokudo.showStats";
    this.editorTracker = editorTracker ?? new EditorWpmTracker();
    this.editorTracker.start();
    this.startRefreshTimer();
    this.updateDisplay();
  }

  show(): void {
    this.statusBarItem.show();
  }

  hide(): void {
    this.statusBarItem.hide();
  }

  toggle(): void {
    if (this.statusBarItem.text) {
      this.hide();
      vscode.window.showInformationMessage("Sokudo: Status bar hidden.");
    } else {
      this.show();
      vscode.window.showInformationMessage("Sokudo: Status bar visible.");
    }
  }

  updateStats(stats: Partial<SessionStats>): void {
    this.stats = { ...this.stats, ...stats };
    this.inPracticeSession = true;
    if (this.stats.wpm > this.practicepeakWpm) {
      this.practicepeakWpm = this.stats.wpm;
    }
    this.updateDisplay();
  }

  resetStats(): void {
    this.stats = {
      wpm: 0,
      accuracy: 100,
      totalKeystrokes: 0,
      errors: 0,
      startTime: null,
    };
    this.inPracticeSession = false;
    this.practicepeakWpm = 0;
    this.updateDisplay();
  }

  getSessionStats(): SessionStats {
    return { ...this.stats };
  }

  getEditorWpm(): number {
    return this.editorTracker.getWpm();
  }

  getPeakWpm(): number {
    if (this.inPracticeSession) {
      return this.practicepeakWpm;
    }
    return this.editorTracker.peakWpm;
  }

  static calculateWpm(correctChars: number, elapsedMs: number): number {
    return calculateWpm(correctChars, elapsedMs);
  }

  static calculateAccuracy(
    correctKeystrokes: number,
    totalKeystrokes: number
  ): number {
    return calculateAccuracy(correctKeystrokes, totalKeystrokes);
  }

  private startRefreshTimer(): void {
    this.refreshTimer = setInterval(() => {
      if (!this.inPracticeSession) {
        this.updateDisplay();
      }
    }, 2000);
  }

  updateDisplay(): void {
    if (this.inPracticeSession && this.stats.totalKeystrokes > 0) {
      // During practice sessions, show practice WPM with accuracy
      this.statusBarItem.text = `$(keyboard) ${this.stats.wpm} WPM | ${this.stats.accuracy}%`;
      this.statusBarItem.tooltip = `Sokudo Practice — WPM: ${this.stats.wpm} | Peak: ${this.practicepeakWpm} | Accuracy: ${this.stats.accuracy}% | Keystrokes: ${this.stats.totalKeystrokes}`;
      this.statusBarItem.backgroundColor = getWpmBackgroundColor(
        this.stats.wpm,
        true
      );
    } else {
      // Show live editor WPM with trend
      const editorWpm = this.editorTracker.getWpm();
      if (editorWpm > 0) {
        const trend = this.editorTracker.getTrend();
        const arrow = getTrendArrow(trend);
        const arrowSuffix = arrow ? ` ${arrow}` : "";
        this.statusBarItem.text = `$(keyboard) ${editorWpm} WPM${arrowSuffix}`;
        this.statusBarItem.tooltip = `Sokudo — Editor WPM: ${editorWpm} | Peak: ${this.editorTracker.peakWpm} (10s window). Click for stats.`;
        this.statusBarItem.backgroundColor = getWpmBackgroundColor(
          editorWpm,
          true
        );
      } else {
        this.statusBarItem.text = "$(keyboard) Sokudo";
        this.statusBarItem.tooltip =
          "Click to view stats. Start typing to see your WPM.";
        this.statusBarItem.backgroundColor = undefined;
      }
    }
  }

  dispose(): void {
    this.statusBarItem.dispose();
    this.editorTracker.dispose();
    if (this.refreshTimer !== undefined) {
      clearInterval(this.refreshTimer);
    }
  }
}
