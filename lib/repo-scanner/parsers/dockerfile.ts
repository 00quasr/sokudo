import type { ExtractedCommand } from './package-json';

/**
 * Extract RUN commands from Dockerfile
 */
export function parseDockerfile(content: string, filePath: string): ExtractedCommand[] {
  const commands: ExtractedCommand[] = [];
  const lines = content.split('\n');

  let currentRun = '';
  let inMultiLine = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Handle line continuation
    if (inMultiLine) {
      if (trimmed.endsWith('\\')) {
        currentRun += ' ' + trimmed.slice(0, -1).trim();
      } else {
        currentRun += ' ' + trimmed;
        // End of multi-line RUN
        const cleaned = cleanRunCommand(currentRun);
        if (cleaned && cleaned.length >= 5) {
          commands.push({
            command: cleaned,
            sourceFile: filePath,
            commandType: 'docker',
            context: 'Dockerfile RUN instruction',
          });
        }
        currentRun = '';
        inMultiLine = false;
      }
      continue;
    }

    // Check for RUN instruction
    if (trimmed.toUpperCase().startsWith('RUN ')) {
      const runContent = trimmed.slice(4).trim();

      if (runContent.endsWith('\\')) {
        // Start of multi-line RUN
        currentRun = runContent.slice(0, -1).trim();
        inMultiLine = true;
      } else {
        // Single-line RUN
        const cleaned = cleanRunCommand(runContent);
        if (cleaned && cleaned.length >= 5) {
          commands.push({
            command: cleaned,
            sourceFile: filePath,
            commandType: 'docker',
            context: 'Dockerfile RUN instruction',
          });
        }
      }
    }
  }

  return commands;
}

/**
 * Clean up RUN command content
 */
function cleanRunCommand(command: string): string {
  // Remove shell form wrapper if present
  let cleaned = command
    .replace(/^\[.*?\]$/, '') // Remove JSON form
    .replace(/^\/bin\/sh -c\s+/, '') // Remove shell wrapper
    .replace(/^\/bin\/bash -c\s+/, '')
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  // Remove quotes around the entire command
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) ||
      (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1);
  }

  return cleaned;
}
