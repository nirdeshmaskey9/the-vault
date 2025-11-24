
import { AIMemory, ChatMessage } from '../types';

const MEMORY_PREFIX = 'THE_VAULT_AI_MEMORY_';

const getInitialMemory = (userId: string): AIMemory => ({
  userId,
  facts: [],
  summary: "New user session started.",
  conversationHistory: [],
  lastInteraction: Date.now()
});

export const getMemory = (userId: string): AIMemory => {
  try {
    const data = localStorage.getItem(`${MEMORY_PREFIX}${userId}`);
    if (data) {
      const parsed = JSON.parse(data);
      // Migration check: ensure new fields exist
      if (!parsed.conversationHistory) parsed.conversationHistory = [];
      if (!parsed.facts) parsed.facts = [];
      return parsed;
    }
    return getInitialMemory(userId);
  } catch {
    return getInitialMemory(userId);
  }
};

export const saveMemory = (memory: AIMemory) => {
  memory.lastInteraction = Date.now();
  // Limit conversation history to last 50 messages to prevent LS overflow
  if (memory.conversationHistory.length > 50) {
    memory.conversationHistory = memory.conversationHistory.slice(-50);
  }
  localStorage.setItem(`${MEMORY_PREFIX}${memory.userId}`, JSON.stringify(memory));
};

export const addFact = (userId: string, fact: string) => {
  const mem = getMemory(userId);
  if (!mem.facts.includes(fact)) {
    mem.facts.push(fact);
    saveMemory(mem);
    console.log(`[MEMORY] Fact added for ${userId}: ${fact}`);
  }
};

export const saveConversationMessage = (userId: string, message: ChatMessage) => {
  const mem = getMemory(userId);
  mem.conversationHistory.push(message);
  saveMemory(mem);
};

export const getMemoryContextBlock = (userId: string): string => {
  const mem = getMemory(userId);
  return `
    [LONG TERM MEMORY]
    User: ${userId}
    Facts/Notes:
    ${mem.facts.length > 0 ? mem.facts.map(f => `- ${f}`).join('\n') : "No specific facts recorded yet."}
    
    [PREVIOUS CONVERSATION SUMMARY]
    ${mem.conversationHistory.slice(-5).map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n')}
  `;
};
