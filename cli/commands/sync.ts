import { ApiClient } from '../lib/api-client';
import { Config } from '../lib/config';
import { printError, printSuccess, printInfo, printWarning } from '../lib/ui';

export async function sync(): Promise<void> {
  try {
    if (!Config.isAuthenticated()) {
      printError('Please login first with `sokudo login`');
      process.exit(1);
    }

    const offlineSessions = Config.getOfflineSessions();

    if (offlineSessions.length === 0) {
      printInfo('No offline sessions to sync');
      return;
    }

    printInfo(`Found ${offlineSessions.length} offline session(s) to sync...`);

    const client = new ApiClient();
    let successCount = 0;
    let failCount = 0;

    for (const session of offlineSessions) {
      try {
        await client.submitSession({
          challengeId: session.challengeId,
          wpm: session.stats.wpm,
          rawWpm: session.stats.rawWpm,
          accuracy: session.stats.accuracy,
          keystrokes: session.stats.keystrokes,
          errors: session.stats.errors,
          durationMs: session.stats.durationMs,
          keystrokeLogs: session.keystrokeLogs,
        });
        successCount++;
      } catch (error) {
        failCount++;
        console.error(`Failed to sync session ${session.challengeId}:`, error);
      }
    }

    if (failCount === 0) {
      Config.clearOfflineSessions();
      printSuccess(`Successfully synced ${successCount} session(s)`);
    } else {
      printWarning(`Synced ${successCount} session(s), ${failCount} failed`);
      printInfo('Failed sessions remain in offline queue');
    }
  } catch (error) {
    if (error instanceof Error) {
      printError(`Sync failed: ${error.message}`);
    } else {
      printError('Sync failed');
    }
    process.exit(1);
  }
}
