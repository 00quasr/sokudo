import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';
import { readFileSync } from 'fs';

// Mock fs module
vi.mock('fs', () => ({
  readFileSync: vi.fn(),
}));

const mockReadFileSync = readFileSync as ReturnType<typeof vi.fn>;

function createRequest(url: string): NextRequest {
  return new NextRequest(new Request(url));
}

const mockOpenApiSpec = `
openapi: 3.1.0
info:
  title: Sokudo API
  version: 1.0.0
paths:
  /test:
    get:
      summary: Test endpoint
`;

describe('GET /api/docs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReadFileSync.mockReturnValue(mockOpenApiSpec);
  });

  describe('format parameter', () => {
    it('should serve Swagger UI by default', async () => {
      const request = createRequest('http://localhost:3000/api/docs');
      const response = await GET(request);
      const html = await response.text();

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/html');
      expect(html).toContain('swagger-ui');
      expect(html).toContain('Sokudo API Documentation');
      expect(html).toContain('SwaggerUIBundle');
    });

    it('should serve Swagger UI when format=ui', async () => {
      const request = createRequest('http://localhost:3000/api/docs?format=ui');
      const response = await GET(request);
      const html = await response.text();

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/html');
      expect(html).toContain('swagger-ui');
    });

    it('should return YAML spec when format=yaml', async () => {
      const request = createRequest('http://localhost:3000/api/docs?format=yaml');
      const response = await GET(request);
      const yaml = await response.text();

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/x-yaml');
      expect(response.headers.get('Content-Disposition')).toContain('openapi.yaml');
      expect(yaml).toBe(mockOpenApiSpec);
    });

    it('should return 501 for JSON format (not implemented)', async () => {
      const request = createRequest('http://localhost:3000/api/docs?format=json');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(501);
      expect(data.message).toContain('JSON format not yet implemented');
    });
  });

  describe('Swagger UI configuration', () => {
    it('should configure Swagger UI to fetch YAML spec', async () => {
      const request = createRequest('http://localhost:3000/api/docs');
      const response = await GET(request);
      const html = await response.text();

      expect(html).toContain("url: '/api/docs?format=yaml'");
    });

    it('should enable deep linking', async () => {
      const request = createRequest('http://localhost:3000/api/docs');
      const response = await GET(request);
      const html = await response.text();

      expect(html).toContain('deepLinking: true');
    });

    it('should enable filtering', async () => {
      const request = createRequest('http://localhost:3000/api/docs');
      const response = await GET(request);
      const html = await response.text();

      expect(html).toContain('filter: true');
    });

    it('should persist authorization', async () => {
      const request = createRequest('http://localhost:3000/api/docs');
      const response = await GET(request);
      const html = await response.text();

      expect(html).toContain('persistAuthorization: true');
    });

    it('should hide topbar', async () => {
      const request = createRequest('http://localhost:3000/api/docs');
      const response = await GET(request);
      const html = await response.text();

      expect(html).toContain('.topbar');
      expect(html).toContain('display: none');
    });
  });

  describe('error handling', () => {
    it('should return 500 when file reading fails', async () => {
      mockReadFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });

      const request = createRequest('http://localhost:3000/api/docs');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to load API documentation');
    });

    it('should return 500 when file reading throws unexpected error', async () => {
      mockReadFileSync.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const request = createRequest('http://localhost:3000/api/docs?format=yaml');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to load API documentation');
    });
  });

  describe('OpenAPI spec file reading', () => {
    it('should read openapi.yaml from project root', async () => {
      const request = createRequest('http://localhost:3000/api/docs?format=yaml');
      await GET(request);

      expect(mockReadFileSync).toHaveBeenCalledWith(
        expect.stringContaining('openapi.yaml'),
        'utf-8'
      );
    });
  });
});
