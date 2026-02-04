import { describe, it, expect, vi, beforeEach } from "vitest";
import * as vscode from "vscode";
import { activate, deactivate } from "../extension";

describe("extension", () => {
  let mockContext: vscode.ExtensionContext;

  beforeEach(() => {
    vi.clearAllMocks();
    const subscriptions: vscode.Disposable[] = [];
    mockContext = {
      subscriptions,
      extensionUri: {} as vscode.Uri,
    } as unknown as vscode.ExtensionContext;
  });

  describe("activate", () => {
    it("should register all three commands", () => {
      activate(mockContext);

      expect(vscode.commands.registerCommand).toHaveBeenCalledTimes(3);
      expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
        "sokudo.startPractice",
        expect.any(Function)
      );
      expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
        "sokudo.showStats",
        expect.any(Function)
      );
      expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
        "sokudo.toggleStatusBar",
        expect.any(Function)
      );
    });

    it("should add disposables to context subscriptions", () => {
      activate(mockContext);

      // 3 commands + 1 StatusBarProvider = 4 disposables
      expect(mockContext.subscriptions.length).toBe(4);
    });

    it("should read sokudo configuration", () => {
      activate(mockContext);

      expect(vscode.workspace.getConfiguration).toHaveBeenCalledWith("sokudo");
    });
  });

  describe("deactivate", () => {
    it("should run without error", () => {
      expect(() => deactivate()).not.toThrow();
    });
  });
});
