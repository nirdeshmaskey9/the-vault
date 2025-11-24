import { Account, AccountType, Expense, Income, Debt, SavingsGoal, UserStats, AIInsight } from '../types';

const generateDate = (daysBack: number) => {
  const date = new Date();
  date.setDate(date.getDate() - daysBack);
  return date.toISOString().split('T')[0];
};

export const generateMockData = () => {
  // Accounts
  const accounts: Account[] = [
    { id: 1, name: 'Chase Checking', type: AccountType.BANK, balanceCents: 452000, createdAt: generateDate(365) },
    { id: 2, name: 'Amex Gold', type: AccountType.CREDIT, balanceCents: -125000, createdAt: generateDate(200) },
    { id: 3, name: 'Emergency Fund', type: AccountType.CASH, balanceCents: 1500000, createdAt: generateDate(500) },
    { id: 4, name: 'Robinhood', type: AccountType.INVESTMENT, balanceCents: 850000, createdAt: generateDate(150) },
    { id: 5, name: 'Wallet Cash', type: AccountType.CASH, balanceCents: 12000, createdAt: generateDate(10) },
  ];

  // Expenses
  const expenses: Expense[] = [];
  for (let i = 0; i < 60; i++) {
    const amount = Math.floor(Math.random() * 15000) + 500; // $5 to $150
    expenses.push({
      id: i + 1,
      date: generateDate(Math.floor(Math.random() * 60)), // Last 60 days
      amountCents: amount,
      categoryId: Math.floor(Math.random() * 8) + 1,
      accountId: Math.random() > 0.7 ? 2 : 1, // Mostly bank or credit
      notes: `Mock transaction ${i}`,
      createdAt: new Date().toISOString(),
      metaOrigin: 'manual'
    });
  }
  // Add some large expenses
  expenses.push({ id: 101, date: generateDate(5), amountCents: 240000, categoryId: 3, accountId: 1, notes: 'Rent Payment', createdAt: new Date().toISOString(), metaOrigin: 'recurring' });
  expenses.push({ id: 102, date: generateDate(15), amountCents: 15000, categoryId: 6, accountId: 1, notes: 'Electric Bill', createdAt: new Date().toISOString(), metaOrigin: 'recurring' });

  // Income
  const income: Income[] = [
    { id: 1, date: generateDate(2), amountCents: 450000, source: 'Salary', accountId: 1, notes: 'Bi-weekly Paycheck' },
    { id: 2, date: generateDate(32), amountCents: 450000, source: 'Salary', accountId: 1, notes: 'Bi-weekly Paycheck' },
    { id: 3, date: generateDate(10), amountCents: 25000, source: 'Freelance', accountId: 3, notes: 'Logo Design' },
  ];

  // Debts
  const debts: Debt[] = [
    { id: 1, name: 'Student Loan', totalAmountCents: 2500000, remainingBalanceCents: 1800000, dueDate: generateDate(-15) },
    { id: 2, name: 'Car Loan', totalAmountCents: 3000000, remainingBalanceCents: 2200000, dueDate: generateDate(-20) },
  ];

  // Savings
  const savings: SavingsGoal[] = [
    { id: 1, name: 'Tesla Model 3', goalCents: 4000000, currentCents: 850000, active: true, targetDate: '2025-12-31' },
    { id: 2, name: 'Japan Trip', goalCents: 500000, currentCents: 300000, active: true, targetDate: '2024-11-01' },
  ];

  // User Stats
  const userStats: UserStats = {
    level: 5,
    xp: 2450,
    nextLevelXp: 3000,
    title: 'Fiscal Strategist',
    streakDays: 12
  };

  return { accounts, expenses, income, debts, savings, userStats };
};

export const getInitialInsights = (): AIInsight[] => [
  { id: '1', type: 'warning', message: 'Dining expenses are 15% higher than last month.', impact: '-$120.00 potential loss' },
  { id: '2', type: 'tip', message: 'Moving $500 to High Yield Savings could earn you $25/yr more.', impact: 'Optimization' },
  { id: '3', type: 'prediction', message: 'Based on current spending, you will hit your Japan Trip goal 2 weeks early!', impact: 'Positive Trend' },
];
