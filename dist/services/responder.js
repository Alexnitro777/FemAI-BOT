"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReply = generateReply;
const generative_ai_1 = require("@google/generative-ai");
const config_1 = require("../config");
const memory_1 = require("./memory");
const SYSTEM_PROMPT = `Ты дружелюбная собеседница. Отвечай кратко и по делу.`;
const genAI = new generative_ai_1.GoogleGenerativeAI(config_1.config.googleKey);
const model = genAI.getGenerativeModel({
    model: config_1.config.modelName,
    systemInstruction: SYSTEM_PROMPT,
});
async function generateReply(text, username, channelId) {
    const userMsg = `${username}: ${text}`;
    const chat = model.startChat({
        history: (0, memory_1.getHistory)(channelId).map((m) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
        })),
        generationConfig: { maxOutputTokens: 300, temperature: 0.8 },
    });
    const result = await chat.sendMessage(userMsg);
    const reply = result.response.text().trim() || 'Что-то я задумался... Повтори?';
    (0, memory_1.pushToHistory)(channelId, userMsg, reply);
    return reply;
}
