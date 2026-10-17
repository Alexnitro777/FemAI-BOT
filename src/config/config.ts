import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';
import { logger } from '../utils/logger.js';

const ConfigSchema = z.object({
  discordToken: z.string().min(1, 'discordToken не может быть пустым'),
  openRouterApiKey: z.string().min(1, 'openRouterApiKey не может быть пустым'),
  model: z.string().default('google/gemma-4-31b-it:free'),
  channelIds: z.array(z.string()).default([])
});

export type BotConfig = z.infer<typeof ConfigSchema>;

function loadConfig(): BotConfig {
  const configPath = resolve(process.cwd(), 'config.json');

  if (!existsSync(configPath)) {
    logger.error(`Файл конфигурации "config.json" не найден по пути: ${configPath}`);
    logger.error('Пожалуйста, создайте файл "config.json" на основе "config.example.json" и укажите ваши токены.');
    process.exit(1);
  }

  let rawData: unknown;
  try {
    const fileContent = readFileSync(configPath, 'utf-8');
    rawData = JSON.parse(fileContent);
  } catch (err) {
    logger.error('Ошибка при чтении или парсинге JSON из config.json:', err);
    process.exit(1);
  }

  const parseResult = ConfigSchema.safeParse(rawData);

  if (!parseResult.success) {
    logger.error('Ошибка в файле config.json:');
    for (const issue of parseResult.error.issues) {
      logger.error(` - Поле "${issue.path.join('.')}": ${issue.message}`);
    }
    process.exit(1);
  }

  const config = parseResult.data;

  // Проверка плейсхолдеров
  if (config.discordToken.includes('YOUR_DISCORD_BOT_TOKEN') || config.discordToken.trim() === '') {
    logger.error('В config.json указан шаблонный токен Discord. Пожалуйста, укажите настоящий токен бота.');
    process.exit(1);
  }

  if (config.openRouterApiKey.includes('YOUR_OPENROUTER_API_KEY') || config.openRouterApiKey.trim() === '') {
    logger.error('В config.json указан шаблонный API-ключ OpenRouter. Пожалуйста, укажите настоящий ключ.');
    process.exit(1);
  }

  return config;
}

export const config = loadConfig();
