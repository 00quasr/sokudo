import { render, screen } from '@testing-library/react';
import { StatsBar } from '@/components/typing/StatsBar';

describe('StatsBar Accessibility', () => {
  const defaultStats = {
    wpm: 65,
    rawWpm: 70,
    accuracy: 98,
    keystrokes: 120,
    errors: 2,
    durationMs: 15000,
  };

  it('has proper status role with aria-live', () => {
    render(<StatsBar stats={defaultStats} />);

    const status = screen.getByRole('status');
    expect(status).toBeInTheDocument();
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveAttribute('aria-label', 'Typing statistics');
  });

  it('displays WPM stat with test id', () => {
    render(<StatsBar stats={defaultStats} />);

    const wpmElement = screen.getByTestId('stats-wpm');
    expect(wpmElement).toBeInTheDocument();
    expect(wpmElement).toHaveTextContent('65');
  });

  it('displays accuracy stat with test id', () => {
    render(<StatsBar stats={defaultStats} />);

    const accuracyElement = screen.getByTestId('stats-accuracy');
    expect(accuracyElement).toBeInTheDocument();
    expect(accuracyElement).toHaveTextContent('98%');
  });

  it('displays time stat with test id', () => {
    render(<StatsBar stats={defaultStats} />);

    const timeElement = screen.getByTestId('stats-time');
    expect(timeElement).toBeInTheDocument();
    expect(timeElement).toHaveTextContent('0:15');
  });

  it('displays progress bar with proper aria attributes when enabled', () => {
    render(<StatsBar stats={defaultStats} progress={50} showProgress={true} />);

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toBeInTheDocument();
    expect(progressbar).toHaveAttribute('aria-valuenow', '50');
    expect(progressbar).toHaveAttribute('aria-valuemin', '0');
    expect(progressbar).toHaveAttribute('aria-valuemax', '100');
    expect(progressbar).toHaveAttribute('aria-label', 'Typing progress');
  });

  it('does not display progress bar when showProgress is false', () => {
    render(<StatsBar stats={defaultStats} showProgress={false} />);

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('formats time correctly', () => {
    const statsWithLongerTime = {
      ...defaultStats,
      durationMs: 125000, // 2 minutes 5 seconds
    };

    render(<StatsBar stats={statsWithLongerTime} />);

    const timeElement = screen.getByTestId('stats-time');
    expect(timeElement).toHaveTextContent('2:05');
  });

  it('has touch-friendly target areas', () => {
    const { container } = render(<StatsBar stats={defaultStats} />);

    const touchTargets = container.querySelectorAll('.touch-target');
    expect(touchTargets.length).toBeGreaterThan(0);
  });

  it('displays progress percentage text', () => {
    render(<StatsBar stats={defaultStats} progress={75} showProgress={true} />);

    const progressText = screen.getByTestId('stats-progress-text');
    expect(progressText).toBeInTheDocument();
    expect(progressText).toHaveTextContent('75%');
  });
});
