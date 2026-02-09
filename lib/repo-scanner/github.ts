import { z } from 'zod';

// GitHub API response schemas
const repoMetadataSchema = z.object({
  id: z.number(),
  name: z.string(),
  full_name: z.string(),
  owner: z.object({
    login: z.string(),
  }),
  description: z.string().nullable(),
  default_branch: z.string(),
  private: z.boolean(),
  html_url: z.string(),
});

const treeItemSchema = z.object({
  path: z.string(),
  mode: z.string(),
  type: z.enum(['blob', 'tree']),
  sha: z.string(),
  size: z.number().optional(),
  url: z.string().optional(),
});

const treeResponseSchema = z.object({
  sha: z.string(),
  url: z.string(),
  tree: z.array(treeItemSchema),
  truncated: z.boolean(),
});

export type RepoMetadata = z.infer<typeof repoMetadataSchema>;
export type TreeItem = z.infer<typeof treeItemSchema>;
export type TreeResponse = z.infer<typeof treeResponseSchema>;

// Files we want to scan for commands
const TARGET_FILES = [
  'package.json',
  'Makefile',
  'Dockerfile',
  'docker-compose.yml',
  'docker-compose.yaml',
  'README.md',
  'CONTRIBUTING.md',
];

const TARGET_PATTERNS = [
  /^\.github\/workflows\/.*\.ya?ml$/,
  /^bin\/.*/,
  /^scripts\/.*/,
];

export interface GitHubClient {
  getRepoMetadata(owner: string, repo: string): Promise<RepoMetadata>;
  getFileTree(owner: string, repo: string, branch: string): Promise<TreeItem[]>;
  getFileContent(owner: string, repo: string, path: string, branch: string): Promise<string>;
  getTargetFiles(owner: string, repo: string, branch: string): Promise<{ path: string; content: string }[]>;
}

interface GitHubClientOptions {
  accessToken?: string;
}

/**
 * Parse a GitHub URL into owner and repo name
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  // Match patterns like:
  // - https://github.com/owner/repo
  // - https://github.com/owner/repo.git
  // - github.com/owner/repo
  // - git@github.com:owner/repo.git
  const patterns = [
    /^(?:https?:\/\/)?github\.com\/([^\/]+)\/([^\/\.]+)(?:\.git)?$/,
    /^git@github\.com:([^\/]+)\/([^\/\.]+)(?:\.git)?$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return { owner: match[1], repo: match[2] };
    }
  }

  return null;
}

/**
 * Check if a file path matches our target files for scanning
 */
function isTargetFile(path: string): boolean {
  // Check exact matches
  const filename = path.split('/').pop() || '';
  if (TARGET_FILES.includes(filename)) {
    return true;
  }

  // Check pattern matches
  for (const pattern of TARGET_PATTERNS) {
    if (pattern.test(path)) {
      return true;
    }
  }

  return false;
}

/**
 * Create a GitHub API client
 */
export function createGitHubClient(options: GitHubClientOptions = {}): GitHubClient {
  const { accessToken } = options;

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'Hayaku-Repo-Scanner',
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  async function fetchGitHub<T>(url: string, schema: z.ZodType<T>): Promise<T> {
    const response = await fetch(url, { headers });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Repository not found or not accessible');
      }
      if (response.status === 403) {
        const remaining = response.headers.get('x-ratelimit-remaining');
        if (remaining === '0') {
          throw new Error('GitHub API rate limit exceeded. Please try again later.');
        }
        throw new Error('Access denied. The repository may be private.');
      }
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return schema.parse(data);
  }

  async function getRepoMetadata(owner: string, repo: string): Promise<RepoMetadata> {
    const url = `https://api.github.com/repos/${owner}/${repo}`;
    return fetchGitHub(url, repoMetadataSchema);
  }

  async function getFileTree(owner: string, repo: string, branch: string): Promise<TreeItem[]> {
    const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
    const response = await fetchGitHub(url, treeResponseSchema);
    return response.tree.filter((item) => item.type === 'blob');
  }

  async function getFileContent(
    owner: string,
    repo: string,
    path: string,
    branch: string
  ): Promise<string> {
    // Use raw.githubusercontent.com for public repos (no rate limit)
    // For private repos with auth, use API
    if (accessToken) {
      const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${path}`);
      }

      const data = await response.json();

      if (data.encoding === 'base64' && data.content) {
        return Buffer.from(data.content, 'base64').toString('utf-8');
      }

      throw new Error(`Unexpected content encoding for file: ${path}`);
    }

    // Public repo - use raw.githubusercontent.com
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
    const response = await fetch(rawUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${path}`);
    }

    return response.text();
  }

  async function getTargetFiles(
    owner: string,
    repo: string,
    branch: string
  ): Promise<{ path: string; content: string }[]> {
    const tree = await getFileTree(owner, repo, branch);
    const targetFiles = tree.filter((item) => isTargetFile(item.path));

    const results: { path: string; content: string }[] = [];

    // Fetch files in parallel with concurrency limit
    const CONCURRENCY = 5;
    for (let i = 0; i < targetFiles.length; i += CONCURRENCY) {
      const batch = targetFiles.slice(i, i + CONCURRENCY);
      const contents = await Promise.allSettled(
        batch.map(async (file) => ({
          path: file.path,
          content: await getFileContent(owner, repo, file.path, branch),
        }))
      );

      for (const result of contents) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        }
      }
    }

    return results;
  }

  return {
    getRepoMetadata,
    getFileTree,
    getFileContent,
    getTargetFiles,
  };
}
