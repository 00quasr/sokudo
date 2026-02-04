import { describe, it, expect, vi, beforeEach } from "vitest";
import * as vscode from "vscode";
import { TypingPracticePanel } from "../panels/TypingPracticePanel";

describe("TypingPracticePanel", () => {
  let mockWebview: {
    html: string;
    onDidReceiveMessage: ReturnType<typeof vi.fn>;
    postMessage: ReturnType<typeof vi.fn>;
  };
  let mockPanel: {
    webview: typeof mockWebview;
    reveal: ReturnType<typeof vi.fn>;
    onDidDispose: ReturnType<typeof vi.fn>;
    dispose: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TypingPracticePanel.currentPanel = undefined;

    mockWebview = {
      html: "",
      onDidReceiveMessage: vi.fn(),
      postMessage: vi.fn(),
    };

    mockPanel = {
      webview: mockWebview,
      reveal: vi.fn(),
      onDidDispose: vi.fn(),
      dispose: vi.fn(),
    };

    vi.mocked(vscode.window.createWebviewPanel).mockReturnValue(
      mockPanel as unknown as vscode.WebviewPanel
    );
  });

  describe("createOrShow", () => {
    it("should create a new panel when none exists", () => {
      const extensionUri = {} as vscode.Uri;
      TypingPracticePanel.createOrShow(extensionUri);

      expect(vscode.window.createWebviewPanel).toHaveBeenCalledWith(
        "sokudoPractice",
        "Sokudo - Typing Practice",
        vscode.ViewColumn.One,
        expect.objectContaining({
          enableScripts: true,
          retainContextWhenHidden: true,
        })
      );
    });

    it("should set webview HTML content", () => {
      const extensionUri = {} as vscode.Uri;
      TypingPracticePanel.createOrShow(extensionUri);

      expect(mockWebview.html).toContain("<!DOCTYPE html>");
      expect(mockWebview.html).toContain("Sokudo");
    });

    it("should reveal existing panel instead of creating new one", () => {
      const extensionUri = {} as vscode.Uri;
      TypingPracticePanel.createOrShow(extensionUri);
      TypingPracticePanel.createOrShow(extensionUri);

      expect(vscode.window.createWebviewPanel).toHaveBeenCalledTimes(1);
      expect(mockPanel.reveal).toHaveBeenCalled();
    });

    it("should register message handler", () => {
      const extensionUri = {} as vscode.Uri;
      TypingPracticePanel.createOrShow(extensionUri);

      expect(mockWebview.onDidReceiveMessage).toHaveBeenCalledWith(
        expect.any(Function),
        null,
        expect.any(Array)
      );
    });

    it("should register dispose handler", () => {
      const extensionUri = {} as vscode.Uri;
      TypingPracticePanel.createOrShow(extensionUri);

      expect(mockPanel.onDidDispose).toHaveBeenCalledWith(
        expect.any(Function),
        null,
        expect.any(Array)
      );
    });

    it("should include Content-Security-Policy in HTML", () => {
      const extensionUri = {} as vscode.Uri;
      TypingPracticePanel.createOrShow(extensionUri);

      expect(mockWebview.html).toContain("Content-Security-Policy");
    });

    it("should include typing area elements in HTML", () => {
      const extensionUri = {} as vscode.Uri;
      TypingPracticePanel.createOrShow(extensionUri);

      expect(mockWebview.html).toContain("typingArea");
      expect(mockWebview.html).toContain("hiddenInput");
      expect(mockWebview.html).toContain("wpmValue");
      expect(mockWebview.html).toContain("accuracyValue");
    });

    it("should include category selector in HTML", () => {
      const extensionUri = {} as vscode.Uri;
      TypingPracticePanel.createOrShow(extensionUri);

      expect(mockWebview.html).toContain("categorySelect");
      expect(mockWebview.html).toContain("git");
      expect(mockWebview.html).toContain("terminal");
      expect(mockWebview.html).toContain("react");
      expect(mockWebview.html).toContain("ai-prompts");
    });

    it("should include difficulty selector in HTML", () => {
      const extensionUri = {} as vscode.Uri;
      TypingPracticePanel.createOrShow(extensionUri);

      expect(mockWebview.html).toContain("difficultySelect");
      expect(mockWebview.html).toContain("easy");
      expect(mockWebview.html).toContain("medium");
      expect(mockWebview.html).toContain("hard");
    });

    it("should include session history section in HTML", () => {
      const extensionUri = {} as vscode.Uri;
      TypingPracticePanel.createOrShow(extensionUri);

      expect(mockWebview.html).toContain("historySection");
      expect(mockWebview.html).toContain("historyList");
      expect(mockWebview.html).toContain("Session History");
    });

    it("should include per-character error tracking in script", () => {
      const extensionUri = {} as vscode.Uri;
      TypingPracticePanel.createOrShow(extensionUri);

      expect(mockWebview.html).toContain("charResults");
    });

    it("should include progress bar in HTML", () => {
      const extensionUri = {} as vscode.Uri;
      TypingPracticePanel.createOrShow(extensionUri);

      expect(mockWebview.html).toContain("progressBar");
      expect(mockWebview.html).toContain("progress-bar-container");
    });

    it("should include results panel in HTML", () => {
      const extensionUri = {} as vscode.Uri;
      TypingPracticePanel.createOrShow(extensionUri);

      expect(mockWebview.html).toContain("resultsPanel");
      expect(mockWebview.html).toContain("resultWpm");
      expect(mockWebview.html).toContain("resultAccuracy");
      expect(mockWebview.html).toContain("resultNextBtn");
      expect(mockWebview.html).toContain("resultRetryBtn");
    });

    it("should include difficulty badge in HTML", () => {
      const extensionUri = {} as vscode.Uri;
      TypingPracticePanel.createOrShow(extensionUri);

      expect(mockWebview.html).toContain("difficultyBadge");
      expect(mockWebview.html).toContain("difficulty-easy");
      expect(mockWebview.html).toContain("difficulty-medium");
      expect(mockWebview.html).toContain("difficulty-hard");
    });

    it("should include keyboard shortcut hints in HTML", () => {
      const extensionUri = {} as vscode.Uri;
      TypingPracticePanel.createOrShow(extensionUri);

      expect(mockWebview.html).toContain("<kbd>");
      expect(mockWebview.html).toContain("Tab");
      expect(mockWebview.html).toContain("Esc");
    });

    it("should include Escape key handler in script", () => {
      const extensionUri = {} as vscode.Uri;
      TypingPracticePanel.createOrShow(extensionUri);

      expect(mockWebview.html).toContain("Escape");
    });
  });

  describe("message handling", () => {
    it("should handle requestChallenge message", () => {
      const extensionUri = {} as vscode.Uri;
      TypingPracticePanel.createOrShow(extensionUri);

      const messageHandler = mockWebview.onDidReceiveMessage.mock.calls[0][0];
      messageHandler({ type: "requestChallenge", category: "git" });

      expect(mockWebview.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "newChallenge",
          challenge: expect.objectContaining({
            category: "git",
            text: expect.any(String),
          }),
        })
      );
    });

    it("should handle getCategories message", () => {
      const extensionUri = {} as vscode.Uri;
      TypingPracticePanel.createOrShow(extensionUri);

      const messageHandler = mockWebview.onDidReceiveMessage.mock.calls[0][0];
      messageHandler({ type: "getCategories" });

      expect(mockWebview.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "categories",
          categories: expect.arrayContaining([
            "git",
            "terminal",
            "react",
            "ai-prompts",
          ]),
        })
      );
    });

    it("should handle sessionComplete message", () => {
      const extensionUri = {} as vscode.Uri;
      TypingPracticePanel.createOrShow(extensionUri);

      const messageHandler = mockWebview.onDidReceiveMessage.mock.calls[0][0];
      messageHandler({
        type: "sessionComplete",
        stats: { wpm: 60, accuracy: 95, totalKeystrokes: 100, errors: 5, startTime: Date.now() },
      });

      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
        expect.stringContaining("Session complete")
      );
    });

    it("should handle getDifficulties message", () => {
      const extensionUri = {} as vscode.Uri;
      TypingPracticePanel.createOrShow(extensionUri);

      const messageHandler = mockWebview.onDidReceiveMessage.mock.calls[0][0];
      messageHandler({ type: "getDifficulties" });

      expect(mockWebview.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "difficulties",
          difficulties: expect.arrayContaining(["easy", "medium", "hard"]),
        })
      );
    });

    it("should handle requestChallenge with difficulty filter", () => {
      const extensionUri = {} as vscode.Uri;
      TypingPracticePanel.createOrShow(extensionUri);

      const messageHandler = mockWebview.onDidReceiveMessage.mock.calls[0][0];
      messageHandler({ type: "requestChallenge", category: "git", difficulty: "easy" });

      expect(mockWebview.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "newChallenge",
          challenge: expect.objectContaining({
            category: "git",
            difficulty: "easy",
          }),
        })
      );
    });
  });

  describe("dispose", () => {
    it("should clear currentPanel on dispose", () => {
      const extensionUri = {} as vscode.Uri;
      TypingPracticePanel.createOrShow(extensionUri);

      expect(TypingPracticePanel.currentPanel).toBeDefined();

      const disposeHandler = mockPanel.onDidDispose.mock.calls[0][0];
      disposeHandler();

      expect(TypingPracticePanel.currentPanel).toBeUndefined();
    });
  });
});
