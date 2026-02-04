import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as vscode from "vscode";
import {
  StatusBarProvider,
  EditorWpmTracker,
  getTrendArrow,
  getWpmBackgroundColor,
} from "../providers/StatusBarProvider";
import {
  calculateWpm,
  calculateAccuracy,
  formatDuration,
} from "../typing-utils";

describe("typing-utils", () => {
  describe("calculateWpm", () => {
    it("should calculate WPM correctly for standard input", () => {
      const wpm = calculateWpm(50, 60000);
      expect(wpm).toBe(10);
    });

    it("should return 0 for zero elapsed time", () => {
      const wpm = calculateWpm(50, 0);
      expect(wpm).toBe(0);
    });

    it("should return 0 for negative elapsed time", () => {
      const wpm = calculateWpm(50, -1000);
      expect(wpm).toBe(0);
    });

    it("should return 0 for zero characters", () => {
      const wpm = calculateWpm(0, 60000);
      expect(wpm).toBe(0);
    });

    it("should handle fast typing correctly", () => {
      const wpm = calculateWpm(100, 30000);
      expect(wpm).toBe(40);
    });

    it("should round to nearest integer", () => {
      const wpm = calculateWpm(33, 60000);
      expect(wpm).toBe(7);
    });

    it("should handle very short durations", () => {
      const wpm = calculateWpm(5, 1000);
      expect(wpm).toBe(60);
    });
  });

  describe("calculateAccuracy", () => {
    it("should return 100 for no keystrokes", () => {
      const accuracy = calculateAccuracy(0, 0);
      expect(accuracy).toBe(100);
    });

    it("should return 100 for perfect accuracy", () => {
      const accuracy = calculateAccuracy(50, 50);
      expect(accuracy).toBe(100);
    });

    it("should calculate accuracy correctly with errors", () => {
      const accuracy = calculateAccuracy(45, 50);
      expect(accuracy).toBe(90);
    });

    it("should return 0 for all errors", () => {
      const accuracy = calculateAccuracy(0, 50);
      expect(accuracy).toBe(0);
    });

    it("should round to nearest integer", () => {
      const accuracy = calculateAccuracy(33, 100);
      expect(accuracy).toBe(33);
    });

    it("should handle single keystroke correct", () => {
      const accuracy = calculateAccuracy(1, 1);
      expect(accuracy).toBe(100);
    });

    it("should handle single keystroke error", () => {
      const accuracy = calculateAccuracy(0, 1);
      expect(accuracy).toBe(0);
    });
  });

  describe("formatDuration", () => {
    it("should format seconds only", () => {
      expect(formatDuration(5000)).toBe("5s");
    });

    it("should format minutes and seconds", () => {
      expect(formatDuration(90000)).toBe("1m 30s");
    });

    it("should format zero", () => {
      expect(formatDuration(0)).toBe("0s");
    });

    it("should format exact minutes", () => {
      expect(formatDuration(120000)).toBe("2m 0s");
    });

    it("should floor sub-second values", () => {
      expect(formatDuration(1500)).toBe("1s");
    });
  });
});

describe("getTrendArrow", () => {
  it("should return arrow-up icon for up trend", () => {
    expect(getTrendArrow("up")).toBe("$(arrow-up)");
  });

  it("should return arrow-down icon for down trend", () => {
    expect(getTrendArrow("down")).toBe("$(arrow-down)");
  });

  it("should return empty string for stable trend", () => {
    expect(getTrendArrow("stable")).toBe("");
  });
});

describe("getWpmBackgroundColor", () => {
  it("should return undefined when not active", () => {
    expect(getWpmBackgroundColor(10, false)).toBeUndefined();
  });

  it("should return undefined when WPM is 0", () => {
    expect(getWpmBackgroundColor(0, true)).toBeUndefined();
  });

  it("should return error background for WPM below 20", () => {
    const color = getWpmBackgroundColor(15, true);
    expect(color).toBeInstanceOf(vscode.ThemeColor);
    expect((color as vscode.ThemeColor).id).toBe(
      "statusBarItem.errorBackground"
    );
  });

  it("should return warning background for WPM between 20 and 39", () => {
    const color = getWpmBackgroundColor(30, true);
    expect(color).toBeInstanceOf(vscode.ThemeColor);
    expect((color as vscode.ThemeColor).id).toBe(
      "statusBarItem.warningBackground"
    );
  });

  it("should return undefined for WPM 40 and above", () => {
    expect(getWpmBackgroundColor(40, true)).toBeUndefined();
    expect(getWpmBackgroundColor(100, true)).toBeUndefined();
  });
});

describe("EditorWpmTracker", () => {
  let tracker: EditorWpmTracker;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    tracker = new EditorWpmTracker(10000);
  });

  afterEach(() => {
    tracker.dispose();
    vi.useRealTimers();
  });

  it("should register onDidChangeTextDocument listener on start", () => {
    tracker.start();
    expect(vscode.workspace.onDidChangeTextDocument).toHaveBeenCalled();
  });

  it("should return 0 WPM when no keystrokes", () => {
    expect(tracker.getWpm()).toBe(0);
  });

  it("should return 0 keystroke count initially", () => {
    expect(tracker.getKeystrokeCount()).toBe(0);
  });

  it("should track single character inserts", () => {
    tracker.start();
    const change = {
      contentChanges: [
        { text: "a", rangeLength: 0, rangeOffset: 0, range: {} },
      ],
      document: {},
      reason: undefined,
    } as unknown as vscode.TextDocumentChangeEvent;

    tracker.onDocumentChange(change);
    expect(tracker.getKeystrokeCount()).toBe(1);
  });

  it("should track multi-character inserts up to 5 chars", () => {
    tracker.start();
    const change = {
      contentChanges: [
        { text: "hello", rangeLength: 0, rangeOffset: 0, range: {} },
      ],
      document: {},
      reason: undefined,
    } as unknown as vscode.TextDocumentChangeEvent;

    tracker.onDocumentChange(change);
    expect(tracker.getKeystrokeCount()).toBe(5);
  });

  it("should ignore large pastes (more than 5 chars)", () => {
    tracker.start();
    const change = {
      contentChanges: [
        {
          text: "a long pasted string",
          rangeLength: 0,
          rangeOffset: 0,
          range: {},
        },
      ],
      document: {},
      reason: undefined,
    } as unknown as vscode.TextDocumentChangeEvent;

    tracker.onDocumentChange(change);
    expect(tracker.getKeystrokeCount()).toBe(0);
  });

  it("should ignore deletions (empty text)", () => {
    tracker.start();
    const change = {
      contentChanges: [
        { text: "", rangeLength: 1, rangeOffset: 0, range: {} },
      ],
      document: {},
      reason: undefined,
    } as unknown as vscode.TextDocumentChangeEvent;

    tracker.onDocumentChange(change);
    expect(tracker.getKeystrokeCount()).toBe(0);
  });

  it("should calculate WPM based on keystrokes in window", () => {
    tracker.start();
    // Simulate 50 keystrokes within the 10s window
    for (let i = 0; i < 50; i++) {
      const change = {
        contentChanges: [
          { text: "a", rangeLength: 0, rangeOffset: 0, range: {} },
        ],
        document: {},
        reason: undefined,
      } as unknown as vscode.TextDocumentChangeEvent;
      tracker.onDocumentChange(change);
    }

    // 50 chars in 10s window: calculateWpm(50, 10000) = (50/5) / (10000/60000) = 10 / 0.1667 = 60
    expect(tracker.getWpm()).toBe(60);
  });

  it("should prune old keystrokes outside the window", () => {
    tracker.start();
    // Add keystrokes at t=0
    for (let i = 0; i < 10; i++) {
      const change = {
        contentChanges: [
          { text: "a", rangeLength: 0, rangeOffset: 0, range: {} },
        ],
        document: {},
        reason: undefined,
      } as unknown as vscode.TextDocumentChangeEvent;
      tracker.onDocumentChange(change);
    }

    expect(tracker.getKeystrokeCount()).toBe(10);

    // Advance time past the window
    vi.advanceTimersByTime(11000);

    expect(tracker.getKeystrokeCount()).toBe(0);
    expect(tracker.getWpm()).toBe(0);
  });

  it("should reset all tracked keystrokes", () => {
    tracker.start();
    const change = {
      contentChanges: [
        { text: "abc", rangeLength: 0, rangeOffset: 0, range: {} },
      ],
      document: {},
      reason: undefined,
    } as unknown as vscode.TextDocumentChangeEvent;
    tracker.onDocumentChange(change);

    expect(tracker.getKeystrokeCount()).toBe(3);

    tracker.reset();
    expect(tracker.getKeystrokeCount()).toBe(0);
  });

  it("should handle multiple content changes in a single event", () => {
    tracker.start();
    const change = {
      contentChanges: [
        { text: "a", rangeLength: 0, rangeOffset: 0, range: {} },
        { text: "b", rangeLength: 0, rangeOffset: 0, range: {} },
      ],
      document: {},
      reason: undefined,
    } as unknown as vscode.TextDocumentChangeEvent;

    tracker.onDocumentChange(change);
    expect(tracker.getKeystrokeCount()).toBe(2);
  });

  describe("peak WPM tracking", () => {
    it("should start with 0 peak WPM", () => {
      expect(tracker.peakWpm).toBe(0);
    });

    it("should update peak WPM when current WPM exceeds it", () => {
      tracker.start();
      for (let i = 0; i < 50; i++) {
        const change = {
          contentChanges: [
            { text: "a", rangeLength: 0, rangeOffset: 0, range: {} },
          ],
          document: {},
          reason: undefined,
        } as unknown as vscode.TextDocumentChangeEvent;
        tracker.onDocumentChange(change);
      }
      tracker.getWpm(); // triggers peak update
      expect(tracker.peakWpm).toBe(60);
    });

    it("should not decrease peak WPM when current WPM drops", () => {
      tracker.start();
      // Type 50 chars to get WPM of 60
      for (let i = 0; i < 50; i++) {
        const change = {
          contentChanges: [
            { text: "a", rangeLength: 0, rangeOffset: 0, range: {} },
          ],
          document: {},
          reason: undefined,
        } as unknown as vscode.TextDocumentChangeEvent;
        tracker.onDocumentChange(change);
      }
      tracker.getWpm();
      expect(tracker.peakWpm).toBe(60);

      // Advance time so keystrokes expire
      vi.advanceTimersByTime(11000);
      tracker.getWpm();
      // Peak should still be 60
      expect(tracker.peakWpm).toBe(60);
    });

    it("should reset peak WPM on reset()", () => {
      tracker.start();
      for (let i = 0; i < 50; i++) {
        const change = {
          contentChanges: [
            { text: "a", rangeLength: 0, rangeOffset: 0, range: {} },
          ],
          document: {},
          reason: undefined,
        } as unknown as vscode.TextDocumentChangeEvent;
        tracker.onDocumentChange(change);
      }
      tracker.getWpm();
      expect(tracker.peakWpm).toBe(60);

      tracker.reset();
      expect(tracker.peakWpm).toBe(0);
    });
  });

  describe("trend tracking", () => {
    it("should return stable when no previous reading", () => {
      expect(tracker.getTrend()).toBe("stable");
    });

    it("should return up when WPM increases significantly", () => {
      tracker.start();
      // First reading: 0 WPM
      tracker.getTrend();

      // Type to get WPM > threshold (3)
      for (let i = 0; i < 50; i++) {
        const change = {
          contentChanges: [
            { text: "a", rangeLength: 0, rangeOffset: 0, range: {} },
          ],
          document: {},
          reason: undefined,
        } as unknown as vscode.TextDocumentChangeEvent;
        tracker.onDocumentChange(change);
      }
      expect(tracker.getTrend()).toBe("up");
    });

    it("should return down when WPM decreases significantly", () => {
      tracker.start();
      // Type to build up WPM
      for (let i = 0; i < 50; i++) {
        const change = {
          contentChanges: [
            { text: "a", rangeLength: 0, rangeOffset: 0, range: {} },
          ],
          document: {},
          reason: undefined,
        } as unknown as vscode.TextDocumentChangeEvent;
        tracker.onDocumentChange(change);
      }
      // Record the high WPM as previousWpm
      tracker.getTrend();

      // Advance time so keystrokes expire
      vi.advanceTimersByTime(11000);
      expect(tracker.getTrend()).toBe("down");
    });

    it("should return stable when WPM stays within threshold", () => {
      tracker.start();
      // Build up WPM
      for (let i = 0; i < 50; i++) {
        const change = {
          contentChanges: [
            { text: "a", rangeLength: 0, rangeOffset: 0, range: {} },
          ],
          document: {},
          reason: undefined,
        } as unknown as vscode.TextDocumentChangeEvent;
        tracker.onDocumentChange(change);
      }
      // Set previousWpm
      tracker.getTrend();
      // Same keystrokes, same WPM - should be stable
      expect(tracker.getTrend()).toBe("stable");
    });

    it("should reset trend tracking on reset()", () => {
      tracker.start();
      for (let i = 0; i < 50; i++) {
        const change = {
          contentChanges: [
            { text: "a", rangeLength: 0, rangeOffset: 0, range: {} },
          ],
          document: {},
          reason: undefined,
        } as unknown as vscode.TextDocumentChangeEvent;
        tracker.onDocumentChange(change);
      }
      tracker.getTrend(); // sets previousWpm

      tracker.reset();
      // After reset, should be stable (0 vs 0)
      expect(tracker.getTrend()).toBe("stable");
    });
  });
});

describe("StatusBarProvider", () => {
  let provider: StatusBarProvider;
  let mockTracker: EditorWpmTracker;

  beforeEach(() => {
    vi.clearAllMocks();
    mockTracker = new EditorWpmTracker(10000);
    vi.spyOn(mockTracker, "start").mockImplementation(() => {});
    vi.spyOn(mockTracker, "getWpm").mockReturnValue(0);
    vi.spyOn(mockTracker, "getTrend").mockReturnValue("stable");
    vi.spyOn(mockTracker, "dispose").mockImplementation(() => {});
    provider = new StatusBarProvider(mockTracker);
  });

  afterEach(() => {
    provider.dispose();
  });

  it("should create a status bar item on the right side", () => {
    expect(vscode.window.createStatusBarItem).toHaveBeenCalledWith(
      vscode.StatusBarAlignment.Right,
      100
    );
  });

  it("should set command to sokudo.showStats", () => {
    const mockItem = vi.mocked(vscode.window.createStatusBarItem).mock
      .results[0].value;
    expect(mockItem.command).toBe("sokudo.showStats");
  });

  it("should display idle text when no activity", () => {
    const mockItem = vi.mocked(vscode.window.createStatusBarItem).mock
      .results[0].value;
    expect(mockItem.text).toBe("$(keyboard) Sokudo");
    expect(mockItem.tooltip).toContain("Start typing to see your WPM");
  });

  it("should display practice WPM with accuracy when practice stats are updated", () => {
    provider.updateStats({
      wpm: 45,
      accuracy: 92,
      totalKeystrokes: 100,
      errors: 8,
    });
    const mockItem = vi.mocked(vscode.window.createStatusBarItem).mock
      .results[0].value;
    expect(mockItem.text).toBe("$(keyboard) 45 WPM | 92%");
    expect(mockItem.tooltip).toContain("Practice");
    expect(mockItem.tooltip).toContain("Accuracy: 92%");
  });

  it("should display editor WPM when editor typing is detected", () => {
    vi.spyOn(mockTracker, "getWpm").mockReturnValue(35);
    provider.updateDisplay();
    const mockItem = vi.mocked(vscode.window.createStatusBarItem).mock
      .results[0].value;
    expect(mockItem.text).toContain("35 WPM");
    expect(mockItem.tooltip).toContain("Editor WPM: 35");
  });

  it("should prioritize practice WPM over editor WPM", () => {
    vi.spyOn(mockTracker, "getWpm").mockReturnValue(35);
    provider.updateStats({
      wpm: 60,
      accuracy: 95,
      totalKeystrokes: 50,
      errors: 2,
    });
    const mockItem = vi.mocked(vscode.window.createStatusBarItem).mock
      .results[0].value;
    expect(mockItem.text).toBe("$(keyboard) 60 WPM | 95%");
    expect(mockItem.tooltip).toContain("Practice");
  });

  it("should revert to editor WPM after resetting practice stats", () => {
    provider.updateStats({
      wpm: 60,
      accuracy: 95,
      totalKeystrokes: 50,
      errors: 2,
    });
    vi.spyOn(mockTracker, "getWpm").mockReturnValue(25);
    provider.resetStats();
    const mockItem = vi.mocked(vscode.window.createStatusBarItem).mock
      .results[0].value;
    expect(mockItem.text).toContain("25 WPM");
    expect(mockItem.tooltip).toContain("Editor WPM");
  });

  it("should show idle text when no practice and no editor typing", () => {
    vi.spyOn(mockTracker, "getWpm").mockReturnValue(0);
    provider.resetStats();
    const mockItem = vi.mocked(vscode.window.createStatusBarItem).mock
      .results[0].value;
    expect(mockItem.text).toBe("$(keyboard) Sokudo");
  });

  it("should return a copy of session stats", () => {
    provider.updateStats({ wpm: 50, accuracy: 90, totalKeystrokes: 200 });
    const stats = provider.getSessionStats();
    expect(stats.wpm).toBe(50);
    expect(stats.accuracy).toBe(90);
    expect(stats.totalKeystrokes).toBe(200);
  });

  it("should return editor WPM via getEditorWpm", () => {
    vi.spyOn(mockTracker, "getWpm").mockReturnValue(42);
    expect(provider.getEditorWpm()).toBe(42);
  });

  it("should show status bar on show()", () => {
    provider.show();
    const mockItem = vi.mocked(vscode.window.createStatusBarItem).mock
      .results[0].value;
    expect(mockItem.show).toHaveBeenCalled();
  });

  it("should hide status bar on hide()", () => {
    provider.hide();
    const mockItem = vi.mocked(vscode.window.createStatusBarItem).mock
      .results[0].value;
    expect(mockItem.hide).toHaveBeenCalled();
  });

  it("should delegate calculateWpm to typing-utils", () => {
    expect(StatusBarProvider.calculateWpm(50, 60000)).toBe(10);
  });

  it("should delegate calculateAccuracy to typing-utils", () => {
    expect(StatusBarProvider.calculateAccuracy(45, 50)).toBe(90);
  });

  it("should start the editor tracker on construction", () => {
    expect(mockTracker.start).toHaveBeenCalled();
  });

  it("should dispose editor tracker on dispose", () => {
    provider.dispose();
    expect(mockTracker.dispose).toHaveBeenCalled();
  });

  describe("peak WPM tracking", () => {
    it("should return 0 peak WPM initially", () => {
      expect(provider.getPeakWpm()).toBe(0);
    });

    it("should track peak WPM during practice sessions", () => {
      provider.updateStats({ wpm: 40, totalKeystrokes: 50 });
      provider.updateStats({ wpm: 60, totalKeystrokes: 100 });
      provider.updateStats({ wpm: 45, totalKeystrokes: 150 });
      expect(provider.getPeakWpm()).toBe(60);
    });

    it("should show peak WPM in practice tooltip", () => {
      provider.updateStats({
        wpm: 50,
        accuracy: 95,
        totalKeystrokes: 100,
        errors: 5,
      });
      const mockItem = vi.mocked(vscode.window.createStatusBarItem).mock
        .results[0].value;
      expect(mockItem.tooltip).toContain("Peak: 50");
    });

    it("should reset peak WPM when stats are reset", () => {
      provider.updateStats({ wpm: 60, totalKeystrokes: 100 });
      expect(provider.getPeakWpm()).toBe(60);
      provider.resetStats();
      expect(provider.getPeakWpm()).toBe(0);
    });

    it("should return editor peak WPM when not in practice", () => {
      const peakSpy = vi
        .spyOn(mockTracker, "peakWpm", "get")
        .mockReturnValue(75);
      expect(provider.getPeakWpm()).toBe(75);
      peakSpy.mockRestore();
    });
  });

  describe("WPM trend display", () => {
    it("should show up arrow when editor WPM is trending up", () => {
      vi.spyOn(mockTracker, "getWpm").mockReturnValue(45);
      vi.spyOn(mockTracker, "getTrend").mockReturnValue("up");
      provider.updateDisplay();
      const mockItem = vi.mocked(vscode.window.createStatusBarItem).mock
        .results[0].value;
      expect(mockItem.text).toBe("$(keyboard) 45 WPM $(arrow-up)");
    });

    it("should show down arrow when editor WPM is trending down", () => {
      vi.spyOn(mockTracker, "getWpm").mockReturnValue(30);
      vi.spyOn(mockTracker, "getTrend").mockReturnValue("down");
      provider.updateDisplay();
      const mockItem = vi.mocked(vscode.window.createStatusBarItem).mock
        .results[0].value;
      expect(mockItem.text).toBe("$(keyboard) 30 WPM $(arrow-down)");
    });

    it("should show no arrow when editor WPM is stable", () => {
      vi.spyOn(mockTracker, "getWpm").mockReturnValue(50);
      vi.spyOn(mockTracker, "getTrend").mockReturnValue("stable");
      provider.updateDisplay();
      const mockItem = vi.mocked(vscode.window.createStatusBarItem).mock
        .results[0].value;
      expect(mockItem.text).toBe("$(keyboard) 50 WPM");
    });
  });

  describe("background color", () => {
    it("should set error background for low practice WPM", () => {
      provider.updateStats({
        wpm: 15,
        accuracy: 80,
        totalKeystrokes: 50,
        errors: 10,
      });
      const mockItem = vi.mocked(vscode.window.createStatusBarItem).mock
        .results[0].value;
      expect(mockItem.backgroundColor).toBeInstanceOf(vscode.ThemeColor);
      expect((mockItem.backgroundColor as vscode.ThemeColor).id).toBe(
        "statusBarItem.errorBackground"
      );
    });

    it("should set warning background for medium practice WPM", () => {
      provider.updateStats({
        wpm: 30,
        accuracy: 90,
        totalKeystrokes: 80,
        errors: 8,
      });
      const mockItem = vi.mocked(vscode.window.createStatusBarItem).mock
        .results[0].value;
      expect(mockItem.backgroundColor).toBeInstanceOf(vscode.ThemeColor);
      expect((mockItem.backgroundColor as vscode.ThemeColor).id).toBe(
        "statusBarItem.warningBackground"
      );
    });

    it("should clear background for good practice WPM", () => {
      provider.updateStats({
        wpm: 60,
        accuracy: 95,
        totalKeystrokes: 100,
        errors: 5,
      });
      const mockItem = vi.mocked(vscode.window.createStatusBarItem).mock
        .results[0].value;
      expect(mockItem.backgroundColor).toBeUndefined();
    });

    it("should set background color for low editor WPM", () => {
      vi.spyOn(mockTracker, "getWpm").mockReturnValue(10);
      provider.updateDisplay();
      const mockItem = vi.mocked(vscode.window.createStatusBarItem).mock
        .results[0].value;
      expect(mockItem.backgroundColor).toBeInstanceOf(vscode.ThemeColor);
      expect((mockItem.backgroundColor as vscode.ThemeColor).id).toBe(
        "statusBarItem.errorBackground"
      );
    });

    it("should clear background color when idle", () => {
      vi.spyOn(mockTracker, "getWpm").mockReturnValue(0);
      provider.updateDisplay();
      const mockItem = vi.mocked(vscode.window.createStatusBarItem).mock
        .results[0].value;
      expect(mockItem.backgroundColor).toBeUndefined();
    });
  });

  describe("editor WPM peak in tooltip", () => {
    it("should show peak WPM in editor tooltip", () => {
      vi.spyOn(mockTracker, "getWpm").mockReturnValue(35);
      vi.spyOn(mockTracker, "peakWpm", "get").mockReturnValue(50);
      provider.updateDisplay();
      const mockItem = vi.mocked(vscode.window.createStatusBarItem).mock
        .results[0].value;
      expect(mockItem.tooltip).toContain("Peak: 50");
    });
  });
});
