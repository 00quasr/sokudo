import { parse as parseYaml } from 'yaml';
import type { ExtractedCommand } from './package-json';

interface ComposeService {
  command?: string | string[];
  entrypoint?: string | string[];
  build?: string | { context?: string; dockerfile?: string };
}

interface ComposeFile {
  services?: Record<string, ComposeService>;
}

/**
 * Extract command entries from docker-compose.yml
 */
export function parseDockerCompose(content: string, filePath: string): ExtractedCommand[] {
  const commands: ExtractedCommand[] = [];

  try {
    const compose = parseYaml(content) as ComposeFile;

    if (!compose?.services) {
      return [];
    }

    // Add docker-compose commands
    commands.push({
      command: 'docker-compose up',
      sourceFile: filePath,
      commandType: 'docker',
      context: 'Start all services',
    });

    commands.push({
      command: 'docker-compose up -d',
      sourceFile: filePath,
      commandType: 'docker',
      context: 'Start all services in detached mode',
    });

    commands.push({
      command: 'docker-compose down',
      sourceFile: filePath,
      commandType: 'docker',
      context: 'Stop and remove containers',
    });

    commands.push({
      command: 'docker-compose build',
      sourceFile: filePath,
      commandType: 'docker',
      context: 'Build all services',
    });

    for (const [serviceName, service] of Object.entries(compose.services)) {
      // Add service-specific commands
      commands.push({
        command: `docker-compose up ${serviceName}`,
        sourceFile: filePath,
        commandType: 'docker',
        context: `Start ${serviceName} service`,
      });

      commands.push({
        command: `docker-compose logs ${serviceName}`,
        sourceFile: filePath,
        commandType: 'docker',
        context: `View ${serviceName} logs`,
      });

      commands.push({
        command: `docker-compose exec ${serviceName} sh`,
        sourceFile: filePath,
        commandType: 'docker',
        context: `Shell into ${serviceName} container`,
      });

      // Extract command if specified
      if (service.command) {
        const cmd = Array.isArray(service.command)
          ? service.command.join(' ')
          : service.command;

        if (cmd.length >= 5) {
          commands.push({
            command: cmd,
            sourceFile: filePath,
            commandType: 'shell',
            context: `Command for ${serviceName} service`,
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
