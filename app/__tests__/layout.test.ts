import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Root Layout Viewport', () => {
  let layoutContent: string;

  beforeEach(() => {
    const layoutPath = path.join(__dirname, '../layout.tsx');
    layoutContent = fs.readFileSync(layoutPath, 'utf-8');
  });

  it('should export viewport configuration', () => {
    expect(layoutContent).toContain('export const viewport: Viewport');
  });

  it('should set device-width for width', () => {
    expect(layoutContent).toContain("width: 'device-width'");
  });

  it('should set initial scale to 1', () => {
    expect(layoutContent).toContain('initialScale: 1');
  });

  it('should set maximum scale to 1', () => {
    expect(layoutContent).toContain('maximumScale: 1');
  });

  it('should disable user scaling', () => {
    expect(layoutContent).toContain('userScalable: false');
  });

  it('should configure theme colors for light mode', () => {
    expect(layoutContent).toContain("media: '(prefers-color-scheme: light)'");
    expect(layoutContent).toContain("color: '#ffffff'");
  });

  it('should configure theme colors for dark mode', () => {
    expect(layoutContent).toContain("media: '(prefers-color-scheme: dark)'");
    expect(layoutContent).toContain("color: '#0a0a0b'");
  });

  it('should have complete viewport configuration for mobile scaling', () => {
    // Verify all essential mobile viewport properties are present
    const viewportConfig = [
      "width: 'device-width'",
      'initialScale: 1',
      'maximumScale: 1',
      'userScalable: false',
      'themeColor:'
    ];

    viewportConfig.forEach((prop) => {
      expect(layoutContent).toContain(prop);
    });
  });
});
