import { ApiClient } from '../lib/api-client';
import { Config } from '../lib/config';
import { printError, printHeader, printTable, printInfo, colors, formatDuration } from '../lib/ui';

interface StatsOptions {
  days?: string;
  detailed?: boolean;
}

export async function stats(options: StatsOptions): Promise<void> {
  try {
    if (!Config.isAuthenticated()) {
      printError('Please login first with `sokudo login`');
      process.exit(1);
    }

    const client = new ApiClient();
    const days = parseInt(options.days || '7', 10);
    const userStats = await client.getUserStats(days);

    printHeader(`Your Statistics (Last ${days} days)`);

    console.log(`${colors.bright}Total Sessions:${colors.reset}    ${userStats.totalSessions}`);
    console.log(`${colors.bright}Average WPM:${colors.reset}       ${colors.green}${userStats.avgWpm}${colors.reset}`);
    console.log(`${colors.bright}Average Accuracy:${colors.reset}  ${userStats.avgAccuracy >= 95 ? colors.green : colors.yellow}${userStats.avgAccuracy}%${colors.reset}`);
    console.log(`${colors.bright}Practice Time:${colors.reset}     ${formatDuration(userStats.totalPracticeTime)}`);
    console.log(`${colors.bright}Current Streak:${colors.reset}    ${userStats.streak > 0 ? colors.green : colors.dim}${userStats.streak} day(s)${colors.reset}`);
    console.log();

    // Recent sessions
    printInfo('Recent Sessions');
    const sessions = await client.getRecentSessions(10);

    if (sessions.length > 0) {
      const rows = sessions.map(session => [
        new Date(session.completedAt).toLocaleDateString(),
        session.challengeId.toString(),
        `${session.wpm}`,
        `${session.accuracy}%`,
        formatDuration(session.durationMs),
      ]);

      printTable(['Date', 'Challenge', 'WPM', 'Accuracy', 'Time'], rows);
    } else {
      console.log(`${colors.dim}No recent sessions${colors.reset}`);
    }

    // Detailed key accuracy
    if (options.detailed) {
      console.log();
      printInfo('Key Accuracy Analysis');

      const keyAccuracy = await client.getKeyAccuracy();

      if (keyAccuracy.length > 0) {
        const sortedKeys = keyAccuracy
          .sort((a, b) => a.accuracy - b.accuracy)
          .slice(0, 10);

        const rows = sortedKeys.map(ka => [
          ka.key === ' ' ? '(space)' : ka.key,
          `${ka.accuracy.toFixed(1)}%`,
          `${ka.avgLatency}ms`,
          ka.totalPresses.toString(),
        ]);

        printTable(['Key', 'Accuracy', 'Avg Latency', 'Count'], rows);
        console.log();
        console.log(`${colors.dim}Showing keys with lowest accuracy${colors.reset}`);
      } else {
        console.log(`${colors.dim}No key accuracy data yet${colors.reset}`);
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      printError(`Failed to fetch stats: ${error.message}`);
    } else {
      printError('Failed to fetch stats');
    }
    process.exit(1);
  }
}
