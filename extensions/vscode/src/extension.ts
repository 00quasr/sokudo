import * as vscode from "vscode";
import { TypingPracticePanel } from "./panels/TypingPracticePanel";
import { StatusBarProvider } from "./providers/StatusBarProvider";

let statusBarProvider: StatusBarProvider | undefined;

export function activate(context: vscode.ExtensionContext): void {
  statusBarProvider = new StatusBarProvider();

  const startPracticeCmd = vscode.commands.registerCommand(
    "sokudo.startPractice",
    () => {
      TypingPracticePanel.createOrShow(context.extensionUri, statusBarProvider);
    }
  );

  const showStatsCmd = vscode.commands.registerCommand(
    "sokudo.showStats",
    () => {
      if (statusBarProvider) {
        const stats = statusBarProvider.getSessionStats();
        const editorWpm = statusBarProvider.getEditorWpm();
        const peakWpm = statusBarProvider.getPeakWpm();
        if (stats.totalKeystrokes === 0 && editorWpm === 0) {
          vscode.window.showInformationMessage(
            "Sokudo: No active session. Start typing or begin a practice session."
          );
          return;
        }
        if (stats.totalKeystrokes > 0) {
          vscode.window.showInformationMessage(
            `Sokudo Stats — Practice WPM: ${stats.wpm} | Peak: ${peakWpm} | Accuracy: ${stats.accuracy}% | Keystrokes: ${stats.totalKeystrokes}`
          );
        } else {
          vscode.window.showInformationMessage(
            `Sokudo Stats — Editor WPM: ${editorWpm} | Peak: ${peakWpm}`
          );
        }
      }
    }
  );

  const toggleStatusBarCmd = vscode.commands.registerCommand(
    "sokudo.toggleStatusBar",
    () => {
      if (statusBarProvider) {
        statusBarProvider.toggle();
      }
    }
  );

  const config = vscode.workspace.getConfiguration("sokudo");
  if (config.get<boolean>("showStatusBar", true) && statusBarProvider) {
    statusBarProvider.show();
  }

  context.subscriptions.push(
    startPracticeCmd,
    showStatsCmd,
    toggleStatusBarCmd,
    statusBarProvider
  );
}

export function deactivate(): void {
  statusBarProvider = undefined;
}
