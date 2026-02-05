import { stdin as input, stdout as output } from 'process';
import * as readline from 'readline';
import { ApiClient } from '../lib/api-client';
import { Config } from '../lib/config';
import { TypingEngine, formatTypingDisplay } from '../lib/typing-engine';
import {
  printError,
  printHeader,
  printSuccess,
  printInfo,
  printWarning,
  printStats,
  clearScreen,
  hideCursor,
  showCursor,
  colors,
} from '../lib/ui';

interface PracticeOptions {
  category?: string;
  difficulty?: string;
  random?: boolean;
  offline?: boolean;
}

export async function practice(options: PracticeOptions): Promise<void> {
  try {
    if (!Config.isAuthenticated() && !options.offline) {
      printError('Please login first with `sokudo login` or use --offline mode');
      process.exit(1);
    }

    const client = new ApiClient();
    let challenges;

    // Fetch challenges
    if (options.offline) {
      printWarning('Offline mode: Sessions will be saved locally and synced later');
      // In offline mode, we'd need pre-cached challenges
      // For now, just show an error
      printError('Offline mode requires pre-cached challenges (not yet implemented)');
      process.exit(1);
    } else {
      challenges = await client.getChallenges(options.category, options.difficulty);

      if (challenges.length === 0) {
        printError('No challenges found matching your criteria');
        process.exit(1);
      }
    }

    // Select a challenge
    const challenge = options.random
      ? challenges[Math.floor(Math.random() * challenges.length)]
      : challenges[0];

    // Start practice session
    await startPracticeSession(challenge, options.offline || false);
  } catch (error) {
    showCursor();
    if (error instanceof Error) {
      printError(`Practice failed: ${error.message}`);
    } else {
      printError('Practice failed');
    }
    process.exit(1);
  }
}

async function startPracticeSession(
  challenge: any,
  offline: boolean
): Promise<void> {
  clearScreen();
  hideCursor();

  // Setup readline for raw mode
  if (input.isTTY) {
    input.setRawMode(true);
  }

  printHeader(`Challenge #${challenge.id} - ${challenge.difficulty}`);
  console.log(`${colors.dim}Type: ${challenge.syntaxType}${colors.reset}`);
  if (challenge.hint) {
    console.log(`${colors.dim}Hint: ${challenge.hint}${colors.reset}`);
  }
  console.log();

  const engine = new TypingEngine({
    content: challenge.content,
    onKeystroke: (event) => {
      // Redraw on each keystroke
      redraw(engine, challenge.content);
    },
    onComplete: async (stats, keystrokeLogs) => {
      // Cleanup
      if (input.isTTY) {
        input.setRawMode(false);
      }
      showCursor();

      // Show results
      clearScreen();
      printHeader('🎉 Challenge Complete!');
      printStats(stats);

      // Submit session
      if (!offline) {
        try {
          printInfo('Submitting session...');
          const client = new ApiClient();
          const result = await client.submitSession({
            challengeId: challenge.id,
            wpm: stats.wpm,
            rawWpm: stats.rawWpm,
            accuracy: stats.accuracy,
            keystrokes: stats.keystrokes,
            errors: stats.errors,
            durationMs: stats.durationMs,
            keystrokeLogs: keystrokeLogs,
          });

          printSuccess('Session saved!');

          if (result.achievementsUnlocked && result.achievementsUnlocked.length > 0) {
            console.log();
            printSuccess(`🏆 Unlocked ${result.achievementsUnlocked.length} achievement(s)!`);
            result.achievementsUnlocked.forEach((achievement: any) => {
              console.log(`   ${achievement.icon} ${achievement.name}`);
            });
          }
        } catch (error) {
          printWarning('Failed to submit session. Saving offline...');
          Config.saveOfflineSession({
            challengeId: challenge.id,
            stats,
            keystrokeLogs,
            timestamp: Date.now(),
          });
          printInfo('Use `sokudo sync` to upload later');
        }
      } else {
        Config.saveOfflineSession({
          challengeId: challenge.id,
          stats,
          keystrokeLogs,
          timestamp: Date.now(),
        });
        printInfo('Session saved offline. Use `sokudo sync` to upload');
      }

      console.log();
      console.log(`${colors.dim}Press Ctrl+C to exit or run another challenge${colors.reset}`);
      process.exit(0);
    },
  });

  // Initial draw
  redraw(engine, challenge.content);

  // Handle input
  input.on('data', (key) => {
    const char = key.toString();

    // Ctrl+C to exit
    if (char === '\x03') {
      if (input.isTTY) {
        input.setRawMode(false);
      }
      showCursor();
      console.log('\n');
      printInfo('Practice cancelled');
      process.exit(0);
    }

    engine.handleKey(char);
  });
}

function redraw(engine: TypingEngine, content: string): void {
  // Move cursor to content area (skip header lines)
  process.stdout.write('\x1b[7;0H'); // Row 7, Column 0

  // Clear from cursor down
  process.stdout.write('\x1b[J');

  // Display typed content
  const display = formatTypingDisplay(
    content,
    engine.getTypedChars(),
    engine.getCursorPosition(),
    engine.getErrors()
  );

  console.log(display);
  console.log();

  // Show current stats
  const stats = engine.getCurrentStats();
  console.log(
    `${colors.dim}WPM: ${colors.reset}${colors.green}${stats.wpm}${colors.reset} | ` +
    `${colors.dim}Accuracy: ${colors.reset}${stats.accuracy >= 95 ? colors.green : stats.accuracy >= 85 ? colors.yellow : colors.red}${stats.accuracy}%${colors.reset} | ` +
    `${colors.dim}Errors: ${colors.reset}${stats.errors > 0 ? colors.red : colors.green}${stats.errors}${colors.reset}`
  );

  console.log();
  console.log(`${colors.dim}Backspace to correct | Ctrl+C to exit${colors.reset}`);
}
