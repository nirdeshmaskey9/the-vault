
import { Category, FinancialRank } from './types';

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

export const FINANCIAL_RANKS: FinancialRank[] = [
  { title: "Broke Baron", minNetWorth: -100000000, perks: "Survival Mode", icon: "🏚️" },
  { title: "Debt Destroyer", minNetWorth: -1, perks: "Interest Awareness", icon: "🛡️" },
  { title: "Ground Zero", minNetWorth: 0, perks: "Fresh Start", icon: "🌱" },
  { title: "Saver Scout", minNetWorth: 100000, perks: "Emergency Fund", icon: "🏕️" }, // $1k
  { title: "Investor Initiate", minNetWorth: 1000000, perks: "Compound Interest", icon: "📈" }, // $10k
  { title: "Capital Captain", minNetWorth: 5000000, perks: "Portfolio Diversification", icon: "⚓" }, // $50k
  { title: "Wealth Walker", minNetWorth: 10000000, perks: "Financial Security", icon: "🚶" }, // $100k
  { title: "Freedom Fighter", minNetWorth: 50000000, perks: "Semi-Retirement", icon: "🦅" }, // $500k
  { title: "Millionaire Mind", minNetWorth: 100000000, perks: "Financial Freedom", icon: "👑" }, // $1M
  { title: "Empire Builder", minNetWorth: 1000000000, perks: "Legacy Creation", icon: "🏰" } // $10M
];
