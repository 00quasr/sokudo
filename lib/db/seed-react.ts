import { db } from './drizzle';
import { categories, challenges } from './schema';
import { eq } from 'drizzle-orm';

/**
 * React Patterns challenges covering hooks and component patterns:
 * useState, useEffect, useCallback, useMemo, useRef, component patterns
 *
 * 25 challenges total, varying in difficulty:
 * - beginner: simple hook declarations
 * - intermediate: hooks with dependencies and callbacks
 * - advanced: complex patterns and custom hooks
 */
export const reactChallenges = [
  // === useState (5 challenges) ===
  {
    content: 'const [count, setCount] = useState(0)',
    difficulty: 'beginner' as const,
    syntaxType: 'typescript' as const,
    hint: 'Initialize state with a number',
  },
  {
    content: 'const [name, setName] = useState("")',
    difficulty: 'beginner' as const,
    syntaxType: 'typescript' as const,
    hint: 'Initialize state with an empty string',
  },
  {
    content: 'const [isOpen, setIsOpen] = useState(false)',
    difficulty: 'beginner' as const,
    syntaxType: 'typescript' as const,
    hint: 'Initialize state with a boolean',
  },
  {
    content: 'const [items, setItems] = useState<string[]>([])',
    difficulty: 'intermediate' as const,
    syntaxType: 'typescript' as const,
    hint: 'Initialize typed array state',
  },
  {
    content: 'const [user, setUser] = useState<User | null>(null)',
    difficulty: 'intermediate' as const,
    syntaxType: 'typescript' as const,
    hint: 'Initialize nullable typed state',
  },

  // === useEffect (5 challenges) ===
  {
    content: 'useEffect(() => { }, [])',
    difficulty: 'beginner' as const,
    syntaxType: 'typescript' as const,
    hint: 'Effect that runs once on mount',
  },
  {
    content: 'useEffect(() => { }, [count])',
    difficulty: 'beginner' as const,
    syntaxType: 'typescript' as const,
    hint: 'Effect that runs when count changes',
  },
  {
    content: 'useEffect(() => { return () => { } }, [])',
    difficulty: 'intermediate' as const,
    syntaxType: 'typescript' as const,
    hint: 'Effect with cleanup function',
  },
  {
    content: 'useEffect(() => { fetchData() }, [id])',
    difficulty: 'intermediate' as const,
    syntaxType: 'typescript' as const,
    hint: 'Effect that fetches data when id changes',
  },
  {
    content: 'useEffect(() => { const sub = subscribe(); return () => sub.unsubscribe() }, [])',
    difficulty: 'advanced' as const,
    syntaxType: 'typescript' as const,
    hint: 'Effect with subscription cleanup',
  },

  // === useCallback (4 challenges) ===
  {
    content: 'const handleClick = useCallback(() => { }, [])',
    difficulty: 'beginner' as const,
    syntaxType: 'typescript' as const,
    hint: 'Memoize a click handler',
  },
  {
    content: 'const handleChange = useCallback((e) => setValue(e.target.value), [])',
    difficulty: 'intermediate' as const,
    syntaxType: 'typescript' as const,
    hint: 'Memoize an input change handler',
  },
  {
    content: 'const handleSubmit = useCallback(() => { onSubmit(data) }, [data, onSubmit])',
    difficulty: 'intermediate' as const,
    syntaxType: 'typescript' as const,
    hint: 'Memoize handler with dependencies',
  },
  {
    content: 'const debouncedSearch = useCallback(debounce((term) => search(term), 300), [])',
    difficulty: 'advanced' as const,
    syntaxType: 'typescript' as const,
    hint: 'Memoize a debounced search function',
  },

  // === useMemo (3 challenges) ===
  {
    content: 'const total = useMemo(() => items.reduce((a, b) => a + b, 0), [items])',
    difficulty: 'intermediate' as const,
    syntaxType: 'typescript' as const,
    hint: 'Memoize a computed sum',
  },
  {
    content: 'const filtered = useMemo(() => items.filter(i => i.active), [items])',
    difficulty: 'intermediate' as const,
    syntaxType: 'typescript' as const,
    hint: 'Memoize filtered array',
  },
  {
    content: 'const sorted = useMemo(() => [...items].sort((a, b) => a.name.localeCompare(b.name)), [items])',
    difficulty: 'advanced' as const,
    syntaxType: 'typescript' as const,
    hint: 'Memoize sorted array',
  },

  // === useRef (3 challenges) ===
  {
    content: 'const inputRef = useRef<HTMLInputElement>(null)',
    difficulty: 'beginner' as const,
    syntaxType: 'typescript' as const,
    hint: 'Create a ref for an input element',
  },
  {
    content: 'const countRef = useRef(0)',
    difficulty: 'beginner' as const,
    syntaxType: 'typescript' as const,
    hint: 'Create a ref to store a value',
  },
  {
    content: 'const prevValue = useRef(value); useEffect(() => { prevValue.current = value })',
    difficulty: 'advanced' as const,
    syntaxType: 'typescript' as const,
    hint: 'Track previous value with ref',
  },

  // === Component Patterns (5 challenges) ===
  {
    content: 'export function Button({ children, onClick }: ButtonProps) { return <button onClick={onClick}>{children}</button> }',
    difficulty: 'beginner' as const,
    syntaxType: 'typescript' as const,
    hint: 'Basic component with props',
  },
  {
    content: 'const [state, dispatch] = useReducer(reducer, initialState)',
    difficulty: 'intermediate' as const,
    syntaxType: 'typescript' as const,
    hint: 'Use reducer for complex state',
  },
  {
    content: 'const value = useContext(ThemeContext)',
    difficulty: 'beginner' as const,
    syntaxType: 'typescript' as const,
    hint: 'Consume context in a component',
  },
  {
    content: 'const Component = forwardRef<HTMLDivElement, Props>((props, ref) => <div ref={ref} {...props} />)',
    difficulty: 'advanced' as const,
    syntaxType: 'typescript' as const,
    hint: 'Forward ref to a DOM element',
  },
  {
    content: 'const MemoizedComponent = memo(({ data }: Props) => <div>{data}</div>)',
    difficulty: 'intermediate' as const,
    syntaxType: 'typescript' as const,
    hint: 'Memoize a component to prevent re-renders',
  },
];

export async function seedReactChallenges() {
  console.log('Seeding React Patterns challenges...');

  // Get the React Patterns category
  const [reactCategory] = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, 'react-patterns'))
    .limit(1);

  if (!reactCategory) {
    console.error('Error: React Patterns category not found. Run db:seed first.');
    process.exit(1);
  }

  const categoryId = reactCategory.id;

  // Insert challenges
  const challengeData = reactChallenges.map((challenge) => ({
    ...challenge,
    categoryId,
  }));

  await db.insert(challenges).values(challengeData);

  console.log(`Seeded ${reactChallenges.length} React Patterns challenges.`);
}

// Run if executed directly
if (require.main === module) {
  seedReactChallenges()
    .catch((error) => {
      console.error('Seed React failed:', error);
      process.exit(1);
    })
    .finally(() => {
      console.log('Seed React finished. Exiting...');
      process.exit(0);
    });
}
