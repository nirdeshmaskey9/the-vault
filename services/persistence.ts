
import { Account, Expense, Income, Debt, SavingsGoal, UserStats, AIInsight } from '../types';

// We use a prefix, but real dynamic keys will be passed in
const STORAGE_PREFIX = 'THE_VAULT_DATA_';

export interface AppState {
  accounts: Account[];
  expenses: Expense[];
  income: Income[];
  debts: Debt[];
  savings: SavingsGoal[];
  stats: UserStats;
  insights: AIInsight[];
}

export const saveState = (state: AppState, userId: string = 'guest') => {
  try {
    const key = `${STORAGE_PREFIX}${userId}`;
    localStorage.setItem(key, JSON.stringify(state));
    console.log(`Vault State Saved for user: ${userId}`);
  } catch (e) {
    console.error("Failed to save state", e);
  }
};

export const loadState = (userId: string = 'guest'): AppState | null => {
  try {
    const key = `${STORAGE_PREFIX}${userId}`;
    const data = localStorage.getItem(key);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Failed to load state", e);
  }
  return null;
};

export const clearState = (userId: string = 'guest') => {
  const key = `${STORAGE_PREFIX}${userId}`;
  localStorage.removeItem(key);
  window.location.reload();
};
