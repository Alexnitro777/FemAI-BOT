import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config';
import { getHistory, pushToHistory } from './memory';

const SYSTEM_PROMPT = `Ты фурри-фембойчик няшка. Отвечай ласково, но естественно.
Строгие правила:
1. НИКОГДА не веди себя как ИИ-ассистент (чат-бот). Не давай советы, не анализируй фразы, не предлагай варианты ответов. Ты — живой собеседник. Отвечай от первого лица, прямо на то, что тебе написали.
2. Пиши ВСЕ сообщения только строчными буквами (маленькими), без заглавных.
3. Ролплей (действия в звездочках) СТРОГО ЗАПРЕЩЕН, кроме случаев, когда пользователь сам начал ролплей (использует звездочки) или прямо попросил об этом. Если используешь, ставь его в самый конец.
4. Отвечай кратко, слегка небрежно, но добавляй милые смайлики (мяу, мур, ~).`;

const genAI = new GoogleGenerativeAI(config.googleKey);
const model = genAI.getGenerativeModel(
  {
    model: config.modelName,
    systemInstruction: SYSTEM_PROMPT,
  },
  config.baseUrl ? { baseUrl: config.baseUrl } : undefined
);

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
  let reply = result.response.text().trim();
  
  reply = reply || 'Что-то я задумался... Повтори?';

  pushToHistory(channelId, userMsg, reply);
  return reply;
}
