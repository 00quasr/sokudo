import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { DELETE } from '../route';

vi.mock('@/lib/db/drizzle', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  },
}));

vi.mock('@/lib/db/queries', () => ({
  getUser: vi.fn(),
}));

import { db } from '@/lib/db/drizzle';
import { getUser } from '@/lib/db/queries';

const mockDb = db as unknown as {
  select: ReturnType<typeof vi.fn>;
  from: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
};

const mockGetUser = getUser as ReturnType<typeof vi.fn>;

function createParams(keyId: string): Promise<{ keyId: string }> {
  return Promise.resolve({ keyId });
}

describe('DELETE /api/keys/[keyId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/keys/1', {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: createParams('1') });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 for invalid key ID', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const request = new NextRequest('http://localhost:3000/api/keys/abc', {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: createParams('abc') });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid key ID');
  });

  it('should return 400 for negative key ID', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const request = new NextRequest('http://localhost:3000/api/keys/-1', {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: createParams('-1') });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid key ID');
  });

  it('should return 404 when key not found', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const mockLimit = vi.fn().mockResolvedValue([]);
    const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
    mockDb.select.mockImplementation(mockSelect);

    const request = new NextRequest('http://localhost:3000/api/keys/999', {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: createParams('999') });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('API key not found');
  });

  it('should revoke an existing key', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const mockLimit = vi.fn().mockResolvedValue([{ id: 5 }]);
    const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
    mockDb.select.mockImplementation(mockSelect);

    const mockUpdateWhere = vi.fn().mockResolvedValue(undefined);
    const mockSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
    const mockUpdate = vi.fn().mockReturnValue({ set: mockSet });
    mockDb.update.mockImplementation(mockUpdate);

    const request = new NextRequest('http://localhost:3000/api/keys/5', {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: createParams('5') });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('API key revoked successfully');
  });

  it('should return 500 on database error', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const mockLimit = vi.fn().mockRejectedValue(new Error('DB error'));
    const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
    mockDb.select.mockImplementation(mockSelect);

    const request = new NextRequest('http://localhost:3000/api/keys/1', {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: createParams('1') });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});
