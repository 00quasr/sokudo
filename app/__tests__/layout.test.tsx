import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Root Layout Branding', () => {
  describe('metadata configuration', () => {
    it('should have Sokudo branding in layout.tsx file', () => {
      const layoutPath = path.join(__dirname, '../layout.tsx');
      const layoutContent = fs.readFileSync(layoutPath, 'utf-8');

      expect(layoutContent).toContain('Sokudo (速度) - Developer Typing Trainer');
      expect(layoutContent).toContain(
        'Build muscle memory for git commands, terminal workflows, React patterns, and AI prompts.'
      );
    });

    it('should not have ACME branding in layout.tsx file', () => {
      const layoutPath = path.join(__dirname, '../layout.tsx');
      const layoutContent = fs.readFileSync(layoutPath, 'utf-8');

      expect(layoutContent).not.toContain('Next.js SaaS Starter');
      expect(layoutContent).not.toContain('Get started quickly with Next.js, Postgres, and Stripe');
    });
  });
});
