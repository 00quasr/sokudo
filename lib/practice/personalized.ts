import type { WeaknessReport, WeakKey, CommonTypo } from '@/lib/weakness/analyze';
import type { SequenceErrorData } from '@/lib/db/queries';

/**
 * Generates personalized practice content based on user error patterns.
 * Uses weakness analysis data to create targeted exercises that emphasize
 * the user's specific problem areas: weak keys, common typos, and
 * problem character sequences.
 */

export type FocusArea = 'weak-keys' | 'common-typos' | 'slow-keys' | 'problem-sequences' | 'mixed';

export interface PersonalizedChallenge {
  content: string;
  focusArea: FocusArea;
  targetKeys: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  hint: string;
}

export interface PersonalizedPracticeSet {
  challenges: PersonalizedChallenge[];
  summary: string;
}

// Word banks organized by common keys they exercise
const WORD_BANK: Record<string, string[]> = {
  a: ['attach', 'array', 'abstract', 'async', 'await', 'alias', 'apply', 'assert', 'allocate', 'api'],
  b: ['break', 'boolean', 'buffer', 'branch', 'build', 'bind', 'batch', 'binary', 'block', 'byte'],
  c: ['const', 'class', 'catch', 'console', 'commit', 'cache', 'clone', 'config', 'create', 'close'],
  d: ['delete', 'default', 'debug', 'deploy', 'diff', 'docker', 'domain', 'driver', 'drop', 'data'],
  e: ['export', 'extends', 'error', 'event', 'enum', 'exec', 'encode', 'element', 'emit', 'exit'],
  f: ['function', 'filter', 'fetch', 'find', 'format', 'fork', 'flag', 'float', 'flush', 'file'],
  g: ['git', 'global', 'grep', 'group', 'guard', 'generate', 'gateway', 'generic', 'graph', 'get'],
  h: ['hash', 'handle', 'header', 'hook', 'host', 'http', 'handler', 'hidden', 'heap', 'html'],
  i: ['import', 'interface', 'index', 'init', 'install', 'input', 'inject', 'iterate', 'int', 'if'],
  j: ['json', 'join', 'jest', 'jsx', 'job', 'journal', 'jump', 'justify'],
  k: ['key', 'kernel', 'kill', 'kind', 'kubectl', 'keyof', 'keypress', 'keep'],
  l: ['let', 'list', 'log', 'loop', 'lint', 'load', 'lock', 'listen', 'length', 'link'],
  m: ['map', 'merge', 'module', 'mock', 'mkdir', 'method', 'memory', 'mutex', 'model', 'main'],
  n: ['null', 'new', 'next', 'node', 'name', 'npm', 'number', 'notify', 'network', 'never'],
  o: ['object', 'output', 'option', 'origin', 'override', 'observe', 'open', 'order', 'omit'],
  p: ['push', 'pull', 'parse', 'promise', 'pipe', 'port', 'proxy', 'patch', 'print', 'path'],
  q: ['query', 'queue', 'quiet', 'quote', 'quick'],
  r: ['return', 'reduce', 'render', 'rebase', 'route', 'request', 'response', 'require', 'run', 'read'],
  s: ['string', 'switch', 'static', 'super', 'select', 'stash', 'status', 'server', 'spawn', 'set'],
  t: ['type', 'throw', 'then', 'test', 'true', 'try', 'token', 'table', 'target', 'thread'],
  u: ['undefined', 'update', 'union', 'use', 'user', 'upload', 'util', 'unix', 'url', 'unlock'],
  v: ['var', 'void', 'value', 'version', 'verify', 'virtual', 'volume', 'verbose', 'valid', 'view'],
  w: ['while', 'write', 'watch', 'window', 'webpack', 'worker', 'wrap', 'warning', 'wait', 'wasm'],
  x: ['export', 'extend', 'xml', 'xargs', 'exec'],
  y: ['yield', 'yarn', 'yaml'],
  z: ['zod', 'zone', 'zero', 'zip'],
};

// Command/code snippets that emphasize specific character patterns
const SNIPPET_TEMPLATES: Record<string, string[]> = {
  // Special characters that are often problematic
  'special-brackets': [
    'const arr = [1, 2, 3];',
    'function add(a: number, b: number) { return a + b; }',
    'const obj = { key: "value" };',
    'if (x > 0) { console.log(x); }',
    'type Props = { name: string; age: number };',
    'const [first, ...rest] = items;',
    'export default function App() { return <div />; }',
  ],
  'special-symbols': [
    'git commit -m "feat: add feature"',
    'const url = `https://${host}:${port}/api`;',
    'npm install --save-dev @types/node',
    'grep -rn "TODO" ./src/**/*.ts',
    'docker run -p 3000:3000 --name app',
    'export PATH=$HOME/.local/bin:$PATH',
    'curl -X POST -H "Content-Type: application/json"',
  ],
  'special-operators': [
    'const result = a ?? b;',
    'const value = obj?.nested?.prop;',
    'type Partial<T> = { [K in keyof T]?: T[K] };',
    'const fn = (x: number) => x * 2;',
    'if (a === b && c !== d) { }',
    'const spread = { ...defaults, ...overrides };',
    'export type Result<T> = T | Error;',
  ],
};

// Phrases that exercise common bigrams/trigrams
const SEQUENCE_PHRASES: Record<string, string[]> = {
  th: ['the', 'this', 'that', 'then', 'throw', 'thread', 'throttle', 'threshold'],
  er: ['server', 'error', 'filter', 'render', 'worker', 'handler', 'trigger', 'merger'],
  in: ['string', 'index', 'input', 'install', 'inject', 'inline', 'interval', 'initial'],
  on: ['function', 'const', 'config', 'console', 'connect', 'condition', 'constructor'],
  an: ['handler', 'instance', 'branch', 'command', 'channel', 'cancel', 'sandbox'],
  re: ['return', 'require', 'reduce', 'request', 'response', 'remove', 'release', 'reset'],
  st: ['const', 'static', 'string', 'status', 'stream', 'strict', 'structure', 'store'],
  en: ['event', 'entry', 'enable', 'encode', 'encrypt', 'engine', 'endpoint', 'enum'],
  ou: ['route', 'output', 'source', 'count', 'mount', 'group', 'found', 'bound'],
  or: ['export', 'import', 'format', 'order', 'origin', 'error', 'worker', 'record'],
  ng: ['string', 'warning', 'loading', 'pending', 'binding', 'running', 'setting'],
  io: ['action', 'option', 'session', 'version', 'function', 'condition', 'collection'],
  it: ['commit', 'exit', 'emit', 'iterate', 'switch', 'split', 'submit', 'visit'],
  al: ['global', 'local', 'virtual', 'signal', 'final', 'initial', 'install', 'equal'],
  ar: ['array', 'parse', 'start', 'target', 'declare', 'variable', 'guard'],
  le: ['delete', 'module', 'handle', 'table', 'file', 'while', 'compile', 'resolve'],
  se: ['set', 'select', 'server', 'session', 'false', 'response', 'base', 'close'],
  co: ['const', 'config', 'console', 'commit', 'connect', 'component', 'context', 'core'],
};

const MIN_CHALLENGE_LENGTH = 20;
const MAX_CHALLENGE_LENGTH = 200;

export function generatePersonalizedPractice(
  report: WeaknessReport,
  options: { maxChallenges?: number } = {}
): PersonalizedPracticeSet {
  const { maxChallenges = 5 } = options;
  const challenges: PersonalizedChallenge[] = [];

  // Generate challenges based on weakness priorities
  if (report.weakestKeys.length > 0) {
    challenges.push(...generateWeakKeysChallenges(report.weakestKeys, 2));
  }

  if (report.commonTypos.length > 0) {
    challenges.push(...generateTypoChallenges(report.commonTypos, 1));
  }

  if (report.problemSequences.length > 0) {
    challenges.push(...generateSequenceChallenges(report.problemSequences, 1));
  }

  if (report.slowestKeys.length > 0) {
    challenges.push(...generateSlowKeysChallenges(report.slowestKeys, 1));
  }

  // If we have weaknesses but fewer challenges than max, add a mixed challenge
  if (challenges.length > 0 && challenges.length < maxChallenges) {
    challenges.push(generateMixedChallenge(report));
  }

  // If no weaknesses detected, provide general practice
  if (challenges.length === 0) {
    challenges.push({
      content: 'const result = await fetch("/api/data").then(res => res.json());',
      focusArea: 'mixed',
      targetKeys: [],
      difficulty: 'intermediate',
      hint: 'No specific weaknesses detected yet. Keep practicing to build your profile!',
    });
  }

  const trimmed = challenges.slice(0, maxChallenges);

  return {
    challenges: trimmed,
    summary: buildSummary(report, trimmed),
  };
}

function generateWeakKeysChallenges(
  weakKeys: WeakKey[],
  count: number
): PersonalizedChallenge[] {
  const challenges: PersonalizedChallenge[] = [];
  const topWeakKeys = weakKeys.slice(0, 6);
  const targetKeyChars = topWeakKeys.map((k) => k.key.toLowerCase());

  for (let i = 0; i < count && i < Math.ceil(topWeakKeys.length / 3); i++) {
    const keysForThis = targetKeyChars.slice(i * 3, (i + 1) * 3);
    const content = buildContentForKeys(keysForThis);

    if (content.length >= MIN_CHALLENGE_LENGTH) {
      const worstAccuracy = topWeakKeys[i * 3]?.accuracy ?? 0;
      challenges.push({
        content: trimToMaxLength(content),
        focusArea: 'weak-keys',
        targetKeys: keysForThis,
        difficulty: worstAccuracy < 70 ? 'beginner' : 'intermediate',
        hint: `Practice keys: ${keysForThis.map(formatKeyForHint).join(', ')} (lowest accuracy: ${worstAccuracy}%)`,
      });
    }
  }

  return challenges;
}

function generateTypoChallenges(
  typos: CommonTypo[],
  count: number
): PersonalizedChallenge[] {
  const challenges: PersonalizedChallenge[] = [];
  const topTypos = typos.slice(0, 6);

  // Group typos by expected character
  const typoKeys = [...new Set(topTypos.map((t) => t.expected.toLowerCase()))];
  const content = buildContentForKeys(typoKeys);

  if (content.length >= MIN_CHALLENGE_LENGTH) {
    const typoDescriptions = topTypos
      .slice(0, 3)
      .map((t) => `${formatKeyForHint(t.expected)}→${formatKeyForHint(t.actual)}`)
      .join(', ');

    challenges.push({
      content: trimToMaxLength(content),
      focusArea: 'common-typos',
      targetKeys: typoKeys,
      difficulty: 'intermediate',
      hint: `Focus on common typos: ${typoDescriptions}`,
    });
  }

  return challenges.slice(0, count);
}

function generateSequenceChallenges(
  sequences: SequenceErrorData[],
  count: number
): PersonalizedChallenge[] {
  const challenges: PersonalizedChallenge[] = [];
  const topSequences = sequences.slice(0, 4);

  const words: string[] = [];
  for (const seq of topSequences) {
    const seqLower = seq.sequence.toLowerCase();
    const phraseList = SEQUENCE_PHRASES[seqLower];
    if (phraseList) {
      words.push(...phraseList.slice(0, 4));
    } else {
      // Build words containing this sequence from the general word bank
      for (const wordList of Object.values(WORD_BANK)) {
        for (const word of wordList) {
          if (word.includes(seqLower) && !words.includes(word)) {
            words.push(word);
            if (words.length >= 12) break;
          }
        }
        if (words.length >= 12) break;
      }
    }
  }

  if (words.length >= 3) {
    const content = words.slice(0, 10).join(' ');
    const seqNames = topSequences.map((s) => `"${s.sequence}"`).join(', ');

    challenges.push({
      content: trimToMaxLength(content),
      focusArea: 'problem-sequences',
      targetKeys: topSequences.map((s) => s.sequence),
      difficulty: topSequences[0].errorRate > 30 ? 'beginner' : 'intermediate',
      hint: `Practice sequences: ${seqNames} (error rates: ${topSequences.map((s) => `${s.errorRate}%`).join(', ')})`,
    });
  }

  return challenges.slice(0, count);
}

function generateSlowKeysChallenges(
  slowKeys: Array<{ key: string; avgLatencyMs: number; totalPresses: number; accuracy: number }>,
  count: number
): PersonalizedChallenge[] {
  const challenges: PersonalizedChallenge[] = [];
  const topSlow = slowKeys.slice(0, 6);
  const targetKeyChars = topSlow.map((k) => k.key.toLowerCase());

  const content = buildContentForKeys(targetKeyChars);

  if (content.length >= MIN_CHALLENGE_LENGTH) {
    challenges.push({
      content: trimToMaxLength(content),
      focusArea: 'slow-keys',
      targetKeys: targetKeyChars,
      difficulty: 'intermediate',
      hint: `Speed up keys: ${targetKeyChars.map(formatKeyForHint).join(', ')} (avg latency: ${topSlow[0].avgLatencyMs}ms)`,
    });
  }

  return challenges.slice(0, count);
}

function generateMixedChallenge(report: WeaknessReport): PersonalizedChallenge {
  const allTargetKeys: string[] = [];

  // Take top 2 from each category
  for (const wk of report.weakestKeys.slice(0, 2)) {
    allTargetKeys.push(wk.key.toLowerCase());
  }
  for (const sk of report.slowestKeys.slice(0, 2)) {
    if (!allTargetKeys.includes(sk.key.toLowerCase())) {
      allTargetKeys.push(sk.key.toLowerCase());
    }
  }

  // Check if we should include special char exercises
  const hasSpecialCharIssues = report.weakestKeys.some(
    (k) => !k.key.match(/^[a-zA-Z0-9]$/)
  );

  let content: string;
  if (hasSpecialCharIssues) {
    const templates = [
      ...SNIPPET_TEMPLATES['special-brackets'],
      ...SNIPPET_TEMPLATES['special-symbols'],
      ...SNIPPET_TEMPLATES['special-operators'],
    ];
    // Pick snippets that contain target keys
    const matching = templates.filter((t) =>
      allTargetKeys.some((k) => t.includes(k))
    );
    content = (matching.length > 0 ? matching : templates).slice(0, 2).join('\n');
  } else {
    content = buildContentForKeys(allTargetKeys);
  }

  return {
    content: trimToMaxLength(content.length >= MIN_CHALLENGE_LENGTH ? content : buildContentForKeys(allTargetKeys)),
    focusArea: 'mixed',
    targetKeys: allTargetKeys,
    difficulty: 'advanced',
    hint: 'Mixed practice targeting your overall weak areas',
  };
}

function buildContentForKeys(keys: string[]): string {
  const words: string[] = [];
  const usedWords = new Set<string>();

  for (const key of keys) {
    const keyLower = key.toLowerCase();
    const wordList = WORD_BANK[keyLower];
    if (wordList) {
      for (const word of wordList) {
        if (!usedWords.has(word)) {
          words.push(word);
          usedWords.add(word);
          if (words.length >= 15) break;
        }
      }
    }
  }

  // If we don't have enough words from direct key matching,
  // find words from any bank that contain the target keys
  if (words.length < 5) {
    for (const key of keys) {
      const keyLower = key.toLowerCase();
      for (const wordList of Object.values(WORD_BANK)) {
        for (const word of wordList) {
          if (word.includes(keyLower) && !usedWords.has(word)) {
            words.push(word);
            usedWords.add(word);
          }
          if (words.length >= 15) break;
        }
        if (words.length >= 15) break;
      }
    }
  }

  // Shuffle deterministically based on key combo to provide variety
  const seed = keys.join('').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const shuffled = seededShuffle(words, seed);

  return shuffled.join(' ');
}

function seededShuffle<T>(array: T[], seed: number): T[] {
  const result = [...array];
  let s = seed;
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function trimToMaxLength(content: string): string {
  if (content.length <= MAX_CHALLENGE_LENGTH) return content;

  // Trim at a word boundary
  const trimmed = content.slice(0, MAX_CHALLENGE_LENGTH);
  const lastSpace = trimmed.lastIndexOf(' ');
  return lastSpace > MIN_CHALLENGE_LENGTH ? trimmed.slice(0, lastSpace) : trimmed;
}

function formatKeyForHint(key: string): string {
  if (key === ' ') return 'Space';
  if (key === '\t') return 'Tab';
  if (key === '\n') return 'Enter';
  if (key.length === 1) return `"${key}"`;
  return `"${key}"`;
}

function buildSummary(
  report: WeaknessReport,
  challenges: PersonalizedChallenge[]
): string {
  const parts: string[] = [];

  const weakKeyCount = report.weakestKeys.filter((k) => k.accuracy < 90).length;
  if (weakKeyCount > 0) {
    parts.push(`${weakKeyCount} key${weakKeyCount > 1 ? 's' : ''} below 90% accuracy`);
  }

  if (report.commonTypos.length > 0) {
    parts.push(`${report.commonTypos.length} common typo pattern${report.commonTypos.length > 1 ? 's' : ''}`);
  }

  const problemSeqCount = report.problemSequences.filter((s) => s.errorRate >= 20).length;
  if (problemSeqCount > 0) {
    parts.push(`${problemSeqCount} problem sequence${problemSeqCount > 1 ? 's' : ''}`);
  }

  if (parts.length === 0) {
    return 'No significant weaknesses detected. Keep practicing!';
  }

  return `Personalized practice targeting: ${parts.join(', ')}. ${challenges.length} exercise${challenges.length > 1 ? 's' : ''} generated.`;
}

/**
 * Build a prompt for AI to generate challenges targeting specific weaknesses.
 * Exported for testing.
 */
export function buildAIPromptForWeaknesses(
  report: WeaknessReport,
  options: { count?: number; focusArea?: FocusArea } = {}
): string {
  const { count = 5, focusArea } = options;
  const parts: string[] = [];

  parts.push(
    `Generate ${count} typing practice challenges for a developer typing trainer.`,
    'Each challenge should be a realistic code snippet, terminal command, or git command that developers actually type.',
    ''
  );

  // Add weakness context
  parts.push('The user has the following typing weaknesses that the challenges should target:');
  parts.push('');

  if ((!focusArea || focusArea === 'weak-keys') && report.weakestKeys.length > 0) {
    const weakKeys = report.weakestKeys.slice(0, 5);
    parts.push('Weak keys (low accuracy):');
    for (const k of weakKeys) {
      parts.push(`- Key "${formatKeyForHint(k.key)}": ${k.accuracy}% accuracy (${k.totalPresses} presses)`);
    }
    parts.push('');
  }

  if ((!focusArea || focusArea === 'common-typos') && report.commonTypos.length > 0) {
    const typos = report.commonTypos.slice(0, 5);
    parts.push('Common typo patterns (frequently confused keys):');
    for (const t of typos) {
      parts.push(`- Types "${formatKeyForHint(t.actual)}" instead of "${formatKeyForHint(t.expected)}" (${t.count} times)`);
    }
    parts.push('');
  }

  if ((!focusArea || focusArea === 'slow-keys') && report.slowestKeys.length > 0) {
    const slowKeys = report.slowestKeys.slice(0, 5);
    parts.push('Slow keys (high latency):');
    for (const k of slowKeys) {
      parts.push(`- Key "${formatKeyForHint(k.key)}": avg ${k.avgLatencyMs}ms latency`);
    }
    parts.push('');
  }

  if ((!focusArea || focusArea === 'problem-sequences') && report.problemSequences.length > 0) {
    const seqs = report.problemSequences.slice(0, 5);
    parts.push('Problem character sequences:');
    for (const s of seqs) {
      parts.push(`- Sequence "${s.sequence}": ${s.errorRate}% error rate (${s.totalAttempts} attempts)`);
    }
    parts.push('');
  }

  parts.push(
    'Requirements:',
    '- Each challenge MUST heavily feature the weak keys/sequences listed above',
    '- Content must be syntactically correct code/commands',
    '- Mix of difficulties: beginner (under 60 chars), intermediate (60-120 chars), advanced (100-200 chars)',
    '- Include realistic developer typing like git commands, TypeScript code, React patterns, terminal commands',
    '- Hints should explain what weakness area the challenge targets',
    '- Do not include line numbers or markdown formatting',
    '- For multi-line content, use \\n for newlines',
    '- No duplicate challenges',
    '',
    'For each challenge, set the focusArea to one of: weak-keys, common-typos, slow-keys, problem-sequences, mixed',
    'Set targetKeys to an array of the specific keys/sequences that challenge targets.',
    '',
    'Respond with valid JSON only, in this exact format:',
    '{"challenges": [{"content": "...", "focusArea": "weak-keys|common-typos|slow-keys|problem-sequences|mixed", "targetKeys": ["a", "b"], "difficulty": "beginner|intermediate|advanced", "hint": "..."}]}'
  );

  return parts.join('\n');
}

/**
 * Attempt to generate personalized challenges using AI, falling back to static generation.
 * This function requires the AI provider to be configured (ANTHROPIC_API_KEY or OPENAI_API_KEY).
 */
export async function generateAIPersonalizedPractice(
  report: WeaknessReport,
  options: { maxChallenges?: number; focusArea?: FocusArea } = {}
): Promise<PersonalizedPracticeSet> {
  const { maxChallenges = 5, focusArea } = options;

  // Dynamic import to avoid requiring AI config for static generation
  const { callAI } = await import('@/lib/ai/provider');

  const prompt = buildAIPromptForWeaknesses(report, { count: maxChallenges, focusArea });
  const responseText = await callAI(prompt);

  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('AI response did not contain valid JSON');
  }

  const parsed = JSON.parse(jsonMatch[0]) as { challenges: PersonalizedChallenge[] };

  if (!parsed.challenges || !Array.isArray(parsed.challenges)) {
    throw new Error('AI response did not contain challenges array');
  }

  const validFocusAreas: FocusArea[] = ['weak-keys', 'common-typos', 'slow-keys', 'problem-sequences', 'mixed'];
  const validDifficulties = ['beginner', 'intermediate', 'advanced'] as const;

  const challenges: PersonalizedChallenge[] = parsed.challenges
    .slice(0, maxChallenges)
    .map((c) => ({
      content: String(c.content || '').slice(0, MAX_CHALLENGE_LENGTH),
      focusArea: validFocusAreas.includes(c.focusArea) ? c.focusArea : 'mixed',
      targetKeys: Array.isArray(c.targetKeys) ? c.targetKeys.map(String) : [],
      difficulty: validDifficulties.includes(c.difficulty) ? c.difficulty : 'intermediate',
      hint: String(c.hint || ''),
    }))
    .filter((c) => c.content.length >= MIN_CHALLENGE_LENGTH);

  if (challenges.length === 0) {
    throw new Error('AI generated no valid challenges');
  }

  return {
    challenges,
    summary: buildSummary(report, challenges),
  };
}
