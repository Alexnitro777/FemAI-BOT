import { ActivityType, Client } from 'discord.js';
import { logger } from '../utils/logger.js';
import * as pingCommand from '../commands/ping.js';
import * as resetCommand from '../commands/reset.js';

export async function onReady(client: Client<true>) {
  logger.info(`Бот успешно авторизован как ${client.user.tag}! ✨`);

  // Установка статуса активности фембойчика
  client.user.setPresence({
    activities: [
      {
        name: 'болтает с тобой ~nya ✨',
        type: ActivityType.Custom,
        state: 'болтает с тобой ~nya ✨'
      }
    ],
    status: 'online'
  });

  // Регистрация слэш-команд
  try {
    const commandsData = [pingCommand.data.toJSON(), resetCommand.data.toJSON()];
    await client.application.commands.set(commandsData);
    logger.info(`Зарегистрировано ${commandsData.length} слэш-команд (/ping, /reset).`);
  } catch (err) {
    logger.error('Ошибка при регистрации слэш-команд в Discord API:', err);
  }
}
