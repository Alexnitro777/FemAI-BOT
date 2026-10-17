/**
 * Safe Logger utility that masks sensitive tokens and keys.
 */

const SECRET_PATTERNS = [
  /sk-or-v1-[a-zA-Z0-9_-]+/gi,
  /sk-or-[a-zA-Z0-9_-]+/gi,
  /[MN][A-Za-z\d]{23,}\.[\w-]{6}\.[\w-]{27,}/g // Discord Bot token format
];

function sanitize(message: string): string {
  let cleaned = message;
  for (const pattern of SECRET_PATTERNS) {
    cleaned = cleaned.replace(pattern, '***REDACTED_SECRET***');
  }
  return cleaned;
}

function timestamp(): string {
  return new Date().toISOString();
}

export const logger = {
  info(msg: string, ...args: unknown[]) {
    console.log(`[${timestamp()}] [INFO]  ${sanitize(msg)}`, ...args);
  },
  warn(msg: string, ...args: unknown[]) {
    console.warn(`[${timestamp()}] [WARN]  ${sanitize(msg)}`, ...args);
  },
  error(msg: string, ...args: unknown[]) {
    console.error(`[${timestamp()}] [ERROR] ${sanitize(msg)}`, ...args);
  },
  debug(msg: string, ...args: unknown[]) {
    if (process.env.DEBUG === 'true') {
      console.debug(`[${timestamp()}] [DEBUG] ${sanitize(msg)}`, ...args);
    }
  }
};
