"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onMessageCreate = onMessageCreate;
const responder_1 = require("../services/responder");
const mentionFilter_1 = require("../filters/mentionFilter");
const contentFilter_1 = require("../filters/contentFilter");
const cooldowns = new Map();
const COOLDOWN_MS = 3000;
async function onMessageCreate(message) {
    if (message.author.bot)
        return;
    if (!message.mentions.has(message.client.user))
        return;
    const last = cooldowns.get(message.author.id) ?? 0;
    if (Date.now() - last < COOLDOWN_MS)
        return;
    cooldowns.set(message.author.id, Date.now());
    if (!(0, contentFilter_1.isContentSafe)(message.content)) {
        await message.reply('Давай без этого');
        return;
    }
    const userText = message.content
        .replace(new RegExp(`<@!?${message.client.user.id}>`, 'g'), '')
        .trim();
    try {
        if ('sendTyping' in message.channel) {
            await message.channel.sendTyping();
        }
        let reply = await (0, responder_1.generateReply)(userText, message.author.username, message.channelId);
        if (!(0, contentFilter_1.isContentSafe)(reply))
            reply = contentFilter_1.SAFE_FALLBACK;
        reply = (0, mentionFilter_1.sanitizeMentions)(reply);
        await message.reply(reply.slice(0, 2000));
    }
    catch (err) {
        console.error('Ошибка генерации:', err);
        await message.reply('Что-то пошло не так, попробуй ещё раз чуть позже 😅');
    }
}
