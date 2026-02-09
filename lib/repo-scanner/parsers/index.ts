export type { ExtractedCommand } from './package-json';
export { parsePackageJson } from './package-json';
export { parseDockerfile } from './dockerfile';
export { parseMakefile } from './makefile';
export { parseGitHubWorkflow } from './github-workflows';
export { parseReadme } from './readme';
export { parseDockerCompose } from './docker-compose';

import { parsePackageJson } from './package-json';
import { parseDockerfile } from './dockerfile';
import { parseMakefile } from './makefile';
import { parseGitHubWorkflow } from './github-workflows';
import { parseReadme } from './readme';
import { parseDockerCompose } from './docker-compose';
import type { ExtractedCommand } from './package-json';

/**
 * Parse a file and extract commands based on its type
 */
export function parseFile(filePath: string, content: string): ExtractedCommand[] {
  const filename = filePath.split('/').pop() || '';

  // Package.json
  if (filename === 'package.json') {
    return parsePackageJson(content, filePath);
  }

  // Dockerfile
  if (filename === 'Dockerfile' || filename.startsWith('Dockerfile.')) {
    return parseDockerfile(content, filePath);
  }

  // Makefile
  if (filename === 'Makefile' || filename === 'makefile' || filename.endsWith('.mk')) {
    return parseMakefile(content, filePath);
  }

  // GitHub workflows
  if (filePath.includes('.github/workflows/') && (filePath.endsWith('.yml') || filePath.endsWith('.yaml'))) {
    return parseGitHubWorkflow(content, filePath);
  }

  // Docker Compose
  if (filename === 'docker-compose.yml' || filename === 'docker-compose.yaml') {
    return parseDockerCompose(content, filePath);
  }

  // README and CONTRIBUTING
  if (filename.toLowerCase() === 'readme.md' || filename.toLowerCase() === 'contributing.md') {
    return parseReadme(content, filePath);
  }

  // Shell scripts in bin/ or scripts/
  if (filePath.startsWith('bin/') || filePath.startsWith('scripts/')) {
    return parseShellScript(content, filePath);
  }

  return [];
}

/**
 * Parse shell scripts
 */
function parseShellScript(content: string, filePath: string): ExtractedCommand[] {
  const commands: ExtractedCommand[] = [];
  const filename = filePath.split('/').pop() || '';

  // Add the script invocation itself
  commands.push({
    command: `./${filePath}`,
    sourceFile: filePath,
    commandType: 'shell',
    context: `Run ${filename} script`,
  });

  // Extract significant commands from the script
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip comments, empty lines, and variable assignments
    if (
      !trimmed ||
      trimmed.startsWith('#') ||
      trimmed.startsWith('set ') ||
      trimmed.match(/^[A-Z_]+=/) ||
      trimmed.startsWith('if ') ||
      trimmed.startsWith('fi') ||
      trimmed.startsWith('then') ||
      trimmed.startsWith('else') ||
      trimmed.startsWith('for ') ||
      trimmed.startsWith('done') ||
      trimmed.startsWith('while ') ||
      trimmed.startsWith('case ') ||
      trimmed.startsWith('esac') ||
      trimmed.startsWith('function ') ||
      trimmed.startsWith('}') ||
      trimmed.startsWith('{') ||
      trimmed === ';;'
    ) {
      continue;
    }

    // Look for significant commands
    const commandPatterns = [
      /^(npm|pnpm|yarn|npx)\s+/,
      /^(git|gh)\s+/,
      /^(docker|docker-compose|kubectl)\s+/,
      /^(make|cargo|go|pip)\s+/,
      /^(curl|wget)\s+/,
    ];

    if (commandPatterns.some((pattern) => pattern.test(trimmed)) && trimmed.length >= 10) {
      commands.push({
        command: trimmed,
        sourceFile: filePath,
        commandType: 'shell',
        context: `From ${filename}`,
      });
    }
  }

  return commands;
}
