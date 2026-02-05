/**
 * Keyboard layout mappings for alternative layouts (Dvorak, Colemak)
 * Maps physical key codes to logical characters for different layouts
 */

export type KeyboardLayout = 'qwerty' | 'dvorak' | 'colemak';

/**
 * QWERTY layout (standard US keyboard)
 * This is the baseline - no translation needed
 */
const QWERTY_KEYS = {
  // Letters (lowercase)
  q: 'q', w: 'w', e: 'e', r: 'r', t: 't', y: 'y', u: 'u', i: 'i', o: 'o', p: 'p',
  a: 'a', s: 's', d: 'd', f: 'f', g: 'g', h: 'h', j: 'j', k: 'k', l: 'l',
  z: 'z', x: 'x', c: 'c', v: 'v', b: 'b', n: 'n', m: 'm',

  // Letters (uppercase)
  Q: 'Q', W: 'W', E: 'E', R: 'R', T: 'T', Y: 'Y', U: 'U', I: 'I', O: 'O', P: 'P',
  A: 'A', S: 'S', D: 'D', F: 'F', G: 'G', H: 'H', J: 'J', K: 'K', L: 'L',
  Z: 'Z', X: 'X', C: 'C', V: 'V', B: 'B', N: 'N', M: 'M',

  // Punctuation and symbols (same across all layouts)
  '`': '`', '~': '~', '1': '1', '!': '!', '2': '2', '@': '@',
  '3': '3', '#': '#', '4': '4', '$': '$', '5': '5', '%': '%',
  '6': '6', '^': '^', '7': '7', '&': '&', '8': '8', '*': '*',
  '9': '9', '(': '(', '0': '0', ')': ')', '-': '-', '_': '_',
  '=': '=', '+': '+', '[': '[', '{': '{', ']': ']', '}': '}',
  '\\': '\\', '|': '|', ';': ';', ':': ':', "'": "'", '"': '"',
  ',': ',', '<': '<', '.': '.', '>': '>', '/': '/', '?': '?',
  ' ': ' ',
};

/**
 * Dvorak layout
 * Maps QWERTY physical keys to Dvorak logical characters
 */
const DVORAK_MAPPING = {
  // Top row letters
  q: "'", w: ',', e: '.', r: 'p', t: 'y', y: 'f', u: 'g', i: 'c', o: 'r', p: 'l',
  Q: '"', W: '<', E: '>', R: 'P', T: 'Y', Y: 'F', U: 'G', I: 'C', O: 'R', P: 'L',

  // Home row letters
  a: 'a', s: 'o', d: 'e', f: 'u', g: 'i', h: 'd', j: 'h', k: 't', l: 'n', ';': 's',
  A: 'A', S: 'O', D: 'E', F: 'U', G: 'I', H: 'D', J: 'H', K: 'T', L: 'N', ':': 'S',

  // Bottom row letters
  z: ';', x: 'q', c: 'j', v: 'k', b: 'x', n: 'b', m: 'm',
  Z: ':', X: 'Q', C: 'J', V: 'K', B: 'X', N: 'B', M: 'M',

  // Special characters
  "'": 'q',
  '"': 'Q',
  '[': '-',
  '{': '_',
  ']': '=',
  '}': '+',
  '-': '[',
  '_': '{',
  '=': ']',
  '+': '}',
  '/': '/',
  '?': '?',
};

/**
 * Colemak layout
 * Maps QWERTY physical keys to Colemak logical characters
 */
const COLEMAK_MAPPING = {
  // Top row letters (some changes)
  e: 'f', r: 'p', t: 'g', y: 'j', u: 'l', i: 'u', o: 'y', p: ';',
  E: 'F', R: 'P', T: 'G', Y: 'J', U: 'L', I: 'U', O: 'Y', P: ':',

  // Home row letters (significant changes)
  s: 'r', d: 's', f: 't', g: 'd', j: 'n', k: 'e', l: 'i', ';': 'o',
  S: 'R', D: 'S', F: 'T', G: 'D', J: 'N', K: 'E', L: 'I', ':': 'O',

  // Bottom row letters (some changes)
  n: 'k',
  N: 'K',

  // Keys that stay the same (explicitly listed for clarity)
  q: 'q', w: 'w', a: 'a', z: 'z', x: 'x', c: 'c', v: 'v', b: 'b', m: 'm', h: 'h',
  Q: 'Q', W: 'W', A: 'A', Z: 'Z', X: 'X', C: 'C', V: 'V', B: 'B', M: 'M', H: 'H',
};

/**
 * Get the layout mapping for a given keyboard layout
 */
function getLayoutMapping(layout: KeyboardLayout): Record<string, string> {
  switch (layout) {
    case 'qwerty':
      return QWERTY_KEYS;
    case 'dvorak':
      return { ...QWERTY_KEYS, ...DVORAK_MAPPING };
    case 'colemak':
      return { ...QWERTY_KEYS, ...COLEMAK_MAPPING };
  }
}

/**
 * Translate a key from physical keyboard to logical character based on layout
 *
 * @param physicalKey - The key value from keyboard event (e.g., 'q' on physical keyboard)
 * @param layout - The keyboard layout to use for translation
 * @returns The logical character that should be typed (e.g., "'" on Dvorak when 'q' is pressed)
 *
 * @example
 * translateKey('q', 'dvorak') // Returns "'"
 * translateKey('q', 'qwerty') // Returns 'q'
 * translateKey('q', 'colemak') // Returns 'q'
 */
export function translateKey(physicalKey: string, layout: KeyboardLayout): string {
  if (layout === 'qwerty') {
    return physicalKey;
  }

  const mapping = getLayoutMapping(layout);
  return mapping[physicalKey] ?? physicalKey;
}

/**
 * Reverse translation: convert logical character to physical key
 * Useful for showing hints or visual keyboard overlays
 *
 * @param logicalChar - The character that should be typed
 * @param layout - The keyboard layout to use
 * @returns The physical key that should be pressed
 *
 * @example
 * reverseTranslateKey("'", 'dvorak') // Returns 'q'
 * reverseTranslateKey('a', 'dvorak') // Returns 'a'
 */
export function reverseTranslateKey(logicalChar: string, layout: KeyboardLayout): string {
  if (layout === 'qwerty') {
    return logicalChar;
  }

  const mapping = getLayoutMapping(layout);

  // Find the physical key that maps to this logical character
  for (const [physicalKey, mappedChar] of Object.entries(mapping)) {
    if (mappedChar === logicalChar) {
      return physicalKey;
    }
  }

  return logicalChar;
}

/**
 * Detect the browser's keyboard layout if possible
 * Note: Browser API support is limited. Returns 'qwerty' as default.
 *
 * @returns Detected layout or 'qwerty' as fallback
 */
export function detectKeyboardLayout(): KeyboardLayout {
  // Browser APIs for keyboard layout detection are limited
  // navigator.keyboard.getLayoutMap() is experimental and not widely supported

  // For now, we'll default to QWERTY and let users manually select
  // Future enhancement: Use KeyboardEvent.code vs KeyboardEvent.key to infer layout

  return 'qwerty';
}

/**
 * Get a human-readable name for a keyboard layout
 */
export function getLayoutDisplayName(layout: KeyboardLayout): string {
  switch (layout) {
    case 'qwerty':
      return 'QWERTY';
    case 'dvorak':
      return 'Dvorak';
    case 'colemak':
      return 'Colemak';
  }
}

/**
 * Get all available keyboard layouts
 */
export function getAvailableLayouts(): KeyboardLayout[] {
  return ['qwerty', 'dvorak', 'colemak'];
}
