import { type Client, type Message } from 'discord.js';
import { config } from '../config/config.js';
import {
  SAFE_ALLOWED_MENTIONS,
  sanitizeDiscordMentions,
  checkPromptInjection,
  rateLimiter
} from '../services/security.js';
import { memoryManager } from '../services/memory.js';
import { generateChatResponse } from '../services/openrouter.js';
import { splitDiscordMessage } from '../utils/discordSplitter.js';
import { logger } from '../utils/logger.js';

export async function onMessageCreate(client: Client<true>, message: Message) {
  // Игнорируем сообщения от ботов и вебхуков
  if (message.author.bot || message.webhookId) return;

  const botId = client.user.id;
  const isDirectlyMentioned = message.mentions.users.has(botId);
  const isConfiguredChannel = config.channelIds.includes(message.channelId);
  const isDM = message.channel.isDMBased();

  let isReplyToBot = false;
  if (message.reference?.messageId) {
    try {
      const referenced = await message.channel.messages.fetch(message.reference.messageId);
      if (referenced.author.id === botId) {
        isReplyToBot = true;
      }
    } catch {
      // Игнорируем ошибку, если сообщение недоступно
    }
  }

  // Проверяем, адресовано ли сообщение боту
  if (!isDirectlyMentioned && !isConfiguredChannel && !isReplyToBot && !isDM) {
    return;
  }

  // Очищаем текст сообщения от упоминания бота
  const mentionRegex = new RegExp(`<@!?${botId}>`, 'g');
  const cleanPrompt = message.content.replace(mentionRegex, '').trim();

  // Если пользователь просто пинганул бота без текста
  if (!cleanPrompt) {
    await message.reply({
      content: 'Привет-привет! Что-то случилось, или ты просто соскучился по мне? (⁄ ⁄>⁄ ▽ ⁄<⁄ ⁄) 💕',
      allowedMentions: SAFE_ALLOWED_MENTIONS
    });
    return;
  }

  // Защита от спама огромными простынями текста
  if (cleanPrompt.length > 1500) {
    await message.reply({
      content: 'Ого, какое длинное сообщение! Я пока не могу прочитать так много за один раз, сократи чуть-чуть, пожалуйста ~nya (｡•́︿•̀｡)',
      allowedMentions: SAFE_ALLOWED_MENTIONS
    });
    return;
  }

  // Защита от попыток инъекций и взлома системного промпта
  const injection = checkPromptInjection(cleanPrompt);
  if (injection.isSuspicious) {
    logger.warn(`Предотвращена попытка инъекции от ${message.author.tag} (${message.author.id}): "${cleanPrompt}"`);
    await message.reply({
      content: 'Хи-хи, какие странные заклинания ты шепчешь! Я же твой друг, а не терминал для системных команд, глупенький ~nya! (⁄ ⁄>⁄ ▽ ⁄<⁄ ⁄) О чём нормальном поболтаем?',
      allowedMentions: SAFE_ALLOWED_MENTIONS
    });
    return;
  }

  // Проверка кулдауна и рейт-лимита
  const rateCheck = rateLimiter.canExecute(message.author.id);
  if (!rateCheck.allowed) {
    await message.reply({
      content: rateCheck.reason ?? 'Подожди пару секундочек, пожалуйста ~nya ✨',
      allowedMentions: SAFE_ALLOWED_MENTIONS
    });
    return;
  }

  rateLimiter.startGeneration(message.author.id);

  // Имитация набора текста
  let typingInterval: NodeJS.Timeout | null = null;
  const sendTypingSafe = async () => {
    try {
      if ('sendTyping' in message.channel) {
        await message.channel.sendTyping();
      }
    } catch {
      // Игнорируем ошибки отсутствия прав на sendTyping
    }
  };

  await sendTypingSafe();
  typingInterval = setInterval(sendTypingSafe, 6000);

  const sessionId = message.channelId;

  try {
    const history = memoryManager.getMessages(sessionId);
    const rawReply = await generateChatResponse(history, cleanPrompt);

    // Санитизация текста (защита от @everyone, @here, ролей)
    const sanitizedReply = sanitizeDiscordMentions(rawReply);

    // Безопасное сохранение в историю
    memoryManager.addMessage(sessionId, { role: 'user', content: cleanPrompt });
    memoryManager.addMessage(sessionId, { role: 'assistant', content: sanitizedReply });

    // Разбиение на части, если ответ > 1950 символов
    const chunks = splitDiscordMessage(sanitizedReply);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      if (i === 0) {
        await message.reply({
          content: chunk,
          allowedMentions: SAFE_ALLOWED_MENTIONS
        });
      } else {
        // Последующие фрагменты отправляем в канал
        if ('send' in message.channel) {
          await message.channel.send({
            content: chunk,
            allowedMentions: SAFE_ALLOWED_MENTIONS
          });
        }
      }
    }
  } catch (err) {
    logger.error('Непредвиденная ошибка при обработке сообщения:', err);
    await message.reply({
      content: 'Ой, что-то пошло не так при генерации ответа... Давай попробуем ещё разочек? (｡•́︿•̀｡)',
      allowedMentions: SAFE_ALLOWED_MENTIONS
    });
  } finally {
    if (typingInterval) {
      clearInterval(typingInterval);
    }
    rateLimiter.endGeneration(message.author.id);
  }
}
