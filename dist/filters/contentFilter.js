"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SAFE_FALLBACK = void 0;
exports.isContentSafe = isContentSafe;
const BANNED_PATTERNS = [
    /дурак|идиот|туп(ой|ая|ица)|дебил|урод/i,
    /секс|порн|nsfw|18\+|эротик|интим/i,
];
exports.SAFE_FALLBACK = 'Хм, не знаю, что на это ответить. Спроси что-нибудь ещё!';
function isContentSafe(text) {
    return !BANNED_PATTERNS.some((p) => p.test(text));
}
