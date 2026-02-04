export type Difficulty = "easy" | "medium" | "hard";

export interface Challenge {
  id: string;
  category: string;
  text: string;
  description: string;
  difficulty: Difficulty;
}

export const BUILTIN_CHALLENGES: Challenge[] = [
  // Git commands
  {
    id: "git-1",
    category: "git",
    text: "git add -A && git commit -m \"feat: add user authentication\"",
    description: "Stage all and commit with conventional message",
    difficulty: "medium",
  },
  {
    id: "git-2",
    category: "git",
    text: "git checkout -b feature/user-dashboard",
    description: "Create and switch to a new feature branch",
    difficulty: "easy",
  },
  {
    id: "git-3",
    category: "git",
    text: "git rebase -i HEAD~3",
    description: "Interactive rebase last 3 commits",
    difficulty: "easy",
  },
  {
    id: "git-4",
    category: "git",
    text: "git stash push -m \"wip: auth changes\" && git checkout main",
    description: "Stash work with message and switch to main",
    difficulty: "hard",
  },
  {
    id: "git-5",
    category: "git",
    text: "git log --oneline --graph --all",
    description: "View commit graph for all branches",
    difficulty: "easy",
  },

  // Terminal commands
  {
    id: "terminal-1",
    category: "terminal",
    text: "find . -name \"*.ts\" -not -path \"./node_modules/*\" | head -20",
    description: "Find TypeScript files excluding node_modules",
    difficulty: "hard",
  },
  {
    id: "terminal-2",
    category: "terminal",
    text: "docker compose up -d && docker compose logs -f",
    description: "Start containers detached and follow logs",
    difficulty: "medium",
  },
  {
    id: "terminal-3",
    category: "terminal",
    text: "curl -s https://api.example.com/health | jq '.status'",
    description: "Check API health endpoint with jq parsing",
    difficulty: "medium",
  },
  {
    id: "terminal-4",
    category: "terminal",
    text: "tar -czf backup.tar.gz --exclude=node_modules ./src",
    description: "Create compressed archive of src directory",
    difficulty: "medium",
  },
  {
    id: "terminal-5",
    category: "terminal",
    text: "ps aux | grep node | awk '{print $2}' | xargs kill -9",
    description: "Find and kill all node processes",
    difficulty: "hard",
  },

  // React patterns
  {
    id: "react-1",
    category: "react",
    text: "const [state, setState] = useState<string>('')",
    description: "Typed useState hook",
    difficulty: "easy",
  },
  {
    id: "react-2",
    category: "react",
    text: "useEffect(() => { fetchData(); return () => controller.abort(); }, [id])",
    description: "useEffect with cleanup and dependency",
    difficulty: "hard",
  },
  {
    id: "react-3",
    category: "react",
    text: "const value = useMemo(() => computeExpensive(items), [items])",
    description: "Memoize expensive computation",
    difficulty: "medium",
  },
  {
    id: "react-4",
    category: "react",
    text: "export default async function Page({ params }: { params: { id: string } }) {",
    description: "Next.js dynamic route server component",
    difficulty: "hard",
  },
  {
    id: "react-5",
    category: "react",
    text: "const router = useRouter(); router.push('/dashboard')",
    description: "Programmatic navigation with Next.js",
    difficulty: "easy",
  },

  // AI prompts
  {
    id: "ai-prompts-1",
    category: "ai-prompts",
    text: "You are a senior TypeScript developer. Review this code for bugs and suggest improvements.",
    description: "Code review system prompt",
    difficulty: "hard",
  },
  {
    id: "ai-prompts-2",
    category: "ai-prompts",
    text: "Explain this error message and provide a fix with code examples:",
    description: "Error debugging prompt",
    difficulty: "medium",
  },
  {
    id: "ai-prompts-3",
    category: "ai-prompts",
    text: "Write a unit test for this function using vitest. Cover edge cases.",
    description: "Test generation prompt",
    difficulty: "medium",
  },
  {
    id: "ai-prompts-4",
    category: "ai-prompts",
    text: "Refactor this component to use server actions instead of client-side API calls.",
    description: "Refactoring instruction prompt",
    difficulty: "hard",
  },
  {
    id: "ai-prompts-5",
    category: "ai-prompts",
    text: "Generate TypeScript types from this JSON response and create a Zod schema for validation.",
    description: "Type generation prompt",
    difficulty: "hard",
  },
];

export function getChallengesByCategory(category: string): Challenge[] {
  return BUILTIN_CHALLENGES.filter((c) => c.category === category);
}

export function getChallengesByDifficulty(difficulty: Difficulty): Challenge[] {
  return BUILTIN_CHALLENGES.filter((c) => c.difficulty === difficulty);
}

export function getRandomChallenge(category?: string, difficulty?: Difficulty): Challenge {
  let pool = category
    ? getChallengesByCategory(category)
    : BUILTIN_CHALLENGES;
  if (difficulty) {
    pool = pool.filter((c) => c.difficulty === difficulty);
  }
  if (pool.length === 0) {
    pool = category ? getChallengesByCategory(category) : BUILTIN_CHALLENGES;
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

export function getCategories(): string[] {
  return [...new Set(BUILTIN_CHALLENGES.map((c) => c.category))];
}

export function getDifficulties(): Difficulty[] {
  return ["easy", "medium", "hard"];
}
