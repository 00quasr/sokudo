'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';

export type SyntaxType =
  | 'plain'
  | 'git'
  | 'shell'
  | 'react'
  | 'typescript'
  | 'docker'
  | 'sql'
  | 'npm'
  | 'yarn'
  | 'pnpm';

export interface CharacterState {
  isTyped: boolean;
  isCurrent: boolean;
  hasError: boolean;
  errorChar?: string;
}

export interface TypingAreaProps {
  text: string;
  syntaxType?: SyntaxType;
  cursorPosition?: number;
  errors?: Map<number, string>;
  className?: string;
  showCursor?: boolean;
  fontSize?: 'base' | 'lg' | 'xl' | '2xl';
}

interface TokenStyle {
  color: string;
  fontWeight?: string;
}

interface Token {
  text: string;
  style: TokenStyle;
}

// Theme-aware syntax colors using semantic color names
// These will adapt based on whether dark or light mode is active
const SYNTAX_PATTERNS: Record<SyntaxType, { patterns: [RegExp, TokenStyle][]; defaultStyle: TokenStyle }> = {
  plain: {
    patterns: [],
    defaultStyle: { color: 'text-foreground' },
  },
  git: {
    patterns: [
      // Commands - using violet which works in both themes
      [/^(git)\b/, { color: 'text-violet-600 dark:text-violet-400', fontWeight: 'font-bold' }],
      // Subcommands - using blue
      [/\b(commit|push|pull|merge|rebase|checkout|branch|clone|init|add|status|log|diff|reset|stash|fetch|remote|tag|cherry-pick|bisect|blame|show|describe|archive)\b/, { color: 'text-blue-600 dark:text-blue-400' }],
      // Flags - using cyan
      [/\s(-{1,2}[\w-]+)/, { color: 'text-cyan-600 dark:text-cyan-400' }],
      // Strings (quoted) - using green
      [/"[^"]*"/, { color: 'text-green-600 dark:text-green-400' }],
      [/'[^']*'/, { color: 'text-green-600 dark:text-green-400' }],
      // Branch names / refs - using amber
      [/\b(main|master|HEAD|origin|upstream)\b/, { color: 'text-amber-600 dark:text-amber-400' }],
    ],
    defaultStyle: { color: 'text-muted-foreground' },
  },
  shell: {
    patterns: [
      // Common commands
      [/^(cd|ls|pwd|mkdir|rm|cp|mv|cat|echo|grep|find|chmod|chown|sudo|curl|wget|tar|zip|unzip|ssh|scp)\b/, { color: 'text-violet-600 dark:text-violet-400', fontWeight: 'font-bold' }],
      // Flags
      [/\s(-{1,2}[\w-]+)/, { color: 'text-cyan-600 dark:text-cyan-400' }],
      // Environment variables
      [/\$[\w_]+/, { color: 'text-amber-600 dark:text-amber-400' }],
      // Strings
      [/"[^"]*"/, { color: 'text-green-600 dark:text-green-400' }],
      [/'[^']*'/, { color: 'text-green-600 dark:text-green-400' }],
      // Paths
      [/(?:^|\s)(\/[\w./-]+|\.\/[\w./-]+|~\/[\w./-]+)/, { color: 'text-orange-600 dark:text-orange-400' }],
      // Pipes and redirects
      [/[|><&]+/, { color: 'text-pink-600 dark:text-pink-400' }],
    ],
    defaultStyle: { color: 'text-muted-foreground' },
  },
  react: {
    patterns: [
      // Keywords
      [/\b(import|export|from|const|let|var|function|return|if|else|for|while|class|extends|default|async|await)\b/, { color: 'text-violet-600 dark:text-violet-400', fontWeight: 'font-bold' }],
      // React specific
      [/\b(useState|useEffect|useCallback|useMemo|useRef|useContext|useReducer|memo|forwardRef|createContext|Fragment)\b/, { color: 'text-cyan-600 dark:text-cyan-400' }],
      // JSX tags
      [/<\/?[\w.]+/, { color: 'text-blue-600 dark:text-blue-400' }],
      // Strings
      [/"[^"]*"/, { color: 'text-green-600 dark:text-green-400' }],
      [/'[^']*'/, { color: 'text-green-600 dark:text-green-400' }],
      [/`[^`]*`/, { color: 'text-green-600 dark:text-green-400' }],
      // Types
      [/\b(string|number|boolean|any|void|null|undefined|never|object|Array|Promise|React)\b/, { color: 'text-amber-600 dark:text-amber-400' }],
      // Arrow functions
      [/=>/, { color: 'text-pink-600 dark:text-pink-400' }],
    ],
    defaultStyle: { color: 'text-muted-foreground' },
  },
  typescript: {
    patterns: [
      // Keywords
      [/\b(import|export|from|const|let|var|function|return|if|else|for|while|class|extends|implements|interface|type|enum|namespace|module|declare|abstract|readonly|public|private|protected|static|async|await|default)\b/, { color: 'text-violet-600 dark:text-violet-400', fontWeight: 'font-bold' }],
      // Types
      [/\b(string|number|boolean|any|void|null|undefined|never|object|unknown|Array|Promise|Record|Partial|Required|Pick|Omit)\b/, { color: 'text-amber-600 dark:text-amber-400' }],
      // Generics
      [/<[\w, ]+>/, { color: 'text-cyan-600 dark:text-cyan-400' }],
      // Strings
      [/"[^"]*"/, { color: 'text-green-600 dark:text-green-400' }],
      [/'[^']*'/, { color: 'text-green-600 dark:text-green-400' }],
      // Arrow functions
      [/=>/, { color: 'text-pink-600 dark:text-pink-400' }],
      // Decorators
      [/@\w+/, { color: 'text-orange-600 dark:text-orange-400' }],
    ],
    defaultStyle: { color: 'text-muted-foreground' },
  },
  docker: {
    patterns: [
      // Dockerfile instructions
      [/^(FROM|RUN|CMD|LABEL|MAINTAINER|EXPOSE|ENV|ADD|COPY|ENTRYPOINT|VOLUME|USER|WORKDIR|ARG|ONBUILD|STOPSIGNAL|HEALTHCHECK|SHELL)\b/, { color: 'text-violet-600 dark:text-violet-400', fontWeight: 'font-bold' }],
      // Docker CLI
      [/^(docker)\b/, { color: 'text-violet-600 dark:text-violet-400', fontWeight: 'font-bold' }],
      [/\b(build|run|push|pull|exec|logs|ps|stop|start|rm|rmi|images|network|volume|compose|container|image)\b/, { color: 'text-blue-600 dark:text-blue-400' }],
      // Flags
      [/\s(-{1,2}[\w-]+)/, { color: 'text-cyan-600 dark:text-cyan-400' }],
      // Strings
      [/"[^"]*"/, { color: 'text-green-600 dark:text-green-400' }],
      // Environment variables
      [/\$[\w_{}]+/, { color: 'text-amber-600 dark:text-amber-400' }],
      // Ports
      [/\b\d+:\d+\b/, { color: 'text-orange-600 dark:text-orange-400' }],
    ],
    defaultStyle: { color: 'text-muted-foreground' },
  },
  sql: {
    patterns: [
      // Keywords
      [/\b(SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|ON|AND|OR|NOT|IN|IS|NULL|AS|ORDER|BY|GROUP|HAVING|LIMIT|OFFSET|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|DROP|ALTER|TABLE|INDEX|VIEW|TRIGGER|PROCEDURE|FUNCTION|DATABASE|SCHEMA|PRIMARY|FOREIGN|KEY|REFERENCES|UNIQUE|CHECK|DEFAULT|CONSTRAINT|CASCADE|TRUNCATE|DISTINCT|UNION|ALL|EXISTS|BETWEEN|LIKE|CASE|WHEN|THEN|ELSE|END|COUNT|SUM|AVG|MIN|MAX|COALESCE|NULLIF|CAST)\b/i, { color: 'text-violet-600 dark:text-violet-400', fontWeight: 'font-bold' }],
      // Strings
      [/'[^']*'/, { color: 'text-green-600 dark:text-green-400' }],
      // Numbers
      [/\b\d+\b/, { color: 'text-orange-600 dark:text-orange-400' }],
      // Operators
      [/[=<>!]+/, { color: 'text-pink-600 dark:text-pink-400' }],
      // Wildcards
      [/\*/, { color: 'text-amber-600 dark:text-amber-400' }],
    ],
    defaultStyle: { color: 'text-muted-foreground' },
  },
  npm: {
    patterns: [
      [/^(npm)\b/, { color: 'text-violet-600 dark:text-violet-400', fontWeight: 'font-bold' }],
      [/\b(install|uninstall|update|init|run|start|test|build|publish|link|pack|ci|audit|outdated|ls|list|search|view|info|exec|npx)\b/, { color: 'text-blue-600 dark:text-blue-400' }],
      [/\s(-{1,2}[\w-]+)/, { color: 'text-cyan-600 dark:text-cyan-400' }],
      [/@[\w/-]+/, { color: 'text-amber-600 dark:text-amber-400' }],
    ],
    defaultStyle: { color: 'text-muted-foreground' },
  },
  yarn: {
    patterns: [
      [/^(yarn)\b/, { color: 'text-violet-600 dark:text-violet-400', fontWeight: 'font-bold' }],
      [/\b(add|remove|install|upgrade|init|run|start|test|build|publish|link|pack|audit|outdated|list|info|why|workspaces|dlx)\b/, { color: 'text-blue-600 dark:text-blue-400' }],
      [/\s(-{1,2}[\w-]+)/, { color: 'text-cyan-600 dark:text-cyan-400' }],
      [/@[\w/-]+/, { color: 'text-amber-600 dark:text-amber-400' }],
    ],
    defaultStyle: { color: 'text-muted-foreground' },
  },
  pnpm: {
    patterns: [
      [/^(pnpm)\b/, { color: 'text-violet-600 dark:text-violet-400', fontWeight: 'font-bold' }],
      [/\b(add|remove|install|update|init|run|start|test|build|publish|link|pack|audit|outdated|list|why|store|dlx|exec)\b/, { color: 'text-blue-600 dark:text-blue-400' }],
      [/\s(-{1,2}[\w-]+)/, { color: 'text-cyan-600 dark:text-cyan-400' }],
      [/@[\w/-]+/, { color: 'text-amber-600 dark:text-amber-400' }],
    ],
    defaultStyle: { color: 'text-muted-foreground' },
  },
};

function tokenize(text: string, syntaxType: SyntaxType): Token[] {
  const config = SYNTAX_PATTERNS[syntaxType];
  if (!config || config.patterns.length === 0) {
    return [{ text, style: config?.defaultStyle || { color: 'text-foreground' } }];
  }

  const tokens: Token[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    let matched = false;

    for (const [pattern, style] of config.patterns) {
      const match = remaining.match(pattern);
      if (match && match.index !== undefined) {
        // Add any text before the match as default styled
        if (match.index > 0) {
          tokens.push({
            text: remaining.slice(0, match.index),
            style: config.defaultStyle,
          });
        }

        // Add the matched text with its style
        tokens.push({
          text: match[0],
          style,
        });

        remaining = remaining.slice(match.index + match[0].length);
        matched = true;
        break;
      }
    }

    if (!matched) {
      // No pattern matched, move one character forward
      tokens.push({
        text: remaining[0],
        style: config.defaultStyle,
      });
      remaining = remaining.slice(1);
    }
  }

  return tokens;
}

function flattenTokensToChars(tokens: Token[]): { char: string; style: TokenStyle }[] {
  const chars: { char: string; style: TokenStyle }[] = [];
  for (const token of tokens) {
    for (const char of token.text) {
      chars.push({ char, style: token.style });
    }
  }
  return chars;
}

const FONT_SIZE_CLASSES = {
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
} as const;

export function TypingArea({
  text,
  syntaxType = 'plain',
  cursorPosition = 0,
  errors = new Map(),
  className,
  showCursor = true,
  fontSize = 'xl',
}: TypingAreaProps) {
  // Tokenize and flatten for character-by-character rendering
  const charStyles = useMemo(() => {
    const tokens = tokenize(text, syntaxType);
    return flattenTokensToChars(tokens);
  }, [text, syntaxType]);

  return (
    <div
      className={cn(
        'font-mono leading-relaxed',
        FONT_SIZE_CLASSES[fontSize],
        className
      )}
      data-testid="typing-area"
    >
      <div className="flex flex-wrap">
        {charStyles.map(({ char, style }, index) => {
          const isTyped = index < cursorPosition;
          const isCurrent = index === cursorPosition;
          const hasError = errors.has(index);
          const errorChar = errors.get(index);

          // Determine character state and class
          let charClass = '';
          if (isTyped) {
            // Use theme-aware colors for errors and correct characters
            charClass = hasError ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400';
          } else if (isCurrent) {
            charClass = style.color;
          } else {
            // Upcoming text - slightly dimmed
            charClass = cn(style.color, 'opacity-50');
          }

          return (
            <span
              key={index}
              className={cn(
                'relative whitespace-pre',
                charClass,
                style.fontWeight,
                isCurrent && showCursor && 'bg-primary/20'
              )}
              data-testid={`char-${index}`}
            >
              {/* Cursor indicator with blink animation */}
              {isCurrent && showCursor && (
                <span
                  className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary animate-cursor-blink rounded-full"
                  aria-hidden="true"
                  data-testid="typing-cursor"
                />
              )}
              {/* Show the character, handle special cases */}
              {char === ' ' ? '\u00A0' : char}
              {/* Error indicator - show what was typed */}
              {hasError && isTyped && errorChar && (
                <span
                  className="absolute -top-1 left-1/2 -translate-x-1/2 text-[10px] text-red-500 dark:text-red-400"
                  aria-hidden="true"
                  data-testid={`error-${index}`}
                >
                  {errorChar}
                </span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export { tokenize, flattenTokensToChars, SYNTAX_PATTERNS };
export type { Token, TokenStyle };
