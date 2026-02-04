import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PUT } from '../route';

// Mock the queries and db modules
vi.mock('@/lib/db/queries', () => ({
  getUser: vi.fn(),
}));

vi.mock('@/lib/db/drizzle', () => ({
  db: {
    query: {
      userProfiles: {
        findFirst: vi.fn(),
      },
    },
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve()),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => Promise.resolve()),
    })),
  },
}));

import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';

const mockGetUser = getUser as ReturnType<typeof vi.fn>;
const mockFindFirst = db.query.userProfiles.findFirst as ReturnType<typeof vi.fn>;

describe('GET /api/user/timezone', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockGetUser.mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return default UTC timezone when no preference set', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockFindFirst.mockResolvedValue({
      userId: 1,
      preferences: {},
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.timezone).toBe('UTC');
    expect(data.isDefault).toBe(true);
  });

  it('should return user timezone when set', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockFindFirst.mockResolvedValue({
      userId: 1,
      preferences: { timezone: 'America/New_York' },
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.timezone).toBe('America/New_York');
    expect(data.isDefault).toBe(false);
  });

  it('should return default UTC when profile does not exist', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockFindFirst.mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.timezone).toBe('UTC');
    expect(data.isDefault).toBe(true);
  });
});

describe('PUT /api/user/timezone', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockGetUser.mockResolvedValue(null);

    const request = new Request('http://localhost/api/user/timezone', {
      method: 'PUT',
      body: JSON.stringify({ timezone: 'America/New_York' }),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 for invalid timezone', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const request = new Request('http://localhost/api/user/timezone', {
      method: 'PUT',
      body: JSON.stringify({ timezone: 'Invalid/Timezone' }),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid IANA timezone');
  });

  it('should return 400 for missing timezone', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const request = new Request('http://localhost/api/user/timezone', {
      method: 'PUT',
      body: JSON.stringify({}),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(400);
  });

  it('should update timezone for existing profile', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockFindFirst.mockResolvedValue({
      userId: 1,
      preferences: { theme: 'dark' },
    });

    const updateMock = vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve()),
      })),
    }));
    (db.update as ReturnType<typeof vi.fn>).mockImplementation(updateMock);

    const request = new Request('http://localhost/api/user/timezone', {
      method: 'PUT',
      body: JSON.stringify({ timezone: 'Europe/London' }),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.timezone).toBe('Europe/London');
    expect(data.success).toBe(true);
    expect(updateMock).toHaveBeenCalled();
  });

  it('should create profile if it does not exist', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockFindFirst.mockResolvedValue(null);

    const insertMock = vi.fn(() => ({
      values: vi.fn(() => Promise.resolve()),
    }));
    (db.insert as ReturnType<typeof vi.fn>).mockImplementation(insertMock);

    const request = new Request('http://localhost/api/user/timezone', {
      method: 'PUT',
      body: JSON.stringify({ timezone: 'Asia/Tokyo' }),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.timezone).toBe('Asia/Tokyo');
    expect(data.success).toBe(true);
    expect(insertMock).toHaveBeenCalled();
  });

  it('should accept valid IANA timezones', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockFindFirst.mockResolvedValue({
      userId: 1,
      preferences: {},
    });

    const validTimezones = [
      'UTC',
      'America/New_York',
      'Europe/London',
      'Asia/Tokyo',
      'Australia/Sydney',
      'Pacific/Auckland',
    ];

    for (const timezone of validTimezones) {
      const request = new Request('http://localhost/api/user/timezone', {
        method: 'PUT',
        body: JSON.stringify({ timezone }),
      });

      const response = await PUT(request);
      expect(response.status).toBe(200);
    }
  });
});
