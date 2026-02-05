import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('PWA Manifest', () => {
  it('should have a valid manifest.json file', () => {
    const manifestPath = join(process.cwd(), 'public', 'manifest.json');
    expect(existsSync(manifestPath)).toBe(true);

    const manifestContent = readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent);

    // Check required fields
    expect(manifest.name).toBe('Sokudo (速度) - Developer Typing Trainer');
    expect(manifest.short_name).toBe('Sokudo');
    expect(manifest.description).toBeTruthy();
    expect(manifest.start_url).toBe('/?source=pwa');
    expect(manifest.display).toBe('standalone');
    expect(manifest.background_color).toBe('#0a0a0b');
    expect(manifest.theme_color).toBe('#0a0a0b');
  });

  it('should have all required icon sizes', () => {
    const manifestPath = join(process.cwd(), 'public', 'manifest.json');
    const manifestContent = readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent);

    expect(manifest.icons).toBeDefined();
    expect(manifest.icons.length).toBeGreaterThan(0);

    // Check for common required sizes
    const sizes = manifest.icons.map((icon: any) => icon.sizes);
    expect(sizes).toContain('192x192');
    expect(sizes).toContain('512x512');
  });

  it('should have maskable icons for better Android support', () => {
    const manifestPath = join(process.cwd(), 'public', 'manifest.json');
    const manifestContent = readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent);

    const maskableIcons = manifest.icons.filter((icon: any) => icon.purpose === 'maskable');
    expect(maskableIcons.length).toBeGreaterThan(0);
  });

  it('should have valid shortcuts', () => {
    const manifestPath = join(process.cwd(), 'public', 'manifest.json');
    const manifestContent = readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent);

    expect(manifest.shortcuts).toBeDefined();
    expect(manifest.shortcuts.length).toBeGreaterThan(0);

    manifest.shortcuts.forEach((shortcut: any) => {
      expect(shortcut.name).toBeTruthy();
      expect(shortcut.url).toBeTruthy();
      expect(shortcut.icons).toBeDefined();
    });
  });

  it('should have all icon files present', () => {
    const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

    iconSizes.forEach(size => {
      const iconPath = join(process.cwd(), 'public', 'icons', `icon-${size}x${size}.png`);
      expect(existsSync(iconPath)).toBe(true);
    });

    // Check maskable icons
    const maskableIconPath192 = join(process.cwd(), 'public', 'icons', 'icon-maskable-192x192.png');
    const maskableIconPath512 = join(process.cwd(), 'public', 'icons', 'icon-maskable-512x512.png');
    expect(existsSync(maskableIconPath192)).toBe(true);
    expect(existsSync(maskableIconPath512)).toBe(true);
  });

  it('should have screenshot files present', () => {
    const desktopScreenshot = join(process.cwd(), 'public', 'screenshots', 'desktop-1.png');
    const mobileScreenshot = join(process.cwd(), 'public', 'screenshots', 'mobile-1.png');

    expect(existsSync(desktopScreenshot)).toBe(true);
    expect(existsSync(mobileScreenshot)).toBe(true);
  });
});
