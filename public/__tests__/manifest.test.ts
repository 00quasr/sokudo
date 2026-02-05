import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('PWA Manifest', () => {
  let manifest: any;

  it('should have a valid manifest.json file', () => {
    const manifestPath = path.join(__dirname, '..', 'manifest.json');
    expect(fs.existsSync(manifestPath)).toBe(true);

    const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
    expect(() => JSON.parse(manifestContent)).not.toThrow();

    manifest = JSON.parse(manifestContent);
  });

  describe('required fields', () => {
    it('should have a name', () => {
      const manifestPath = path.join(__dirname, '..', 'manifest.json');
      const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
      manifest = JSON.parse(manifestContent);

      expect(manifest.name).toBeDefined();
      expect(typeof manifest.name).toBe('string');
      expect(manifest.name.length).toBeGreaterThan(0);
    });

    it('should have a short_name', () => {
      const manifestPath = path.join(__dirname, '..', 'manifest.json');
      const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
      manifest = JSON.parse(manifestContent);

      expect(manifest.short_name).toBeDefined();
      expect(typeof manifest.short_name).toBe('string');
      expect(manifest.short_name.length).toBeLessThanOrEqual(12);
    });

    it('should have a start_url', () => {
      const manifestPath = path.join(__dirname, '..', 'manifest.json');
      const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
      manifest = JSON.parse(manifestContent);

      expect(manifest.start_url).toBeDefined();
      expect(typeof manifest.start_url).toBe('string');
    });

    it('should have a display mode', () => {
      const manifestPath = path.join(__dirname, '..', 'manifest.json');
      const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
      manifest = JSON.parse(manifestContent);

      expect(manifest.display).toBeDefined();
      expect(['fullscreen', 'standalone', 'minimal-ui', 'browser']).toContain(
        manifest.display
      );
    });

    it('should have icons array', () => {
      const manifestPath = path.join(__dirname, '..', 'manifest.json');
      const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
      manifest = JSON.parse(manifestContent);

      expect(manifest.icons).toBeDefined();
      expect(Array.isArray(manifest.icons)).toBe(true);
      expect(manifest.icons.length).toBeGreaterThan(0);
    });
  });

  describe('theme colors', () => {
    it('should have theme_color', () => {
      const manifestPath = path.join(__dirname, '..', 'manifest.json');
      const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
      manifest = JSON.parse(manifestContent);

      expect(manifest.theme_color).toBeDefined();
      expect(typeof manifest.theme_color).toBe('string');
      expect(manifest.theme_color).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    it('should have background_color', () => {
      const manifestPath = path.join(__dirname, '..', 'manifest.json');
      const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
      manifest = JSON.parse(manifestContent);

      expect(manifest.background_color).toBeDefined();
      expect(typeof manifest.background_color).toBe('string');
      expect(manifest.background_color).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });

  describe('icons configuration', () => {
    it('should have icons with required properties', () => {
      const manifestPath = path.join(__dirname, '..', 'manifest.json');
      const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
      manifest = JSON.parse(manifestContent);

      manifest.icons.forEach((icon: any) => {
        expect(icon.src).toBeDefined();
        expect(icon.sizes).toBeDefined();
        expect(icon.type).toBeDefined();
      });
    });

    it('should have 192x192 and 512x512 icons', () => {
      const manifestPath = path.join(__dirname, '..', 'manifest.json');
      const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
      manifest = JSON.parse(manifestContent);

      const sizes = manifest.icons.map((icon: any) => icon.sizes);
      expect(sizes).toContain('192x192');
      expect(sizes).toContain('512x512');
    });

    it('should have maskable icons', () => {
      const manifestPath = path.join(__dirname, '..', 'manifest.json');
      const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
      manifest = JSON.parse(manifestContent);

      const maskableIcons = manifest.icons.filter(
        (icon: any) => icon.purpose === 'maskable'
      );
      expect(maskableIcons.length).toBeGreaterThan(0);
    });
  });

  describe('PWA features', () => {
    it('should have scope defined', () => {
      const manifestPath = path.join(__dirname, '..', 'manifest.json');
      const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
      manifest = JSON.parse(manifestContent);

      expect(manifest.scope).toBeDefined();
      expect(typeof manifest.scope).toBe('string');
    });

    it('should have orientation preference', () => {
      const manifestPath = path.join(__dirname, '..', 'manifest.json');
      const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
      manifest = JSON.parse(manifestContent);

      expect(manifest.orientation).toBeDefined();
    });

    it('should have language specified', () => {
      const manifestPath = path.join(__dirname, '..', 'manifest.json');
      const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
      manifest = JSON.parse(manifestContent);

      expect(manifest.lang).toBeDefined();
      expect(typeof manifest.lang).toBe('string');
    });

    it('should have text direction', () => {
      const manifestPath = path.join(__dirname, '..', 'manifest.json');
      const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
      manifest = JSON.parse(manifestContent);

      expect(manifest.dir).toBeDefined();
      expect(['ltr', 'rtl', 'auto']).toContain(manifest.dir);
    });
  });

  describe('shortcuts', () => {
    it('should have app shortcuts defined', () => {
      const manifestPath = path.join(__dirname, '..', 'manifest.json');
      const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
      manifest = JSON.parse(manifestContent);

      expect(manifest.shortcuts).toBeDefined();
      expect(Array.isArray(manifest.shortcuts)).toBe(true);
    });

    it('should have valid shortcut structure', () => {
      const manifestPath = path.join(__dirname, '..', 'manifest.json');
      const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
      manifest = JSON.parse(manifestContent);

      if (manifest.shortcuts && manifest.shortcuts.length > 0) {
        manifest.shortcuts.forEach((shortcut: any) => {
          expect(shortcut.name).toBeDefined();
          expect(shortcut.url).toBeDefined();
        });
      }
    });
  });

  describe('screenshots', () => {
    it('should have screenshots for app store listing', () => {
      const manifestPath = path.join(__dirname, '..', 'manifest.json');
      const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
      manifest = JSON.parse(manifestContent);

      expect(manifest.screenshots).toBeDefined();
      expect(Array.isArray(manifest.screenshots)).toBe(true);
    });

    it('should have screenshots with form factors', () => {
      const manifestPath = path.join(__dirname, '..', 'manifest.json');
      const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
      manifest = JSON.parse(manifestContent);

      if (manifest.screenshots && manifest.screenshots.length > 0) {
        manifest.screenshots.forEach((screenshot: any) => {
          expect(screenshot.src).toBeDefined();
          expect(screenshot.sizes).toBeDefined();
          expect(screenshot.type).toBeDefined();
        });
      }
    });
  });

  describe('enhanced PWA features', () => {
    it('should have display_override for advanced display modes', () => {
      const manifestPath = path.join(__dirname, '..', 'manifest.json');
      const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
      manifest = JSON.parse(manifestContent);

      expect(manifest.display_override).toBeDefined();
      expect(Array.isArray(manifest.display_override)).toBe(true);
    });

    it('should have launch_handler for navigation behavior', () => {
      const manifestPath = path.join(__dirname, '..', 'manifest.json');
      const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
      manifest = JSON.parse(manifestContent);

      expect(manifest.launch_handler).toBeDefined();
      expect(manifest.launch_handler.client_mode).toBeDefined();
    });

    it('should have share_target for Web Share Target API', () => {
      const manifestPath = path.join(__dirname, '..', 'manifest.json');
      const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
      manifest = JSON.parse(manifestContent);

      expect(manifest.share_target).toBeDefined();
      expect(manifest.share_target.action).toBeDefined();
      expect(manifest.share_target.params).toBeDefined();
    });

    it('should have protocol_handlers for custom protocols', () => {
      const manifestPath = path.join(__dirname, '..', 'manifest.json');
      const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
      manifest = JSON.parse(manifestContent);

      expect(manifest.protocol_handlers).toBeDefined();
      expect(Array.isArray(manifest.protocol_handlers)).toBe(true);
    });
  });

  describe('categories', () => {
    it('should have appropriate categories', () => {
      const manifestPath = path.join(__dirname, '..', 'manifest.json');
      const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
      manifest = JSON.parse(manifestContent);

      expect(manifest.categories).toBeDefined();
      expect(Array.isArray(manifest.categories)).toBe(true);
      expect(manifest.categories.length).toBeGreaterThan(0);
    });
  });
});
