import { createInterface } from 'readline';
import { Config } from '../lib/config';
import { ApiClient } from '../lib/api-client';
import { printSuccess, printError, printInfo } from '../lib/ui';

export async function login(options: { apiKey?: string }): Promise<void> {
  try {
    let apiKey = options.apiKey;

    if (!apiKey) {
      // Prompt for API key
      const rl = createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      apiKey = await new Promise<string>((resolve) => {
        rl.question('Enter your API key: ', (answer) => {
          rl.close();
          resolve(answer.trim());
        });
      });
    }

    if (!apiKey) {
      printError('API key is required');
      process.exit(1);
    }

    // Verify API key
    printInfo('Verifying API key...');
    const client = new ApiClient();
    const { userId, email } = await client.verifyApiKey(apiKey);

    // Save to config
    const config = Config.load();
    config.apiKey = apiKey;
    config.userId = userId;
    config.email = email;
    Config.save(config);

    printSuccess(`Logged in as ${email}`);
    printInfo('You can now use `sokudo practice` to start typing');
  } catch (error) {
    if (error instanceof Error) {
      printError(`Login failed: ${error.message}`);
    } else {
      printError('Login failed');
    }
    process.exit(1);
  }
}
