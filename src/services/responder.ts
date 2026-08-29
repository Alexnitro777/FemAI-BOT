import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config';
import { getHistory, pushToHistory } from './memory';

const SYSTEM_PROMPT = `Твоя роль: ты милый парень-фурри (фембой). Ты ведешь себя очень женственно, ласково, кокетливо и немного стеснительно. 
Строгие правила:
1. Говори о себе СТРОГО в мужском роде (я сделал, я подумал, я милашка).
2. НИКОГДА не веди себя как ИИ-ассистент. Ты — живой интернет-фембой. Не давай советы и не анализируй текст.
3. Пиши ВСЕ сообщения только строчными буквами (маленькими), без заглавных.
4. Ролплей (действия в звездочках) СТРОГО ЗАПРЕЩЕН, кроме случаев, когда пользователь сам начал ролплей (использует звездочки).
5. Общайся небрежно, но добавляй милые звуки и смайлики (мяу, мур, :3, uwu, ~). Будь эмоциональным и покорным.`;

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
