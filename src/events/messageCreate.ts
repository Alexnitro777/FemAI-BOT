import { Message } from 'discord.js';
import { generateReply } from '../services/responder';
import { sanitizeMentions } from '../filters/mentionFilter';
import { isContentSafe, SAFE_FALLBACK } from '../filters/contentFilter';

const cooldowns = new Map<string, number>();
const COOLDOWN_MS = 3000;

export async function onMessageCreate(message: Message) {
  if (message.author.bot) return;
  if (!message.mentions.has(message.client.user!)) return;

  const last = cooldowns.get(message.author.id) ?? 0;
  if (Date.now() - last < COOLDOWN_MS) return;
  cooldowns.set(message.author.id, Date.now());

  if (!isContentSafe(message.content)) {
    await message.reply('Давай без этого');
    return;
  }

  let userText = message.content
    .replace(new RegExp(`<@!?${message.client.user!.id}>`, 'g'), '')
    .trim();

  if (!userText && message.stickers.size > 0) {
    userText = `*отправляет стикер: ${message.stickers.first()?.name}*`;
  } else if (!userText && message.attachments.size > 0) {
    userText = `*отправляет файл/картинку*`;
  } else if (!userText) {
    userText = `*молча обращает на тебя внимание*`;
  }

  try {
    let typingInterval: NodeJS.Timeout | null = null;
    if ('sendTyping' in message.channel) {
      await message.channel.sendTyping().catch(() => {});
      typingInterval = setInterval(() => {
        if ('sendTyping' in message.channel) {
          message.channel.sendTyping().catch(() => {});
        }
      }, 9000);
    }

    let reply: string;
    try {
      reply = await generateReply(userText, message.author.username, message.channelId);
    } finally {
      if (typingInterval) clearInterval(typingInterval);
    }

    if (!isContentSafe(reply)) reply = SAFE_FALLBACK;
    reply = sanitizeMentions(reply);

    await message.reply(reply.slice(0, 2000));
  } catch (err) {
    console.error('Ошибка генерации:', err);
    await message.reply('Что-то пошло не так, попробуй ещё раз чуть позже 😅');
  }
}
