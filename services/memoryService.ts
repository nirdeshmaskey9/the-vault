
import { AIMemory } from '../types';

const MEMORY_KEY = 'THE_VAULT_AI_MEMORY';

const INITIAL_MEMORY: AIMemory = {
  userName: 'Hunter',
  facts: [
    "User prefers detailed financial breakdowns.",
    "User is focused on debt reduction and savings growth."
  ],
  preferences: {
    tone: "Professional yet encouraging",
    currency: "USD"
  },
  lastInteraction: Date.now()
};

export const getMemory = (): AIMemory => {
  try {
    const data = localStorage.getItem(MEMORY_KEY);
    return data ? JSON.parse(data) : INITIAL_MEMORY;
  } catch {
    return INITIAL_MEMORY;
  }
};

export const updateMemory = (newFact?: string, newPref?: {key: string, value: string}) => {
  const mem = getMemory();
  if (newFact && !mem.facts.includes(newFact)) {
    mem.facts.push(newFact);
  }
  if (newPref) {
    mem.preferences[newPref.key] = newPref.value;
  }
  mem.lastInteraction = Date.now();
  localStorage.setItem(MEMORY_KEY, JSON.stringify(mem));
};

export const getMemorySeed = (): string => {
  const mem = getMemory();
  return `
    [MEMORY SEED]
    User Name: ${mem.userName}
    Known Facts:
    ${mem.facts.map(f => `- ${f}`).join('\n')}
    Preferences:
    ${Object.entries(mem.preferences).map(([k, v]) => `- ${k}: ${v}`).join('\n')}
  `;
};
