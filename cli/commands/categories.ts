import { ApiClient } from '../lib/api-client';
import { Config } from '../lib/config';
import { printError, printHeader, printTable, colors } from '../lib/ui';

export async function categories(options: { free?: boolean }): Promise<void> {
  try {
    if (!Config.isAuthenticated()) {
      printError('Please login first with `sokudo login`');
      process.exit(1);
    }

    const client = new ApiClient();
    const allCategories = await client.getCategories();

    const filteredCategories = options.free
      ? allCategories.filter(cat => !cat.isPremium)
      : allCategories;

    printHeader('Practice Categories');

    const rows = filteredCategories
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map(cat => [
        cat.icon,
        cat.name,
        cat.slug,
        cat.difficulty,
        cat.isPremium ? `${colors.yellow}Premium${colors.reset}` : `${colors.green}Free${colors.reset}`,
      ]);

    printTable(['', 'Name', 'Slug', 'Difficulty', 'Tier'], rows);

    console.log();
    console.log(`Use ${colors.cyan}sokudo practice --category <slug>${colors.reset} to practice a category`);
    console.log(`Example: ${colors.dim}sokudo practice --category git-basics${colors.reset}`);
  } catch (error) {
    if (error instanceof Error) {
      printError(`Failed to fetch categories: ${error.message}`);
    } else {
      printError('Failed to fetch categories');
    }
    process.exit(1);
  }
}
