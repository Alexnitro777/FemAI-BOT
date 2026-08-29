import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { config } from './config';
import { onMessageCreate } from './events/messageCreate';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
  allowedMentions: { parse: ['users'], repliedUser: true },
});

client.on('messageCreate', onMessageCreate);
client.once('clientReady', () => console.log(`Бот запущен: ${client.user?.tag}`));
client.login(config.token);
