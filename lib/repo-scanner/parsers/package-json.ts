import { z } from 'zod';

export interface ExtractedCommand {
  command: string;
  sourceFile: string;
  commandType: string;
  context?: string;
}

const packageJsonSchema = z.object({
  scripts: z.record(z.string()).optional(),
});

/**
 * Extract npm scripts from package.json
 */
export function parsePackageJson(content: string, filePath: string): ExtractedCommand[] {
  try {
    const parsed = JSON.parse(content);
    const validated = packageJsonSchema.parse(parsed);

    if (!validated.scripts) {
      return [];
    }

    const commands: ExtractedCommand[] = [];

    for (const [scriptName, scriptValue] of Object.entries(validated.scripts)) {
      // Skip trivial scripts (single word commands or very short)
      if (scriptValue.length < 3) {
        continue;
      }

      // Add the npm run command
      commands.push({
        command: `npm run ${scriptName}`,
        sourceFile: filePath,
        commandType: 'npm',
        context: `Runs: ${scriptValue}`,
      });

      // If the script value itself is a useful command, add it too
      // Skip if it's just another npm run command or a simple binary
      if (
        scriptValue.length > 10 &&
        !scriptValue.startsWith('npm run') &&
        !scriptValue.startsWith('pnpm') &&
        !scriptValue.startsWith('yarn') &&
        (scriptValue.includes(' ') || scriptValue.includes('&&'))
      ) {
        commands.push({
          command: scriptValue,
          sourceFile: filePath,
          commandType: 'shell',
          context: `From script "${scriptName}"`,
        });
      }
    }

    return commands;
  } catch {
    return [];
  }
}
