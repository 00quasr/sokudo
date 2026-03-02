import { db } from './drizzle';
import { categories, challenges } from './schema';
import { eq } from 'drizzle-orm';

/**
 * curl challenges
 *
 * 25 challenges covering:
 * - Basic requests
 * - Headers and auth
 * - Data and file transfers
 */
export const curlChallenges = [
  // === Basic Requests ===
  {
    content: 'curl https://api.example.com',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Make a GET request',
  },
  {
    content: 'curl -v https://api.example.com',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Verbose output with headers',
  },
  {
    content: 'curl -I https://api.example.com',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Fetch only headers',
  },
  {
    content: 'curl -o output.html https://example.com',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Save response to file',
  },
  {
    content: 'curl -O https://example.com/file.zip',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Download file with original name',
  },
  {
    content: 'curl -L https://example.com',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Follow redirects',
  },

  // === HTTP Methods ===
  {
    content: 'curl -X POST https://api.example.com',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Make a POST request',
  },
  {
    content: 'curl -X PUT https://api.example.com/1',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Make a PUT request',
  },
  {
    content: 'curl -X DELETE https://api.example.com/1',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Make a DELETE request',
  },
  {
    content: 'curl -X PATCH https://api.example.com/1',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Make a PATCH request',
  },

  // === Headers ===
  {
    content: 'curl -H "Content-Type: application/json" https://api.example.com',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Set Content-Type header',
  },
  {
    content: 'curl -H "Authorization: Bearer token123" https://api.example.com',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Set Authorization header',
  },
  {
    content: 'curl -H "Accept: application/json" https://api.example.com',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Set Accept header',
  },

  // === Data ===
  {
    content: 'curl -d "name=value" https://api.example.com',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Send form data',
  },
  {
    content: "curl -d '{\"key\":\"value\"}' -H 'Content-Type: application/json' https://api.example.com",
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Send JSON data',
  },
  {
    content: 'curl -d @data.json https://api.example.com',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Send data from file',
  },
  {
    content: 'curl -F "file=@photo.jpg" https://api.example.com/upload',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Upload a file',
  },

  // === Authentication ===
  {
    content: 'curl -u username:password https://api.example.com',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Basic authentication',
  },
  {
    content: 'curl --netrc https://api.example.com',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Use .netrc for auth',
  },

  // === Advanced Options ===
  {
    content: 'curl -s https://api.example.com',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Silent mode (no progress)',
  },
  {
    content: 'curl -w "%{http_code}" https://api.example.com',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Print only status code',
  },
  {
    content: 'curl --connect-timeout 5 https://api.example.com',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Set connection timeout',
  },
  {
    content: 'curl -k https://self-signed.example.com',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Ignore SSL certificate errors',
  },
  {
    content: 'curl -x http://proxy:8080 https://api.example.com',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Use a proxy',
  },
  {
    content: 'curl -c cookies.txt -b cookies.txt https://example.com',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Handle cookies',
  },
];

export async function seedCurlChallenges() {
  console.log('Seeding curl challenges...');

  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, 'curl'))
    .limit(1);

  if (!category) {
    console.error('Error: curl category not found. Run db:seed first.');
    process.exit(1);
  }

  const challengeData = curlChallenges.map((challenge) => ({
    ...challenge,
    categoryId: category.id,
  }));

  await db.insert(challenges).values(challengeData);

  console.log(`Seeded ${curlChallenges.length} curl challenges.`);
}

if (require.main === module) {
  seedCurlChallenges()
    .catch((error) => {
      console.error('Seed curl failed:', error);
      process.exit(1);
    })
    .finally(() => {
      console.log('Seed curl finished. Exiting...');
      process.exit(0);
    });
}
