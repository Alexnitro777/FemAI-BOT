import {
  Client,
  GatewayIntentBits,
  Partials,
  type Interaction
} from 'discord.js';
import { config } from './config/config.js';
import { SAFE_ALLOWED_MENTIONS } from './services/security.js';
import { onReady } from './events/ready.js';
import { onMessageCreate } from './events/messageCreate.js';
import * as pingCommand from './commands/ping.js';
import * as resetCommand from './commands/reset.js';
import { logger } from './utils/logger.js';

// Инициализация Discord клиента с минимально необходимыми правами и глобальным запретом пингов
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ],
  partials: [Partials.Channel, Partials.Message],
  allowedMentions: SAFE_ALLOWED_MENTIONS
});

// Обработка готовности бота
client.once('ready', async (readyClient) => {
  await onReady(readyClient);
});

// Обработка входящих сообщений
client.on('messageCreate', async (message) => {
  if (client.isReady()) {
    await onMessageCreate(client, message);
  }
});

// Обработка слэш-команд
client.on('interactionCreate', async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;

  try {
    if (interaction.commandName === pingCommand.data.name) {
      await pingCommand.execute(interaction);
    } else if (interaction.commandName === resetCommand.data.name) {
      await resetCommand.execute(interaction);
    }
  } catch (err) {
    logger.error(`Ошибка при выполнении команды /${interaction.commandName}:`, err);
    const reply = {
      content: 'Ой, при выполнении этой команды произошла ошибочка... (｡•́︿•̀｡)',
      ephemeral: true
    };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply);
    } else {
      await interaction.reply(reply);
    }
  }
});

// Глобальный перехват необработанных ошибок
process.on('unhandledRejection', (reason) => {
  logger.error('Неперехваченное отклонение промиса (unhandledRejection):', reason);
});

process.on('uncaughtException', (err) => {
  logger.error('Неперехваченное исключение (uncaughtException):', err);
});

// Запуск бота
logger.info('Запуск Discord бота...');
client.login(config.discordToken).catch((err) => {
  logger.error('Не удалось войти в Discord API. Проверьте ваш discordToken в config.json:', err);
  process.exit(1);
});
