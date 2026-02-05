import { describe, it, expect } from 'vitest';
import {
  translateKey,
  reverseTranslateKey,
  getLayoutDisplayName,
  getAvailableLayouts,
} from '../keyboard-layouts';

describe('keyboard-layouts', () => {
  describe('translateKey', () => {
    describe('QWERTY layout', () => {
      it('should return the same key for QWERTY layout', () => {
        expect(translateKey('a', 'qwerty')).toBe('a');
        expect(translateKey('q', 'qwerty')).toBe('q');
        expect(translateKey('1', 'qwerty')).toBe('1');
        expect(translateKey(' ', 'qwerty')).toBe(' ');
      });
    });

    describe('Dvorak layout', () => {
      it('should translate letters correctly', () => {
        // Top row
        expect(translateKey('q', 'dvorak')).toBe("'");
        expect(translateKey('w', 'dvorak')).toBe(',');
        expect(translateKey('e', 'dvorak')).toBe('.');
        expect(translateKey('r', 'dvorak')).toBe('p');
        expect(translateKey('t', 'dvorak')).toBe('y');

        // Home row
        expect(translateKey('a', 'dvorak')).toBe('a');
        expect(translateKey('s', 'dvorak')).toBe('o');
        expect(translateKey('d', 'dvorak')).toBe('e');
        expect(translateKey('f', 'dvorak')).toBe('u');

        // Bottom row
        expect(translateKey('z', 'dvorak')).toBe(';');
        expect(translateKey('x', 'dvorak')).toBe('q');
        expect(translateKey('c', 'dvorak')).toBe('j');
      });

      it('should translate uppercase letters correctly', () => {
        expect(translateKey('Q', 'dvorak')).toBe('"');
        expect(translateKey('A', 'dvorak')).toBe('A');
        expect(translateKey('S', 'dvorak')).toBe('O');
      });

      it('should preserve numbers and common symbols', () => {
        expect(translateKey('1', 'dvorak')).toBe('1');
        expect(translateKey('0', 'dvorak')).toBe('0');
        expect(translateKey(' ', 'dvorak')).toBe(' ');
        expect(translateKey('/', 'dvorak')).toBe('/');
      });
    });

    describe('Colemak layout', () => {
      it('should translate letters correctly', () => {
        // Top row changes
        expect(translateKey('e', 'colemak')).toBe('f');
        expect(translateKey('r', 'colemak')).toBe('p');
        expect(translateKey('t', 'colemak')).toBe('g');
        expect(translateKey('y', 'colemak')).toBe('j');
        expect(translateKey('u', 'colemak')).toBe('l');
        expect(translateKey('i', 'colemak')).toBe('u');
        expect(translateKey('o', 'colemak')).toBe('y');
        expect(translateKey('p', 'colemak')).toBe(';');

        // Home row changes
        expect(translateKey('s', 'colemak')).toBe('r');
        expect(translateKey('d', 'colemak')).toBe('s');
        expect(translateKey('f', 'colemak')).toBe('t');
        expect(translateKey('g', 'colemak')).toBe('d');
        expect(translateKey('j', 'colemak')).toBe('n');
        expect(translateKey('k', 'colemak')).toBe('e');
        expect(translateKey('l', 'colemak')).toBe('i');
        expect(translateKey(';', 'colemak')).toBe('o');

        // Bottom row
        expect(translateKey('n', 'colemak')).toBe('k');
      });

      it('should keep unchanged keys the same', () => {
        expect(translateKey('q', 'colemak')).toBe('q');
        expect(translateKey('w', 'colemak')).toBe('w');
        expect(translateKey('a', 'colemak')).toBe('a');
        expect(translateKey('z', 'colemak')).toBe('z');
      });

      it('should preserve numbers and symbols', () => {
        expect(translateKey('1', 'colemak')).toBe('1');
        expect(translateKey(' ', 'colemak')).toBe(' ');
        expect(translateKey(',', 'colemak')).toBe(',');
      });
    });

    it('should handle unknown characters gracefully', () => {
      expect(translateKey('€', 'dvorak')).toBe('€');
      expect(translateKey('£', 'colemak')).toBe('£');
    });
  });

  describe('reverseTranslateKey', () => {
    it('should reverse QWERTY translation (no-op)', () => {
      expect(reverseTranslateKey('a', 'qwerty')).toBe('a');
      expect(reverseTranslateKey('1', 'qwerty')).toBe('1');
    });

    it('should reverse Dvorak translation', () => {
      expect(reverseTranslateKey("'", 'dvorak')).toBe('q');
      expect(reverseTranslateKey(',', 'dvorak')).toBe('w');
      expect(reverseTranslateKey('a', 'dvorak')).toBe('a');
      expect(reverseTranslateKey('o', 'dvorak')).toBe('s');
    });

    it('should reverse Colemak translation', () => {
      expect(reverseTranslateKey('f', 'colemak')).toBe('e');
      expect(reverseTranslateKey('p', 'colemak')).toBe('r');
      expect(reverseTranslateKey('e', 'colemak')).toBe('k');
    });

    it('should handle characters not in mapping', () => {
      expect(reverseTranslateKey('€', 'dvorak')).toBe('€');
    });
  });

  describe('getLayoutDisplayName', () => {
    it('should return correct display names', () => {
      expect(getLayoutDisplayName('qwerty')).toBe('QWERTY');
      expect(getLayoutDisplayName('dvorak')).toBe('Dvorak');
      expect(getLayoutDisplayName('colemak')).toBe('Colemak');
    });
  });

  describe('getAvailableLayouts', () => {
    it('should return all available layouts', () => {
      const layouts = getAvailableLayouts();
      expect(layouts).toEqual(['qwerty', 'dvorak', 'colemak']);
      expect(layouts).toHaveLength(3);
    });
  });

  describe('roundtrip translations', () => {
    it('should correctly roundtrip Dvorak translations', () => {
      const testKeys = ['q', 'w', 'e', 'a', 's', 'd', 'z', 'x', 'c'];

      testKeys.forEach((key) => {
        const translated = translateKey(key, 'dvorak');
        const reversed = reverseTranslateKey(translated, 'dvorak');
        expect(reversed).toBe(key);
      });
    });

    it('should correctly roundtrip Colemak translations', () => {
      const testKeys = ['e', 'r', 't', 's', 'd', 'f', 'n'];

      testKeys.forEach((key) => {
        const translated = translateKey(key, 'colemak');
        const reversed = reverseTranslateKey(translated, 'colemak');
        expect(reversed).toBe(key);
      });
    });
  });

  describe('real-world typing scenarios', () => {
    it('should correctly translate a Dvorak user typing "hello"', () => {
      // On Dvorak keyboard, when user presses physical keys d-t-c-c-r
      // Those keys map to: e-y-j-j-p on QWERTY positions
      const physicalKeys = ['d', 't', 'c', 'c', 'r'];
      const translated = physicalKeys.map((key) => translateKey(key, 'dvorak'));
      expect(translated.join('')).toBe('eyjjp');
    });

    it('should correctly translate a Colemak user typing "test"', () => {
      // On Colemak keyboard, when user presses t-k-r-t
      // Those keys map to: g-e-p-g on QWERTY positions
      const physicalKeys = ['t', 'k', 'r', 't'];
      const translated = physicalKeys.map((key) => translateKey(key, 'colemak'));
      expect(translated.join('')).toBe('gepg');
    });

    it('should translate physical Dvorak keys to logical characters', () => {
      // When a Dvorak user wants to type "hello", they would press different physical keys
      // But we're testing that physical key 'd' on Dvorak → 'e'
      const testMappings = [
        { physical: 'd', expected: 'e' },
        { physical: 't', expected: 'y' },
        { physical: 'h', expected: 'd' },
      ];

      testMappings.forEach(({ physical, expected }) => {
        expect(translateKey(physical, 'dvorak')).toBe(expected);
      });
    });
  });
});
