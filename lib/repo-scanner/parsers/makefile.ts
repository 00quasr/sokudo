import type { ExtractedCommand } from './package-json';

/**
 * Extract make targets and their commands from Makefile
 */
export function parseMakefile(content: string, filePath: string): ExtractedCommand[] {
  const commands: ExtractedCommand[] = [];
  const lines = content.split('\n');

  let currentTarget = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for target definition (line ending with :)
    const targetMatch = line.match(/^([a-zA-Z0-9_-]+)\s*:/);
    if (targetMatch && !line.startsWith('\t')) {
      currentTarget = targetMatch[1];

      // Skip special targets
      if (currentTarget.startsWith('.') || currentTarget === 'all') {
        currentTarget = '';
        continue;
      }

      // Add make <target> command
      commands.push({
        command: `make ${currentTarget}`,
        sourceFile: filePath,
        commandType: 'make',
        context: `Makefile target`,
      });
    }

    // Check for recipe lines (commands under a target, start with tab)
    if (currentTarget && line.startsWith('\t')) {
      let recipe = line.slice(1).trim();

      // Remove @ prefix (silent mode)
      if (recipe.startsWith('@')) {
        recipe = recipe.slice(1).trim();
      }

      // Skip empty lines, variable assignments, and special make commands
      if (
        recipe.length < 5 ||
        recipe.startsWith('#') ||
        recipe.startsWith('$(') ||
        recipe.startsWith('echo') ||
        recipe === 'true' ||
        recipe === 'false'
      ) {
        continue;
      }

      // Add the actual command
      commands.push({
        command: recipe,
        sourceFile: filePath,
        commandType: 'shell',
        context: `From make target "${currentTarget}"`,
      });
    }

    // Empty line or new target ends current target scope
    if (!line.trim() || (line.match(/^[a-zA-Z0-9_-]+\s*:/) && !line.startsWith('\t'))) {
      // Don't reset if we just set it
      if (!targetMatch) {
        currentTarget = '';
      }
    }
  }

  return commands;
}
