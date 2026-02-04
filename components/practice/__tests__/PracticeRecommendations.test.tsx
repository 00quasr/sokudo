/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PracticeRecommendations } from '../PracticeRecommendations';
import type { PracticeRecommendation } from '@/lib/practice/recommendations';

const mockRecommendations: PracticeRecommendation[] = [
  {
    type: 'weak_category',
    priority: 'high',
    title: 'Practice Docker',
    description: 'Your accuracy in Docker is 72%.',
    actionLabel: 'Practice Docker',
    actionHref: '/practice/docker',
    metric: '72% accuracy',
  },
  {
    type: 'weak_key',
    priority: 'high',
    title: "Focus on the 'E' key",
    description: "Your accuracy on 'E' is 65%.",
    actionLabel: 'Personalized Practice',
    actionHref: '/practice/personalized',
    metric: '65% accuracy',
  },
  {
    type: 'streak_reminder',
    priority: 'low',
    title: 'Keep your 5-day streak alive',
    description: "You're on a 5-day streak.",
    actionLabel: 'Quick Practice',
    actionHref: '/practice/smart',
    metric: '5 days',
  },
];

describe('PracticeRecommendations', () => {
  it('should render the heading', () => {
    render(<PracticeRecommendations recommendations={mockRecommendations} />);
    expect(screen.getByText('You should practice...')).toBeTruthy();
  });

  it('should render all recommendation titles', () => {
    render(<PracticeRecommendations recommendations={mockRecommendations} />);
    expect(screen.getByText('Practice Docker')).toBeTruthy();
    expect(screen.getByText("Focus on the 'E' key")).toBeTruthy();
    expect(screen.getByText('Keep your 5-day streak alive')).toBeTruthy();
  });

  it('should render descriptions', () => {
    render(<PracticeRecommendations recommendations={mockRecommendations} />);
    expect(screen.getByText('Your accuracy in Docker is 72%.')).toBeTruthy();
  });

  it('should render metrics', () => {
    render(<PracticeRecommendations recommendations={mockRecommendations} />);
    expect(screen.getByText('72% accuracy')).toBeTruthy();
    expect(screen.getByText('65% accuracy')).toBeTruthy();
    expect(screen.getByText('5 days')).toBeTruthy();
  });

  it('should render links with correct hrefs', () => {
    render(<PracticeRecommendations recommendations={mockRecommendations} />);
    const links = screen.getAllByRole('link');
    const hrefs = links.map((l) => l.getAttribute('href'));
    expect(hrefs).toContain('/practice/docker');
    expect(hrefs).toContain('/practice/personalized');
    expect(hrefs).toContain('/practice/smart');
  });

  it('should return null when no recommendations', () => {
    const { container } = render(
      <PracticeRecommendations recommendations={[]} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should apply correct priority styles', () => {
    render(<PracticeRecommendations recommendations={mockRecommendations} />);
    const links = screen.getAllByRole('link');
    // High priority links should have red border class
    expect(links[0].className).toContain('border-l-red-500');
    // Low priority link should have blue border class
    expect(links[2].className).toContain('border-l-blue-400');
  });
});
