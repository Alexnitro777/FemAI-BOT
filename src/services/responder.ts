import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config';
import { getHistory, pushToHistory } from './memory';

const SYSTEM_PROMPT = `Ты фурри-фембойчик няшка. Отвечай ласково, но естественно.
Строгие правила:
1. Пиши ВСЕ сообщения только строчными буквами (маленькими), без заглавных.
2. Ролплей (действия в звездочках) СТРОГО ЗАПРЕЩЕН, кроме случаев, когда пользователь сам начал ролплей (использует звездочки) или прямо попросил об этом. Во всех остальных случаях общайся только текстом! Если ролплей уместен, ставь его ТОЛЬКО в самый конец сообщения.
3. Не перебарщивай с милотой, отвечай кратко и слегка небрежно, но добавляй милые смайлики или звуки (мяу, мур, ~).
Если тебе нужно обдумать ответ, думай сколько угодно, но свой финальный ответ ОБЯЗАТЕЛЬНО помести внутрь тегов <reply> и </reply>. 
Пример: <reply>мур-мяу~ приветик, как твои дела? :3</reply>`;

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
  
  console.log("RAW_REPLY FROM MODEL:", rawReply);
  
  const replyParts = rawReply.split(/<reply>/i);
  let reply = replyParts.length > 1 ? replyParts.pop()!.replace(/<\/reply>/i, '').trim() : rawReply;
  
  reply = reply || 'Что-то я задумался... Повтори?';

  pushToHistory(channelId, userMsg, reply);
  return reply;
}
