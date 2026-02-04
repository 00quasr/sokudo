import * as vscode from "vscode";
import { StatusBarProvider } from "../providers/StatusBarProvider";
import { getRandomChallenge, getCategories, getDifficulties } from "./challenges";
import type { Difficulty } from "./challenges";

export class TypingPracticePanel {
  public static currentPanel: TypingPracticePanel | undefined;
  private static readonly viewType = "sokudoPractice";

  private readonly panel: vscode.WebviewPanel;
  private readonly extensionUri: vscode.Uri;
  private statusBarProvider: StatusBarProvider | undefined;
  private disposables: vscode.Disposable[] = [];

  public static createOrShow(
    extensionUri: vscode.Uri,
    statusBarProvider?: StatusBarProvider
  ): TypingPracticePanel {
    const column = vscode.ViewColumn.One;

    if (TypingPracticePanel.currentPanel) {
      TypingPracticePanel.currentPanel.panel.reveal(column);
      return TypingPracticePanel.currentPanel;
    }

    const panel = vscode.window.createWebviewPanel(
      TypingPracticePanel.viewType,
      "Sokudo - Typing Practice",
      column,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, "media")],
      }
    );

    TypingPracticePanel.currentPanel = new TypingPracticePanel(
      panel,
      extensionUri,
      statusBarProvider
    );
    return TypingPracticePanel.currentPanel;
  }

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    statusBarProvider?: StatusBarProvider
  ) {
    this.panel = panel;
    this.extensionUri = extensionUri;
    this.statusBarProvider = statusBarProvider;

    this.updateWebviewContent();

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

    this.panel.webview.onDidReceiveMessage(
      (message: WebviewMessage) => this.handleMessage(message),
      null,
      this.disposables
    );
  }

  private handleMessage(message: WebviewMessage): void {
    switch (message.type) {
      case "requestChallenge": {
        const config = vscode.workspace.getConfiguration("sokudo");
        const category =
          message.category ?? config.get<string>("defaultCategory", "git");
        const difficulty = message.difficulty as Difficulty | undefined;
        const challenge = getRandomChallenge(category, difficulty);
        this.panel.webview.postMessage({
          type: "newChallenge",
          challenge,
        });
        break;
      }
      case "updateStats": {
        if (this.statusBarProvider && message.stats) {
          this.statusBarProvider.updateStats(message.stats);
        }
        break;
      }
      case "sessionComplete": {
        if (message.stats) {
          vscode.window.showInformationMessage(
            `Sokudo: Session complete! WPM: ${message.stats.wpm} | Accuracy: ${message.stats.accuracy}%`
          );
        }
        break;
      }
      case "getCategories": {
        const categories = getCategories();
        this.panel.webview.postMessage({
          type: "categories",
          categories,
        });
        break;
      }
      case "getDifficulties": {
        const difficulties = getDifficulties();
        this.panel.webview.postMessage({
          type: "difficulties",
          difficulties,
        });
        break;
      }
    }
  }

  private updateWebviewContent(): void {
    this.panel.webview.html = getWebviewContent(this.panel.webview, this.extensionUri);
  }

  public dispose(): void {
    TypingPracticePanel.currentPanel = undefined;
    this.panel.dispose();
    while (this.disposables.length) {
      const disposable = this.disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }
}

interface WebviewMessage {
  type: string;
  category?: string;
  difficulty?: string;
  stats?: {
    wpm: number;
    accuracy: number;
    totalKeystrokes: number;
    errors: number;
    startTime: number | null;
  };
}

function getNonce(): string {
  let text = "";
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}

function getWebviewContent(_webview: vscode.Webview, _extensionUri: vscode.Uri): string {
  const nonce = getNonce();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
  <title>Sokudo - Typing Practice</title>
  <style nonce="${nonce}">
    :root {
      --bg: #0a0a0b;
      --text: #e4e4e7;
      --muted: #71717a;
      --correct: #22c55e;
      --error: #ef4444;
      --cursor: #a78bfa;
      --accent: #6d28d9;
      --surface: #18181b;
      --border: #27272a;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      background: var(--bg);
      color: var(--text);
      font-family: 'Cascadia Code', 'Fira Code', 'JetBrains Mono', 'Consolas', monospace;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 2rem;
    }

    .container {
      max-width: 800px;
      width: 100%;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .header h1 {
      font-size: 1.25rem;
      color: var(--muted);
      font-weight: 400;
    }

    .header-controls {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .select-control {
      background: var(--surface);
      color: var(--text);
      border: 1px solid var(--border);
      padding: 0.4rem 0.8rem;
      border-radius: 6px;
      font-family: inherit;
      font-size: 0.85rem;
      cursor: pointer;
    }

    .challenge-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .challenge-description {
      color: var(--muted);
      font-size: 0.85rem;
    }

    .difficulty-badge {
      font-size: 0.7rem;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
    }

    .difficulty-easy { background: #064e3b; color: #6ee7b7; }
    .difficulty-medium { background: #713f12; color: #fcd34d; }
    .difficulty-hard { background: #7f1d1d; color: #fca5a5; }

    .progress-bar-container {
      width: 100%;
      height: 3px;
      background: var(--border);
      border-radius: 2px;
      margin-bottom: 1rem;
      overflow: hidden;
    }

    .progress-bar {
      height: 100%;
      background: var(--accent);
      border-radius: 2px;
      transition: width 0.1s ease-out;
      width: 0%;
    }

    .typing-area {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 2rem;
      margin-bottom: 1.5rem;
      min-height: 80px;
      cursor: text;
      position: relative;
    }

    .typing-area:focus-within {
      border-color: var(--accent);
    }

    .typing-text {
      font-size: 1.25rem;
      line-height: 2;
      letter-spacing: 0.02em;
      white-space: pre-wrap;
      word-break: break-all;
    }

    .char { color: var(--muted); }
    .char.correct { color: var(--correct); }
    .char.error { color: var(--error); text-decoration: underline; }
    .char.current {
      background: var(--cursor);
      color: var(--bg);
      border-radius: 2px;
    }

    .stats-bar {
      display: flex;
      gap: 2rem;
      justify-content: center;
      margin-bottom: 1.5rem;
    }

    .stat {
      text-align: center;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text);
    }

    .stat-label {
      font-size: 0.75rem;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    .controls {
      display: flex;
      gap: 0.75rem;
      justify-content: center;
    }

    .btn {
      background: var(--surface);
      color: var(--text);
      border: 1px solid var(--border);
      padding: 0.5rem 1.25rem;
      border-radius: 8px;
      font-family: inherit;
      font-size: 0.85rem;
      cursor: pointer;
      transition: border-color 0.15s;
    }

    .btn:hover { border-color: var(--accent); }

    .btn-primary {
      background: var(--accent);
      border-color: var(--accent);
    }

    .btn-primary:hover {
      opacity: 0.9;
    }

    .hidden-input {
      position: absolute;
      left: -9999px;
      opacity: 0;
    }

    .results-panel {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 2rem;
      margin-bottom: 1.5rem;
      text-align: center;
      display: none;
    }

    .results-panel.visible { display: block; }

    .results-title {
      color: var(--correct);
      font-size: 1.25rem;
      margin-bottom: 1.5rem;
    }

    .results-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .result-item {
      padding: 0.75rem;
      background: var(--bg);
      border-radius: 8px;
    }

    .result-value {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--text);
    }

    .result-label {
      font-size: 0.7rem;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-top: 0.25rem;
    }

    .history {
      margin-top: 1.5rem;
      border-top: 1px solid var(--border);
      padding-top: 1rem;
    }

    .history h2 {
      font-size: 0.8rem;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      font-weight: 400;
      margin-bottom: 0.75rem;
    }

    .history-list {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      max-height: 150px;
      overflow-y: auto;
    }

    .history-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.75rem;
      padding: 0.4rem 0.5rem;
      background: var(--bg);
      border-radius: 4px;
    }

    .history-challenge {
      color: var(--muted);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 50%;
    }

    .history-stats {
      display: flex;
      gap: 1rem;
      color: var(--text);
    }

    .history-wpm {
      color: var(--correct);
      font-weight: 600;
    }

    .history-empty {
      color: var(--muted);
      font-size: 0.8rem;
    }

    .hint {
      color: var(--muted);
      font-size: 0.8rem;
      text-align: center;
      margin-top: 1rem;
    }

    kbd {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 3px;
      padding: 0.1rem 0.35rem;
      font-size: 0.75rem;
      font-family: inherit;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Sokudo Practice</h1>
      <div class="header-controls">
        <select class="select-control" id="difficultySelect">
          <option value="">All Levels</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <select class="select-control" id="categorySelect">
          <option value="git">Git</option>
          <option value="terminal">Terminal</option>
          <option value="react">React</option>
          <option value="ai-prompts">AI Prompts</option>
        </select>
      </div>
    </div>

    <div class="challenge-info">
      <div class="challenge-description" id="description"></div>
      <span class="difficulty-badge" id="difficultyBadge"></span>
    </div>

    <div class="progress-bar-container">
      <div class="progress-bar" id="progressBar"></div>
    </div>

    <div class="typing-area" id="typingArea">
      <input class="hidden-input" id="hiddenInput" type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" />
      <div class="typing-text" id="typingText"></div>
    </div>

    <div class="results-panel" id="resultsPanel">
      <div class="results-title" id="resultsTitle">Challenge Complete</div>
      <div class="results-grid">
        <div class="result-item">
          <div class="result-value" id="resultWpm">0</div>
          <div class="result-label">Words per Minute</div>
        </div>
        <div class="result-item">
          <div class="result-value" id="resultAccuracy">0%</div>
          <div class="result-label">Accuracy</div>
        </div>
        <div class="result-item">
          <div class="result-value" id="resultKeystrokes">0</div>
          <div class="result-label">Keystrokes</div>
        </div>
        <div class="result-item">
          <div class="result-value" id="resultTime">0.0s</div>
          <div class="result-label">Time</div>
        </div>
      </div>
      <div class="controls">
        <button class="btn btn-primary" id="resultNextBtn">Next Challenge</button>
        <button class="btn" id="resultRetryBtn">Retry</button>
      </div>
    </div>

    <div class="stats-bar" id="statsBar">
      <div class="stat">
        <div class="stat-value" id="wpmValue">0</div>
        <div class="stat-label">WPM</div>
      </div>
      <div class="stat">
        <div class="stat-value" id="accuracyValue">100</div>
        <div class="stat-label">Accuracy %</div>
      </div>
      <div class="stat">
        <div class="stat-value" id="keystrokesValue">0</div>
        <div class="stat-label">Keystrokes</div>
      </div>
      <div class="stat">
        <div class="stat-value" id="timeValue">0.0</div>
        <div class="stat-label">Seconds</div>
      </div>
    </div>

    <div class="controls" id="mainControls">
      <button class="btn btn-primary" id="nextBtn">Next Challenge</button>
      <button class="btn" id="resetBtn">Reset</button>
    </div>

    <div class="hint">Click typing area to start | <kbd>Tab</kbd> next | <kbd>Esc</kbd> reset</div>

    <div class="history" id="historySection">
      <h2>Session History</h2>
      <div class="history-list" id="historyList">
        <div class="history-empty">No completed sessions yet.</div>
      </div>
    </div>
  </div>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();

    let challengeText = '';
    let challengeDifficulty = '';
    let cursorPos = 0;
    let errors = 0;
    let totalKeystrokes = 0;
    let startTime = null;
    let timerInterval = null;
    let completed = false;
    let charResults = [];
    let sessionHistory = [];

    const typingArea = document.getElementById('typingArea');
    const hiddenInput = document.getElementById('hiddenInput');
    const typingText = document.getElementById('typingText');
    const description = document.getElementById('description');
    const difficultyBadge = document.getElementById('difficultyBadge');
    const progressBar = document.getElementById('progressBar');
    const wpmValue = document.getElementById('wpmValue');
    const accuracyValue = document.getElementById('accuracyValue');
    const keystrokesValue = document.getElementById('keystrokesValue');
    const timeValue = document.getElementById('timeValue');
    const nextBtn = document.getElementById('nextBtn');
    const resetBtn = document.getElementById('resetBtn');
    const categorySelect = document.getElementById('categorySelect');
    const difficultySelect = document.getElementById('difficultySelect');
    const resultsPanel = document.getElementById('resultsPanel');
    const statsBar = document.getElementById('statsBar');
    const mainControls = document.getElementById('mainControls');
    const resultNextBtn = document.getElementById('resultNextBtn');
    const resultRetryBtn = document.getElementById('resultRetryBtn');
    const historyList = document.getElementById('historyList');

    typingArea.addEventListener('click', () => hiddenInput.focus());

    hiddenInput.addEventListener('keydown', (e) => {
      if (completed) {
        if (e.key === 'Tab') {
          e.preventDefault();
          requestChallenge();
        }
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        resetSession();
        return;
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        requestChallenge();
        return;
      }

      if (e.key === 'Backspace') {
        e.preventDefault();
        if (cursorPos > 0) {
          cursorPos--;
          charResults.pop();
          renderText();
          updateProgress();
        }
        return;
      }

      if (e.key.length === 1) {
        e.preventDefault();
        if (!startTime) {
          startTime = Date.now();
          startTimer();
        }

        totalKeystrokes++;
        const expected = challengeText[cursorPos];
        const isCorrect = e.key === expected;

        if (!isCorrect) {
          errors++;
        }

        charResults.push(isCorrect);
        cursorPos++;
        renderText();
        updateProgress();
        updateStats();

        if (cursorPos >= challengeText.length) {
          onComplete();
        }
      }
    });

    nextBtn.addEventListener('click', () => requestChallenge());
    resetBtn.addEventListener('click', () => resetSession());
    categorySelect.addEventListener('change', () => requestChallenge());
    difficultySelect.addEventListener('change', () => requestChallenge());
    resultNextBtn.addEventListener('click', () => requestChallenge());
    resultRetryBtn.addEventListener('click', () => resetSession());

    function requestChallenge() {
      hideResults();
      resetSession();
      const msg = { type: 'requestChallenge', category: categorySelect.value };
      const diff = difficultySelect.value;
      if (diff) { msg.difficulty = diff; }
      vscode.postMessage(msg);
    }

    function resetSession() {
      cursorPos = 0;
      errors = 0;
      totalKeystrokes = 0;
      startTime = null;
      completed = false;
      charResults = [];
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
      wpmValue.textContent = '0';
      accuracyValue.textContent = '100';
      keystrokesValue.textContent = '0';
      timeValue.textContent = '0.0';
      progressBar.style.width = '0%';
      hideResults();
      renderText();
      hiddenInput.focus();
    }

    function renderText() {
      if (!challengeText) {
        typingText.innerHTML = '<span style="color: var(--muted)">Loading challenge...</span>';
        return;
      }

      let html = '';
      for (let i = 0; i < challengeText.length; i++) {
        const char = challengeText[i] === ' ' ? '&nbsp;' : escapeHtml(challengeText[i]);
        if (i < cursorPos) {
          const wasCorrect = charResults[i] === true;
          html += '<span class="char ' + (wasCorrect ? 'correct' : 'error') + '">' + char + '</span>';
        } else if (i === cursorPos) {
          html += '<span class="char current">' + char + '</span>';
        } else {
          html += '<span class="char">' + char + '</span>';
        }
      }
      typingText.innerHTML = html;
    }

    function escapeHtml(str) {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }

    function updateProgress() {
      if (!challengeText) return;
      const pct = Math.round((cursorPos / challengeText.length) * 100);
      progressBar.style.width = pct + '%';
    }

    function updateStats() {
      if (!startTime) return;
      const elapsed = Date.now() - startTime;
      const minutes = elapsed / 60000;
      const correctChars = totalKeystrokes - errors;
      const wpm = minutes > 0 ? Math.round((correctChars / 5) / minutes) : 0;
      const accuracy = totalKeystrokes > 0 ? Math.round((correctChars / totalKeystrokes) * 100) : 100;

      wpmValue.textContent = wpm;
      accuracyValue.textContent = accuracy;
      keystrokesValue.textContent = totalKeystrokes;

      vscode.postMessage({
        type: 'updateStats',
        stats: { wpm, accuracy, totalKeystrokes, errors, startTime }
      });
    }

    function startTimer() {
      timerInterval = setInterval(() => {
        if (startTime) {
          const elapsed = (Date.now() - startTime) / 1000;
          timeValue.textContent = elapsed.toFixed(1);
        }
      }, 100);
    }

    function onComplete() {
      completed = true;
      if (timerInterval) {
        clearInterval(timerInterval);
      }
      const elapsed = Date.now() - startTime;
      const correctChars = totalKeystrokes - errors;
      const wpm = Math.round((correctChars / 5) / (elapsed / 60000));
      const accuracy = Math.round((correctChars / totalKeystrokes) * 100);

      showResults(wpm, accuracy, totalKeystrokes, elapsed);

      sessionHistory.unshift({
        category: categorySelect.value,
        difficulty: challengeDifficulty,
        wpm: wpm,
        accuracy: accuracy,
        time: elapsed,
      });
      if (sessionHistory.length > 10) { sessionHistory.pop(); }
      renderHistory();

      vscode.postMessage({
        type: 'sessionComplete',
        stats: { wpm, accuracy, totalKeystrokes, errors, startTime }
      });
    }

    function showResults(wpm, accuracy, keystrokes, elapsedMs) {
      document.getElementById('resultWpm').textContent = wpm;
      document.getElementById('resultAccuracy').textContent = accuracy + '%';
      document.getElementById('resultKeystrokes').textContent = keystrokes;
      document.getElementById('resultTime').textContent = (elapsedMs / 1000).toFixed(1) + 's';

      if (accuracy >= 95 && wpm >= 40) {
        document.getElementById('resultsTitle').textContent = 'Excellent!';
      } else if (accuracy >= 80) {
        document.getElementById('resultsTitle').textContent = 'Challenge Complete';
      } else {
        document.getElementById('resultsTitle').textContent = 'Keep Practicing';
      }

      resultsPanel.classList.add('visible');
      statsBar.style.display = 'none';
      mainControls.style.display = 'none';
    }

    function hideResults() {
      resultsPanel.classList.remove('visible');
      statsBar.style.display = '';
      mainControls.style.display = '';
    }

    function renderHistory() {
      if (sessionHistory.length === 0) {
        historyList.innerHTML = '<div class="history-empty">No completed sessions yet.</div>';
        return;
      }
      let html = '';
      for (const s of sessionHistory) {
        html += '<div class="history-item">';
        html += '<span class="history-challenge">' + escapeHtml(s.category);
        if (s.difficulty) { html += ' (' + escapeHtml(s.difficulty) + ')'; }
        html += '</span>';
        html += '<span class="history-stats">';
        html += '<span class="history-wpm">' + s.wpm + ' WPM</span>';
        html += '<span>' + s.accuracy + '%</span>';
        html += '<span>' + (s.time / 1000).toFixed(1) + 's</span>';
        html += '</span></div>';
      }
      historyList.innerHTML = html;
    }

    function updateDifficultyBadge(difficulty) {
      if (!difficulty) {
        difficultyBadge.textContent = '';
        difficultyBadge.className = 'difficulty-badge';
        return;
      }
      difficultyBadge.textContent = difficulty;
      difficultyBadge.className = 'difficulty-badge difficulty-' + difficulty;
    }

    window.addEventListener('message', (event) => {
      const message = event.data;
      switch (message.type) {
        case 'newChallenge':
          challengeText = message.challenge.text;
          challengeDifficulty = message.challenge.difficulty || '';
          description.textContent = message.challenge.description;
          updateDifficultyBadge(message.challenge.difficulty);
          resetSession();
          break;
        case 'categories':
          break;
        case 'difficulties':
          break;
      }
    });

    // Request initial challenge
    requestChallenge();
  </script>
</body>
</html>`;
}
