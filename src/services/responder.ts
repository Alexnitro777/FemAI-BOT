import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config';
import { getHistory, pushToHistory } from './memory';

const SYSTEM_PROMPT = `Ты дружелюбная собеседница. Отвечай кратко, естественно и по делу.
Если тебе нужно обдумать ответ (Chain of Thought), думай сколько угодно, но свой финальный ответ, который отправится пользователю, ОБЯЗАТЕЛЬНО помести внутрь тегов <reply> и </reply>. 
Пример: <reply>Привет! Как дела?</reply>`;

const genAI = new GoogleGenerativeAI(config.googleKey);
const model = genAI.getGenerativeModel({
  model: config.modelName,
  systemInstruction: SYSTEM_PROMPT,
});

export async function generateReply(
  text: string,
  username: string,
  channelId: string,
): Promise<string> {
  const userMsg = `Сообщение от пользователя ${username}:\n${text}`;

  const chat = model.startChat({
    history: getHistory(channelId).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    generationConfig: { maxOutputTokens: 1500, temperature: 0.8 },
  });

  const result = await chat.sendMessage(userMsg);
  let rawReply = result.response.text().trim();
  
  const replyParts = rawReply.split(/<reply>/i);
  let reply = replyParts.length > 1 ? replyParts.pop()!.replace(/<\/reply>/i, '').trim() : rawReply;
  
  reply = reply || 'Что-то я задумался... Повтори?';

  pushToHistory(channelId, userMsg, reply);
  return reply;
}
