/**
 * @vitest-environment jsdom
 */
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AchievementIcon } from '../achievement-icons';

describe('AchievementIcon', () => {
  it('should render an SVG element', () => {
    const { container } = render(<AchievementIcon icon="gauge" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('should render for all known icon names', () => {
    const icons = [
      'gauge', 'zap', 'flame', 'git-branch', 'git-merge',
      'terminal', 'code', 'file-type', 'container', 'package',
      'layers', 'sparkles', 'database', 'trophy', 'target',
    ];

    for (const icon of icons) {
      const { container } = render(<AchievementIcon icon={icon} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
    }
  });

  it('should render fallback icon for unknown icon names', () => {
    const { container } = render(<AchievementIcon icon="unknown-icon" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('should pass through Lucide props', () => {
    const { container } = render(
      <AchievementIcon icon="gauge" className="h-5 w-5 text-yellow-500" />,
    );
    const svg = container.querySelector('svg');
    expect(svg?.classList.contains('text-yellow-500')).toBe(true);
  });
});
