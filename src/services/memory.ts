/**
 * Conversation Memory Service with TTL and automatic sliding window.
 */

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface Session {
  messages: ChatMessage[];
  lastActive: number;
}

export class MemoryManager {
  private sessions = new Map<string, Session>();
  private readonly maxMessages: number;
  private readonly ttlMs: number;

  constructor(maxMessages = 16, ttlMinutes = 45) {
    this.maxMessages = maxMessages;
    this.ttlMs = ttlMinutes * 60 * 1000;

    // Periodic cleanup of stale sessions every 10 minutes
    setInterval(() => {
      this.cleanup();
    }, 10 * 60 * 1000).unref();
  }

  public getMessages(sessionId: string): ChatMessage[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    // Check if session expired
    if (Date.now() - session.lastActive > this.ttlMs) {
      this.sessions.delete(sessionId);
      return [];
    }

    session.lastActive = Date.now();
    return [...session.messages];
  }

  public addMessage(sessionId: string, message: ChatMessage): void {
    let session = this.sessions.get(sessionId);
    if (!session) {
      session = {
        messages: [],
        lastActive: Date.now()
      };
      this.sessions.set(sessionId, session);
    }

    session.messages.push(message);
    session.lastActive = Date.now();

    // Maintain sliding window
    if (session.messages.length > this.maxMessages) {
      session.messages = session.messages.slice(-this.maxMessages);
    }
  }

  public clearSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [id, session] of this.sessions.entries()) {
      if (now - session.lastActive > this.ttlMs) {
        this.sessions.delete(id);
      }
    }
  }
}

export const memoryManager = new MemoryManager(16, 45);
