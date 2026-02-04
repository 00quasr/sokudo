/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Layout from '../layout';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock the sign out action
vi.mock('@/app/(login)/actions', () => ({
  signOut: vi.fn(),
}));

// Mock SWR
vi.mock('swr', () => ({
  default: () => ({
    data: null,
    error: undefined,
    isLoading: false,
  }),
  mutate: vi.fn(),
}));

describe('Dashboard Layout', () => {
  describe('branding', () => {
    it('should display "Sokudo (速度)" branding in header', () => {
      render(
        <Layout>
          <div>Test Content</div>
        </Layout>
      );

      const brandingElement = screen.getByText('Sokudo (速度)');
      expect(brandingElement).toBeTruthy();
    });

    it('should not display "ACME" branding', () => {
      render(
        <Layout>
          <div>Test Content</div>
        </Layout>
      );

      const acmeBranding = screen.queryByText('ACME');
      expect(acmeBranding).toBeNull();
    });

    it('should have brand link that points to home', () => {
      const { container } = render(
        <Layout>
          <div>Test Content</div>
        </Layout>
      );

      const brandLink = container.querySelector('a[href="/"]');
      expect(brandLink).toBeTruthy();
      expect(brandLink?.textContent).toContain('Sokudo (速度)');
    });

    it('should render brand logo icon', () => {
      const { container } = render(
        <Layout>
          <div>Test Content</div>
        </Layout>
      );

      // CircleIcon should be present
      const icon = container.querySelector('svg.lucide-circle');
      expect(icon).toBeTruthy();
    });
  });

  describe('layout structure', () => {
    it('should render header component', () => {
      const { container } = render(
        <Layout>
          <div>Test Content</div>
        </Layout>
      );

      const header = container.querySelector('header');
      expect(header).toBeTruthy();
    });

    it('should render children content', () => {
      render(
        <Layout>
          <div>Test Content</div>
        </Layout>
      );

      expect(screen.getByText('Test Content')).toBeTruthy();
    });

    it('should have proper layout classes', () => {
      const { container } = render(
        <Layout>
          <div>Test Content</div>
        </Layout>
      );

      const section = container.querySelector('section');
      expect(section?.className).toContain('flex');
      expect(section?.className).toContain('flex-col');
      expect(section?.className).toContain('min-h-screen');
    });
  });
});
