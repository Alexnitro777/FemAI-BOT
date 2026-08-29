const BANNED_PATTERNS: RegExp[] = [
  /дурак|идиот|туп(ой|ая|ица)|дебил|урод/i,
  /секс|порн|nsfw|18\+|эротик|интим/i,
];

export const SAFE_FALLBACK = 'Хм, не знаю, что на это ответить. Спроси что-нибудь ещё!';

export function isContentSafe(text: string): boolean {
  return !BANNED_PATTERNS.some((p) => p.test(text));
}
