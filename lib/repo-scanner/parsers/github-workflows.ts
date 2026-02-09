import { parse as parseYaml } from 'yaml';
import type { ExtractedCommand } from './package-json';

interface WorkflowStep {
  name?: string;
  run?: string;
  uses?: string;
}

interface WorkflowJob {
  name?: string;
  steps?: WorkflowStep[];
}

interface WorkflowFile {
  name?: string;
  jobs?: Record<string, WorkflowJob>;
}

/**
 * Extract run commands from GitHub workflow files
 */
export function parseGitHubWorkflow(content: string, filePath: string): ExtractedCommand[] {
  const commands: ExtractedCommand[] = [];

  try {
    const workflow = parseYaml(content) as WorkflowFile;

    if (!workflow?.jobs) {
      return [];
    }

    for (const [jobName, job] of Object.entries(workflow.jobs)) {
      if (!job?.steps) {
        continue;
      }

      for (const step of job.steps) {
        if (!step.run) {
          continue;
        }

        // Split multi-line run commands
        const runLines = step.run.split('\n').filter((line) => {
          const trimmed = line.trim();
          return (
            trimmed.length >= 5 &&
            !trimmed.startsWith('#') &&
            !trimmed.startsWith('echo') &&
            trimmed !== 'true' &&
            trimmed !== 'false'
          );
        });

        for (const runLine of runLines) {
          const cleaned = runLine.trim();

          // Skip variable-only lines
          if (cleaned.match(/^[A-Z_]+=/) && !cleaned.includes(' ')) {
            continue;
          }

          commands.push({
            command: cleaned,
            sourceFile: filePath,
            commandType: 'shell',
            context: `GitHub Actions: ${job.name || jobName}${step.name ? ` - ${step.name}` : ''}`,
          });
        }
      }
    }
  } catch {
    // YAML parsing failed
    return [];
  }

  return commands;
}
