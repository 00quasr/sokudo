import { describe, it, expect } from 'vitest';
import Icon, { size, contentType, runtime } from '../icon';

describe('Sokudo Icon', () => {
  it('should export correct size dimensions', () => {
    expect(size.width).toBe(32);
    expect(size.height).toBe(32);
  });

  it('should export PNG content type', () => {
    expect(contentType).toBe('image/png');
  });

  it('should use edge runtime', () => {
    expect(runtime).toBe('edge');
  });

  it('should return an ImageResponse', () => {
    const response = Icon();
    expect(response).toBeDefined();
    expect(response.constructor.name).toBe('ImageResponse');
  });
});
