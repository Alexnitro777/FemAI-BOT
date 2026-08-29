export type ChatMessage = { role: 'user' | 'assistant'; content: string };

const histories = new Map<string, ChatMessage[]>();
const MAX_MESSAGES = 20;

export function getHistory(channelId: string): ChatMessage[] {
  return histories.get(channelId) ?? [];
}

export function pushToHistory(channelId: string, userMsg: string, botReply: string) {
  const history = getHistory(channelId);
  history.push({ role: 'user', content: userMsg }, { role: 'assistant', content: botReply });
  histories.set(channelId, history.slice(-MAX_MESSAGES));
}
