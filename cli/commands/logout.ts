import { Config } from '../lib/config';
import { printSuccess, printInfo } from '../lib/ui';

export async function logout(): Promise<void> {
  const config = Config.load();

  if (!config.apiKey) {
    printInfo('You are not logged in');
    return;
  }

  Config.clear();
  printSuccess('Logged out successfully');
}
