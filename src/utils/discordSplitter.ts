/**
 * Utility to split long messages into safe chunks for Discord (<= 2000 characters),
 * preserving markdown formatting and code blocks (```).
 */

export function splitDiscordMessage(text: string, maxLength = 1950): string[] {
  if (!text || text.length <= maxLength) {
    return [text || ''];
  }

  const chunks: string[] = [];
  let remaining = text;
  let inCodeBlock = false;
  let codeBlockLang = '';

  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      // If we are currently inside an unclosed codeblock from previous split, close it
      chunks.push(remaining);
      break;
    }

    let splitIndex = -1;

    // Try finding double newline
    const doubleNewline = remaining.lastIndexOf('\n\n', maxLength);
    if (doubleNewline > maxLength * 0.4) {
      splitIndex = doubleNewline + 2;
    } else {
      // Try finding single newline
      const singleNewline = remaining.lastIndexOf('\n', maxLength);
      if (singleNewline > maxLength * 0.4) {
        splitIndex = singleNewline + 1;
      } else {
        // Try finding whitespace
        const space = remaining.lastIndexOf(' ', maxLength);
        if (space > maxLength * 0.4) {
          splitIndex = space + 1;
        } else {
          // Hard split if no good boundary found
          splitIndex = maxLength;
        }
      }
    }

    let chunk = remaining.slice(0, splitIndex);
    remaining = remaining.slice(splitIndex);

    // Track code blocks in this chunk
    const codeBlockMatches = chunk.match(/```([a-zA-Z0-9_-]*)/g);
    if (codeBlockMatches) {
      for (const match of codeBlockMatches) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeBlockLang = match.replace('```', '').trim();
        } else {
          inCodeBlock = false;
          codeBlockLang = '';
        }
      }
    }

    // If chunk ends inside a code block, close it and open it in the next chunk
    if (inCodeBlock) {
      chunk += '\n```';
      remaining = `\`\`\`${codeBlockLang}\n${remaining}`;
    }

    chunks.push(chunk);
  }

  return chunks;
}
