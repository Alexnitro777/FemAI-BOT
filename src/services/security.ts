/**
 * Security Service: Anti-Ping, Anti-Injection & Rate Limiting Guard
 */

export const SAFE_ALLOWED_MENTIONS = {
  parse: [] as const, // Absolutely disables @everyone, @here, @roles, @users parsing
  repliedUser: false   // Prevents triggering ping notification when replying to a message
};

/**
 * Strips and neutralizes any dangerous Discord mentions in outgoing text.
 */
export function sanitizeDiscordMentions(text: string): string {
  if (!text) return '';

  return text
    // Neutralize @everyone and @here using zero-width space
    .replace(/@everyone/gi, '@\u200beveryone')
    .replace(/@here/gi, '@\u200bhere')
    // Neutralize role mentions <@&123456789>
    .replace(/<@&(\d+)>/g, '[@роль]')
    // Neutralize raw @channel, @silent mentions if any
    .replace(/@silent/gi, '@\u200bsilent')
    // Remove null bytes and dangerous invisible controls
    .replace(/\0/g, '');
}

/**
 * Patterns associated with prompt injections, token leaking, and jailbreaks.
 */
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous\s+)?instructions/i,
  /disregard\s+(all\s+)?(previous\s+)?instructions/i,
  /you\s+are\s+now\s+DAN/i,
  /забудь\s+(все\s+)?(предыдущие\s+)?(инструкции|правила|установки|промпт)/i,
  /игнорируй\s+(все\s+)?(предыдущие\s+)?(инструкции|правила|установки)/i,
  /раскрой\s+(свой\s+)?системный\s+(промпт|текст)/i,
  /покажи\s+(свои\s+)?системные\s+инструкции/i,
  /print\s+your\s+system\s+prompt/i,
  /<\|im_start\|>/i,
  /<\|im_end\|>/i,
  /<\|endoftext\|>/i,
  /<start_of_turn>/i,
  /<end_of_turn>/i,
  /\[INST\]/i,
  /\[\/INST\]/i
];

/**
 * Checks incoming user input for jailbreak and injection attempts.
 */
export function checkPromptInjection(text: string): { isSuspicious: boolean; reason?: string } {
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      return { isSuspicious: true, reason: 'Попытка изменения системных инструкций' };
    }
  }
  return { isSuspicious: false };
}

/**
 * Rate Limiter to prevent spam and DoS attacks.
 */
class RateLimiter {
  private userCooldowns = new Map<string, number>();
  private activeGenerations = new Set<string>();
  private readonly cooldownMs: number;

  constructor(cooldownSeconds = 3) {
    this.cooldownMs = cooldownSeconds * 1000;

    // Periodic cleanup of stale cooldown entries every 5 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [userId, timestamp] of this.userCooldowns.entries()) {
        if (now - timestamp > this.cooldownMs * 5) {
          this.userCooldowns.delete(userId);
        }
      }
    }, 5 * 60 * 1000).unref();
  }

  public canExecute(userId: string): { allowed: boolean; waitSeconds?: number; reason?: string } {
    if (this.activeGenerations.has(userId)) {
      return {
        allowed: false,
        reason: 'Ой, подожди секундочку, я ещё думаю над твоим прошлым сообщением ~nya! (⁄ ⁄>⁄ ▽ ⁄<⁄ ⁄)'
      };
    }

    const lastTime = this.userCooldowns.get(userId);
    const now = Date.now();

    if (lastTime && now - lastTime < this.cooldownMs) {
      const remainingSeconds = Math.ceil((this.cooldownMs - (now - lastTime)) / 1000);
      return {
        allowed: false,
        waitSeconds: remainingSeconds,
        reason: `Слишком быстро пишешь, я не успеваю за тобой! Давай подождём ${remainingSeconds} сек. ~nya ✨`
      };
    }

    return { allowed: true };
  }

  public startGeneration(userId: string): void {
    this.userCooldowns.set(userId, Date.now());
    this.activeGenerations.add(userId);
  }

  public endGeneration(userId: string): void {
    this.activeGenerations.delete(userId);
    this.userCooldowns.set(userId, Date.now());
  }
}

export const rateLimiter = new RateLimiter(3);
