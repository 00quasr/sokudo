import type { ExtractedCommand } from './package-json';

/**
 * Extract bash/shell code blocks from README.md
 */
export function parseReadme(content: string, filePath: string): ExtractedCommand[] {
  const commands: ExtractedCommand[] = [];

  // Match fenced code blocks with bash, sh, shell, zsh, or console language
  const codeBlockRegex = /```(?:bash|sh|shell|zsh|console)\n([\s\S]*?)```/gi;

  let match;
  while ((match = codeBlockRegex.exec(content)) !== null) {
    const codeBlock = match[1];

    // Split into lines and process each
    const lines = codeBlock.split('\n');

    for (const line of lines) {
      let cleaned = line.trim();

      // Skip empty lines and comments
      if (!cleaned || cleaned.startsWith('#')) {
        continue;
      }

      // Remove common prompt prefixes
      cleaned = cleaned
        .replace(/^\$\s+/, '') // $ prompt
        .replace(/^>\s+/, '') // > prompt
        .replace(/^%\s+/, '') // % prompt
        .replace(/^#\s+/, '') // # prompt (root)
        .trim();

      // Skip output lines (usually don't start with a command)
      if (
        cleaned.length < 5 ||
        cleaned.startsWith('...') ||
        cleaned.startsWith('└') ||
        cleaned.startsWith('├') ||
        cleaned.startsWith('│') ||
        /^[a-z]+:/.test(cleaned) || // likely key: value output
        /^\d+\.\d+/.test(cleaned) // version numbers
      ) {
        continue;
      }

      // Check if it looks like a command
      const commandPatterns = [
        /^(npm|pnpm|yarn|npx)\s+/,
        /^(git|gh)\s+/,
        /^(docker|docker-compose|kubectl)\s+/,
        /^(make|cargo|go|pip|poetry)\s+/,
        /^(curl|wget|ssh|scp)\s+/,
        /^(cd|mkdir|rm|cp|mv|cat|ls)\s+/,
        /^(brew|apt|apt-get|yum|dnf)\s+/,
        /^(node|python|python3|ruby|php)\s+/,
        /^\.?\//,  // paths
        /^[a-z_][a-z0-9_-]*\s+/i, // generic command
      ];

      const looksLikeCommand = commandPatterns.some((pattern) => pattern.test(cleaned));

      if (looksLikeCommand) {
        commands.push({
          command: cleaned,
          sourceFile: filePath,
          commandType: determineCommandType(cleaned),
          context: `From ${filePath}`,
        });
      }
    }
  }

  return commands;
}

/**
 * Determine the command type based on the command content
 */
function determineCommandType(command: string): string {
  if (/^(npm|pnpm|yarn|npx)\s+/.test(command)) return 'npm';
  if (/^(git|gh)\s+/.test(command)) return 'git';
  if (/^(docker|docker-compose)\s+/.test(command)) return 'docker';
  if (/^kubectl\s+/.test(command)) return 'kubernetes';
  if (/^make\s+/.test(command)) return 'make';
  if (/^cargo\s+/.test(command)) return 'rust';
  if (/^go\s+/.test(command)) return 'go';
  if (/^(pip|poetry|python)\s+/.test(command)) return 'python';
  return 'shell';
}
