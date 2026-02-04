import { describe, it, expect } from 'vitest';
import AppleIcon, { size, contentType, runtime } from '../apple-icon';

describe('Sokudo Apple Icon', () => {
  it('should export correct size dimensions', () => {
    expect(size.width).toBe(180);
    expect(size.height).toBe(180);
  });

  it('should export PNG content type', () => {
    expect(contentType).toBe('image/png');
  });

  it('should use edge runtime', () => {
    expect(runtime).toBe('edge');
  });

  it('should return an ImageResponse', () => {
    const response = AppleIcon();
    expect(response).toBeDefined();
    expect(response.constructor.name).toBe('ImageResponse');
  });
});
