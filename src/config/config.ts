import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';
import { logger } from '../utils/logger.js';

export function cleanConfigString(val: unknown, fallback = ''): string {
  if (typeof val !== 'string') return fallback;
  return val.trim().replace(/^["']|["']$/g, '').trim();
}

export const ConfigSchema = z.object({
  discordToken: z.preprocess((v) => cleanConfigString(v), z.string().min(1, 'discordToken не может быть пустым')),
  openRouterApiKey: z.preprocess((v) => cleanConfigString(v), z.string().min(1, 'openRouterApiKey не может быть пустым')),
  model: z.preprocess((v) => cleanConfigString(v, 'google/gemma-2-9b-it:free'), z.string().min(1).default('google/gemma-2-9b-it:free')),
  channelIds: z.array(z.string()).default([])
});

export type BotConfig = z.infer<typeof ConfigSchema>;

function loadConfig(): BotConfig {
  const configPath = resolve(process.cwd(), 'config.json');

  let rawData: Record<string, unknown> = {};

  if (existsSync(configPath)) {
    try {
      const fileContent = readFileSync(configPath, 'utf-8');
      rawData = JSON.parse(fileContent);
    } catch (err) {
      logger.error('Ошибка при чтении или парсинге JSON из config.json:', err);
      process.exit(1);
    }
  } else {
    // If config.json doesn't exist, check if environment variables are provided
    if (!process.env.DISCORD_TOKEN && !process.env.OPENROUTER_API_KEY) {
      if (process.env.NODE_ENV === 'test') {
        return {
          discordToken: 'test-discord-token',
          openRouterApiKey: 'sk-or-v1-test-openrouter-key',
          model: 'google/gemma-2-9b-it:free',
          channelIds: []
        };
      }
      logger.error(`Файл конфигурации "config.json" не найден по пути: ${configPath}`);
      logger.error('Пожалуйста, создайте файл "config.json" на основе "config.example.json" или укажите переменные окружения DISCORD_TOKEN и OPENROUTER_API_KEY.');
      process.exit(1);
    }
  }

  // Allow environment variables to override or fill missing values (useful for Docker)
  if (process.env.DISCORD_TOKEN) rawData.discordToken = process.env.DISCORD_TOKEN;
  if (process.env.OPENROUTER_API_KEY) rawData.openRouterApiKey = process.env.OPENROUTER_API_KEY;
  if (process.env.MODEL) rawData.model = process.env.MODEL;
  if (process.env.CHANNEL_IDS) {
    try {
      rawData.channelIds = JSON.parse(process.env.CHANNEL_IDS);
    } catch {
      rawData.channelIds = process.env.CHANNEL_IDS.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }

  const parseResult = ConfigSchema.safeParse(rawData);

  if (!parseResult.success) {
    logger.error('Ошибка в конфигурации:');
    for (const issue of parseResult.error.issues) {
      logger.error(` - Поле "${issue.path.join('.')}": ${issue.message}`);
    }
    process.exit(1);
  }

  const loadedConfig = parseResult.data;

  // Проверка плейсхолдеров
  if (loadedConfig.discordToken.includes('YOUR_DISCORD_BOT_TOKEN') || loadedConfig.discordToken === '') {
    logger.error('Указан шаблонный токен Discord. Пожалуйста, укажите настоящий токен бота.');
    process.exit(1);
  }

  if (loadedConfig.openRouterApiKey.includes('YOUR_OPENROUTER_API_KEY') || loadedConfig.openRouterApiKey === '') {
    logger.error('Указан шаблонный API-ключ OpenRouter. Пожалуйста, укажите настоящий ключ.');
    process.exit(1);
  }

  // Проверка формата ключа OpenRouter
  if (!loadedConfig.openRouterApiKey.startsWith('sk-or-')) {
    logger.warn('Предупреждение: API-ключ OpenRouter обычно начинается с "sk-or-v1-". Проверьте, что указан именно ключ OpenRouter, а не токен Discord или другого сервиса.');
  }

  return loadedConfig;
}

export const config = loadConfig();
