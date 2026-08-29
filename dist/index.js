"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const config_1 = require("./config");
const messageCreate_1 = require("./events/messageCreate");
const client = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.MessageContent,
    ],
    partials: [discord_js_1.Partials.Channel],
    allowedMentions: { parse: ['users'], repliedUser: true },
});
client.on('messageCreate', messageCreate_1.onMessageCreate);
client.once('ready', () => console.log(`Бот запущен: ${client.user?.tag}`));
client.login(config_1.config.token);
