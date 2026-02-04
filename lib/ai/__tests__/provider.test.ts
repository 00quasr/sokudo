import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('getProviderConfig', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENAI_MODEL;
    delete process.env.ANTHROPIC_MODEL;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('should throw when no API key is configured', async () => {
    const { getProviderConfig } = await import('../provider');
    expect(() => getProviderConfig()).toThrow('No AI provider configured');
  });

  it('should use Anthropic when ANTHROPIC_API_KEY is set', async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
    const { getProviderConfig } = await import('../provider');

    const config = getProviderConfig();

    expect(config.type).toBe('anthropic');
    expect(config.apiKey).toBe('sk-ant-test');
    expect(config.model).toBe('claude-sonnet-4-20250514');
  });

  it('should use OpenAI when OPENAI_API_KEY is set', async () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    const { getProviderConfig } = await import('../provider');

    const config = getProviderConfig();

    expect(config.type).toBe('openai');
    expect(config.apiKey).toBe('sk-test');
    expect(config.model).toBe('gpt-4o-mini');
  });

  it('should prefer Anthropic when both keys are set', async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
    process.env.OPENAI_API_KEY = 'sk-test';
    const { getProviderConfig } = await import('../provider');

    const config = getProviderConfig();

    expect(config.type).toBe('anthropic');
  });

  it('should use custom model name from ANTHROPIC_MODEL env', async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
    process.env.ANTHROPIC_MODEL = 'claude-3-haiku-20240307';
    const { getProviderConfig } = await import('../provider');

    const config = getProviderConfig();

    expect(config.model).toBe('claude-3-haiku-20240307');
  });

  it('should use custom model name from OPENAI_MODEL env', async () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    process.env.OPENAI_MODEL = 'gpt-4o';
    const { getProviderConfig } = await import('../provider');

    const config = getProviderConfig();

    expect(config.model).toBe('gpt-4o');
  });
});

describe('callAI', () => {
  const originalEnv = { ...process.env };
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.resetModules();
    process.env.OPENAI_API_KEY = 'sk-test';
    delete process.env.ANTHROPIC_API_KEY;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    global.fetch = originalFetch;
  });

  it('should call OpenAI API and return content', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          choices: [{ message: { content: '{"result": "test"}' } }],
        }),
    });

    const { callAI } = await import('../provider');
    const result = await callAI('test prompt');

    expect(result).toBe('{"result": "test"}');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.openai.com/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer sk-test',
        }),
      })
    );
  });

  it('should call Anthropic API when configured', async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
    delete process.env.OPENAI_API_KEY;

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          content: [{ type: 'text', text: '{"result": "test"}' }],
        }),
    });

    const { callAI } = await import('../provider');
    const result = await callAI('test prompt');

    expect(result).toBe('{"result": "test"}');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.anthropic.com/v1/messages',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'x-api-key': 'sk-ant-test',
          'anthropic-version': '2023-06-01',
        }),
      })
    );
  });

  it('should throw on API error response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      text: () => Promise.resolve('Rate limited'),
    });

    const { callAI } = await import('../provider');

    await expect(callAI('test')).rejects.toThrow('OpenAI API error (429)');
  });
});
