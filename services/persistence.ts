
import { Account, Expense, Income, Debt, SavingsGoal, UserStats, AIInsight } from '../types';

const STORAGE_KEY = 'THE_VAULT_DATA_V1';

export interface AppState {
  accounts: Account[];
  expenses: Expense[];
  income: Income[];
  debts: Debt[];
  savings: SavingsGoal[];
  stats: UserStats;
  insights: AIInsight[];
}

export const saveState = (state: AppState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    console.log("Vault State Saved");
  } catch (e) {
    console.error("Failed to save state", e);
  }
};

export const loadState = (): AppState | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Failed to load state", e);
  }
  return null;
};

export const clearState = () => {
  localStorage.removeItem(STORAGE_KEY);
  window.location.reload();
};
