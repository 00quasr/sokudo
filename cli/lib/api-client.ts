import { Config } from './config';

interface SessionData {
  challengeId: number;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  keystrokes: number;
  errors: number;
  durationMs: number;
  keystrokeLogs?: Array<{
    timestamp: number;
    expected: string;
    actual: string;
    isCorrect: boolean;
    latencyMs: number;
  }>;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  difficulty: string;
  isPremium: boolean;
  displayOrder: number;
}

interface Challenge {
  id: number;
  categoryId: number;
  content: string;
  difficulty: string;
  syntaxType: string;
  hint: string;
  avgWpm: number;
  timesCompleted: number;
}

interface UserStats {
  totalSessions: number;
  avgWpm: number;
  avgAccuracy: number;
  totalPracticeTime: number;
  streak: number;
  keyAccuracy?: Array<{
    key: string;
    accuracy: number;
    avgLatency: number;
  }>;
}

export class ApiClient {
  private baseUrl: string;
  private apiKey?: string;

  constructor() {
    const config = Config.load();
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
  }

  private async fetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async verifyApiKey(apiKey: string): Promise<{ userId: number; email: string }> {
    const response = await fetch(`${this.baseUrl}/api/keys/verify`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error('Invalid API key');
    }

    return response.json();
  }

  async getCategories(): Promise<Category[]> {
    return this.fetch<Category[]>('/api/categories');
  }

  async getChallenges(categorySlug?: string, difficulty?: string): Promise<Challenge[]> {
    const params = new URLSearchParams();
    if (categorySlug) params.append('category', categorySlug);
    if (difficulty) params.append('difficulty', difficulty);

    const query = params.toString();
    return this.fetch<Challenge[]>(`/api/challenges${query ? `?${query}` : ''}`);
  }

  async getChallenge(id: number): Promise<Challenge> {
    return this.fetch<Challenge>(`/api/challenges/${id}`);
  }

  async submitSession(data: SessionData): Promise<any> {
    return this.fetch('/api/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getUserStats(days?: number): Promise<UserStats> {
    const params = new URLSearchParams();
    if (days) params.append('days', days.toString());

    const query = params.toString();
    return this.fetch<UserStats>(`/api/stats${query ? `?${query}` : ''}`);
  }

  async getRecentSessions(limit: number = 10): Promise<any[]> {
    return this.fetch(`/api/sessions?limit=${limit}`);
  }

  async getKeyAccuracy(): Promise<any[]> {
    return this.fetch('/api/stats/key-accuracy');
  }
}
