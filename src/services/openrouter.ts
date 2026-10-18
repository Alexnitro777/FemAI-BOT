import { config } from '../config/config.js';
import { FEMBOY_SYSTEM_PROMPT } from '../config/persona.js';
import { type ChatMessage } from './memory.js';
import { logger } from '../utils/logger.js';

interface OpenRouterResponse {
  id?: string;
  choices?: Array<{
    message?: {
      role?: string;
      content?: string;
    };
    finish_reason?: string;
  }>;
  error?: {
    message?: string;
    code?: number;
  };
}

export class OpenRouterError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly isAuth: boolean = false
  ) {
    super(message);
    this.name = 'OpenRouterError';
  }
}

export async function generateChatResponse(
  history: ChatMessage[],
  userPrompt: string
): Promise<string> {
  const messages: ChatMessage[] = [
    { role: 'system', content: FEMBOY_SYSTEM_PROMPT },
    ...history,
    { role: 'user', content: userPrompt }
  ];

  const payload = {
    model: config.model,
    messages,
    temperature: 0.8,
    max_tokens: 1024
  };

  const maxRetries = 2;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      const delayMs = attempt * 2000;
      logger.warn(`Повторная попытка запроса к OpenRouter (${attempt}/${maxRetries}) через ${delayMs}мс...`);
      await new Promise((res) => setTimeout(res, delayMs));
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.openRouterApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://discord.com',
          'X-Title': 'FemAI Discord Companion'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`Ошибка OpenRouter API [${response.status}]: ${errorText}`);

        if (response.status === 401) {
          logger.error('Ошибка авторизации OpenRouter (401 Unauthorized / User not found). Вероятные причины: неверный или отозванный API-ключ, удалённый аккаунт, либо ключ скопирован с ошибкой.');
          throw new OpenRouterError('Неверный или отозванный API-ключ OpenRouter (401 Unauthorized)', 401, true);
        }

        if (response.status === 404) {
          logger.error(`Модель "${config.model}" не найдена на OpenRouter (404 Not Found). Проверьте название модели в config.json.`);
          throw new OpenRouterError(`Модель "${config.model}" не найдена на OpenRouter (404)`, 404);
        }

        // If rate limited or server overloaded, retry
        if (response.status === 429 || response.status >= 500) {
          lastError = new Error(`OpenRouter HTTP ${response.status}`);
          continue;
        }

        throw new OpenRouterError(`OpenRouter вернул HTTP ${response.status}: ${errorText}`, response.status);
      }

      const data = (await response.json()) as OpenRouterResponse;

      if (data.error) {
        logger.error('OpenRouter вернул ошибку в ответе:', data.error.message);
        throw new OpenRouterError(data.error.message ?? 'Неизвестная ошибка OpenRouter');
      }

      const replyContent = data.choices?.[0]?.message?.content?.trim();
      if (!replyContent) {
        logger.warn('OpenRouter вернул пустой ответ');
        return 'Хм-м, я так заслушался тебя, что даже потерял мысль! Что ты имел в виду? (≧◡≦)';
      }

      return replyContent;
    } catch (err: unknown) {
      clearTimeout(timeout);
      if (err instanceof OpenRouterError) {
        throw err;
      }
      if (err instanceof Error && err.name === 'AbortError') {
        logger.error('Таймаут запроса к OpenRouter (превышено 45 сек)');
        lastError = new Error('Request Timeout');
      } else {
        logger.error('Исключение при запросе к OpenRouter:', err);
        lastError = err instanceof Error ? err : new Error(String(err));
      }
    }
  }

  logger.error('Все попытки запроса к OpenRouter исчерпаны:', lastError);
  throw new OpenRouterError('Все попытки запроса к OpenRouter исчерпаны');
}
