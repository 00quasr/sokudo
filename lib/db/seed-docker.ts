import { db } from './drizzle';
import { categories, challenges } from './schema';
import { eq } from 'drizzle-orm';

/**
 * Docker challenges covering 7 core commands:
 * run, build, compose, exec, logs, prune, network
 *
 * 25 challenges total, varying in difficulty:
 * - beginner: simple single commands
 * - intermediate: commands with common options/flags
 * - advanced: complex command combinations
 */
export const dockerChallenges = [
  // === RUN (5 challenges) ===
  {
    content: 'docker run nginx',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Run an nginx container',
  },
  {
    content: 'docker run -d nginx',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Run nginx in detached mode',
  },
  {
    content: 'docker run -p 8080:80 nginx',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Run nginx with port mapping',
  },
  {
    content: 'docker run -d --name web -p 80:80 nginx',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Run named container with port mapping',
  },
  {
    content: 'docker run -d -v /data:/app/data -e NODE_ENV=production node',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Run with volume mount and environment variable',
  },

  // === BUILD (4 challenges) ===
  {
    content: 'docker build .',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Build image from Dockerfile in current directory',
  },
  {
    content: 'docker build -t myapp .',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Build and tag an image',
  },
  {
    content: 'docker build -t myapp:v1.0 .',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Build and tag an image with version',
  },
  {
    content: 'docker build -t myapp:latest -f Dockerfile.prod .',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Build with custom Dockerfile',
  },

  // === COMPOSE (4 challenges) ===
  {
    content: 'docker compose up',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Start services defined in docker-compose.yml',
  },
  {
    content: 'docker compose up -d',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Start services in detached mode',
  },
  {
    content: 'docker compose down',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Stop and remove containers',
  },
  {
    content: 'docker compose up -d --build --force-recreate',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Rebuild images and recreate containers',
  },

  // === EXEC (3 challenges) ===
  {
    content: 'docker exec -it web bash',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Open interactive shell in running container',
  },
  {
    content: 'docker exec web ls /app',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Run command in container',
  },
  {
    content: 'docker exec -it -u root web sh',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Open shell as root user',
  },

  // === LOGS (3 challenges) ===
  {
    content: 'docker logs web',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'View container logs',
  },
  {
    content: 'docker logs -f web',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Follow container logs in real-time',
  },
  {
    content: 'docker logs --tail 100 web',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'View last 100 lines of logs',
  },

  // === PRUNE (3 challenges) ===
  {
    content: 'docker system prune',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Remove unused data',
  },
  {
    content: 'docker image prune',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Remove unused images',
  },
  {
    content: 'docker system prune -a --volumes',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Remove all unused data including volumes',
  },

  // === NETWORK (3 challenges) ===
  {
    content: 'docker network ls',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'List all networks',
  },
  {
    content: 'docker network create mynetwork',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Create a custom network',
  },
  {
    content: 'docker network connect mynetwork web',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Connect container to network',
  },
];

export async function seedDockerChallenges() {
  console.log('Seeding Docker challenges...');

  // Get the Docker category
  const [dockerCategory] = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, 'docker'))
    .limit(1);

  if (!dockerCategory) {
    console.error('Error: Docker category not found. Run db:seed first.');
    process.exit(1);
  }

  const categoryId = dockerCategory.id;

  // Insert challenges
  const challengeData = dockerChallenges.map((challenge) => ({
    ...challenge,
    categoryId,
  }));

  await db.insert(challenges).values(challengeData);

  console.log(`Seeded ${dockerChallenges.length} Docker challenges.`);
}

// Run if executed directly
if (require.main === module) {
  seedDockerChallenges()
    .catch((error) => {
      console.error('Seed Docker failed:', error);
      process.exit(1);
    })
    .finally(() => {
      console.log('Seed Docker finished. Exiting...');
      process.exit(0);
    });
}
