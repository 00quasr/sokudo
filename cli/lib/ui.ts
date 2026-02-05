export const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',

  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',

  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m',
};

export function clearScreen(): void {
  process.stdout.write('\x1b[2J\x1b[0f');
}

export function moveCursor(row: number, col: number): void {
  process.stdout.write(`\x1b[${row};${col}H`);
}

export function hideCursor(): void {
  process.stdout.write('\x1b[?25l');
}

export function showCursor(): void {
  process.stdout.write('\x1b[?25h');
}

export function printBox(content: string[], width?: number): void {
  const maxWidth = width || Math.max(...content.map(line => line.length)) + 4;
  const topBorder = `╭${'─'.repeat(maxWidth - 2)}╮`;
  const bottomBorder = `╰${'─'.repeat(maxWidth - 2)}╯`;

  console.log(colors.dim + topBorder + colors.reset);
  content.forEach(line => {
    const padding = ' '.repeat(Math.max(0, maxWidth - line.length - 4));
    console.log(colors.dim + '│ ' + colors.reset + line + padding + colors.dim + ' │' + colors.reset);
  });
  console.log(colors.dim + bottomBorder + colors.reset);
}

export function printHeader(text: string): void {
  console.log(colors.bright + colors.cyan + text + colors.reset);
  console.log(colors.dim + '─'.repeat(text.length) + colors.reset);
  console.log();
}

export function printSuccess(message: string): void {
  console.log(colors.green + '✓ ' + message + colors.reset);
}

export function printError(message: string): void {
  console.log(colors.red + '✗ ' + message + colors.reset);
}

export function printWarning(message: string): void {
  console.log(colors.yellow + '⚠ ' + message + colors.reset);
}

export function printInfo(message: string): void {
  console.log(colors.cyan + 'ℹ ' + message + colors.reset);
}

export function printStats(stats: {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  keystrokes: number;
  errors: number;
  durationMs: number;
}): void {
  const duration = (stats.durationMs / 1000).toFixed(1);

  console.log();
  printBox([
    `${colors.bright}WPM:${colors.reset}      ${colors.green}${stats.wpm}${colors.reset} (Raw: ${stats.rawWpm})`,
    `${colors.bright}Accuracy:${colors.reset} ${stats.accuracy >= 95 ? colors.green : stats.accuracy >= 85 ? colors.yellow : colors.red}${stats.accuracy}%${colors.reset}`,
    `${colors.bright}Time:${colors.reset}     ${duration}s`,
    `${colors.bright}Keys:${colors.reset}     ${stats.keystrokes} (${stats.errors} errors)`,
  ]);
}

export function printProgress(current: number, total: number): void {
  const percentage = Math.round((current / total) * 100);
  const barLength = 30;
  const filled = Math.round((current / total) * barLength);
  const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);

  process.stdout.write(`\r${colors.cyan}Progress: ${colors.reset}[${bar}] ${percentage}%`);
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

export function printTable(headers: string[], rows: string[][]): void {
  const colWidths = headers.map((header, i) => {
    const maxRowWidth = Math.max(...rows.map(row => (row[i] || '').length));
    return Math.max(header.length, maxRowWidth) + 2;
  });

  // Header
  const headerRow = headers.map((h, i) => h.padEnd(colWidths[i])).join(' │ ');
  console.log(colors.bright + headerRow + colors.reset);
  console.log(colors.dim + '─'.repeat(headerRow.length) + colors.reset);

  // Rows
  rows.forEach(row => {
    const formattedRow = row.map((cell, i) => (cell || '').padEnd(colWidths[i])).join(' │ ');
    console.log(formattedRow);
  });
}
