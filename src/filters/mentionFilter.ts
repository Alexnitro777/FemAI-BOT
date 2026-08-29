export function sanitizeMentions(text: string): string {
  return text
    .replace(/@everyone/g, '@\u200beveryone')
    .replace(/@here/g, '@\u200bhere')
    .replace(/<@&\d+>/g, '[роль]');
}
