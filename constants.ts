import { Category } from './types';

export const CURRENCY_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export const formatCurrency = (cents: number) => {
  return CURRENCY_FORMATTER.format(cents / 100);
};

export const CATEGORIES: Category[] = [
  { id: 1, name: 'Food & Dining', color: '#f43f5e' }, // Rose
  { id: 2, name: 'Transportation', color: '#3b82f6' }, // Blue
  { id: 3, name: 'Housing', color: '#8b5cf6' }, // Violet
  { id: 4, name: 'Entertainment', color: '#eab308' }, // Yellow
  { id: 5, name: 'Shopping', color: '#ec4899' }, // Pink
  { id: 6, name: 'Utilities', color: '#06b6d4' }, // Cyan
  { id: 7, name: 'Health', color: '#10b981' }, // Emerald
  { id: 8, name: 'Investment', color: '#6366f1' }, // Indigo
];

export const LEVEL_TITLES = [
  "Novice Saver",
  "Budget Apprentice",
  "Coin Keeper",
  "Vault Guardian",
  "Fiscal Strategist",
  "Wealth Architect",
  "Master of Coin",
  "Tycoon",
  "Titan",
  "Vault Legend"
];

export const XP_PER_ACTION = {
  ADD_EXPENSE: 10,
  ADD_INCOME: 20,
  PAY_DEBT: 50,
  REACH_GOAL: 500,
  DAILY_CHECKIN: 15
};
