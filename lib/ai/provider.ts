import { z } from 'zod';

export type AIProviderType = 'openai' | 'anthropic';

export interface AIProviderConfig {
  type: AIProviderType;
  apiKey: string;
  model: string;
}

export function getProviderConfig(): AIProviderConfig {
  if (process.env.ANTHROPIC_API_KEY) {
    return {
      type: 'anthropic',
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-20250514',
    };
  }

  if (process.env.OPENAI_API_KEY) {
    return {
      type: 'openai',
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
    };
  }

  throw new Error(
    'No AI provider configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY environment variable.'
  );
}

const openAIResponseSchema = z.object({
  choices: z.array(
    z.object({
      message: z.object({
        content: z.string(),
      }),
    })
  ),
});

const anthropicResponseSchema = z.object({
  content: z.array(
    z.object({
      type: z.literal('text'),
      text: z.string(),
    })
  ),
});

export async function callAI(prompt: string): Promise<string> {
  const config = getProviderConfig();

  if (config.type === 'anthropic') {
    return callAnthropic(config, prompt);
  }

  return callOpenAI(config, prompt);
}

async function callAnthropic(
  config: AIProviderConfig,
  prompt: string
): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${text}`);
  }

  const data = anthropicResponseSchema.parse(await response.json());
  return data.content[0].text;
}

async function callOpenAI(
  config: AIProviderConfig,
  prompt: string
): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${text}`);
  }

  const data = openAIResponseSchema.parse(await response.json());
  return data.choices[0].message.content;
}
