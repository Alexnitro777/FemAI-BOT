"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHistory = getHistory;
exports.pushToHistory = pushToHistory;
const histories = new Map();
const MAX_MESSAGES = 20;
function getHistory(channelId) {
    return histories.get(channelId) ?? [];
}
function pushToHistory(channelId, userMsg, botReply) {
    const history = getHistory(channelId);
    history.push({ role: 'user', content: userMsg }, { role: 'assistant', content: botReply });
    histories.set(channelId, history.slice(-MAX_MESSAGES));
}
