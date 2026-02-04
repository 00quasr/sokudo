/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { VisibilityToggle } from '../visibility-toggle';

// Mock ResizeObserver for Radix Switch component
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

describe('VisibilityToggle', () => {
  it('should render in private state by default', () => {
    render(<VisibilityToggle />);
    expect(screen.getByText('Private')).toBeTruthy();
    expect(screen.getByText(/only you can see this/)).toBeTruthy();
  });

  it('should render in public state when defaultChecked is true', () => {
    render(<VisibilityToggle defaultChecked={true} />);
    expect(screen.getByText('Public')).toBeTruthy();
    expect(screen.getByText(/visible to other users/)).toBeTruthy();
  });

  it('should toggle from private to public when switch is clicked', () => {
    render(<VisibilityToggle />);
    expect(screen.getByText('Private')).toBeTruthy();

    const switchElement = screen.getByRole('switch');
    fireEvent.click(switchElement);

    expect(screen.getByText('Public')).toBeTruthy();
    expect(screen.getByText(/visible to other users/)).toBeTruthy();
  });

  it('should toggle from public to private when switch is clicked', () => {
    render(<VisibilityToggle defaultChecked={true} />);
    expect(screen.getByText('Public')).toBeTruthy();

    const switchElement = screen.getByRole('switch');
    fireEvent.click(switchElement);

    expect(screen.getByText('Private')).toBeTruthy();
    expect(screen.getByText(/only you can see this/)).toBeTruthy();
  });

  it('should have hidden input with value "on" when public', () => {
    const { container } = render(<VisibilityToggle defaultChecked={true} />);
    const hiddenInput = container.querySelector('input[name="isPublic"]') as HTMLInputElement;
    expect(hiddenInput).toBeTruthy();
    expect(hiddenInput.value).toBe('on');
  });

  it('should have hidden input with empty value when private', () => {
    const { container } = render(<VisibilityToggle />);
    const hiddenInput = container.querySelector('input[name="isPublic"]') as HTMLInputElement;
    expect(hiddenInput).toBeTruthy();
    expect(hiddenInput.value).toBe('');
  });

  it('should update hidden input value when toggled', () => {
    const { container } = render(<VisibilityToggle />);
    const hiddenInput = container.querySelector('input[name="isPublic"]') as HTMLInputElement;
    expect(hiddenInput.value).toBe('');

    const switchElement = screen.getByRole('switch');
    fireEvent.click(switchElement);

    expect(hiddenInput.value).toBe('on');
  });

  it('should have aria-label on the switch', () => {
    render(<VisibilityToggle />);
    const switchElement = screen.getByRole('switch');
    expect(switchElement.getAttribute('aria-label')).toBe('Challenge visibility');
  });
});
