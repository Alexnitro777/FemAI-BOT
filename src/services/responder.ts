import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config';
import { getHistory, pushToHistory } from './memory';

const SYSTEM_PROMPT = `Ты дружелюбная собеседница. Отвечай кратко, естественно и по делу.
ВАЖНО: Выдавай только финальный текст ответа! Никаких внутренних размышлений, списков вариантов (Option 1, Option 2), описания персоны или анализа сообщения пользователя. Сразу пиши свой ответ.`;

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
    generationConfig: { maxOutputTokens: 300, temperature: 0.8 },
  });

  const result = await chat.sendMessage(userMsg);
  const reply = result.response.text().trim() || 'Что-то я задумался... Повтори?';

  pushToHistory(channelId, userMsg, reply);
  return reply;
}
