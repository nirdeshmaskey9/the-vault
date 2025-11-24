
export enum AccountType {
  BANK = 'BANK',
  CASH = 'CASH',
  CREDIT = 'CREDIT',
  INVESTMENT = 'INVESTMENT',
  OTHER = 'OTHER'
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface UserProfile {
  name: string;
  email?: string;
  currency: string;
  financialGoal: string;
  riskTolerance: 'low' | 'medium' | 'high';
}

export interface Account {
  id: number;
  name: string;
  type: AccountType;
  balanceCents: number;
  notes?: string;
  createdAt: string;
}

export interface Category {
  id: number;
  name: string;
  color: string;
}

export interface Expense {
  id: number;
  date: string;
  amountCents: number;
  categoryId: number;
  accountId: number;
  notes: string;
  createdAt: string;
  metaOrigin: 'manual' | 'recurring' | 'ai_generated' | 'receipt_scan';
  receiptImage?: string; // base64
}

export interface Income {
  id: number;
  date: string;
  amountCents: number;
  source: string;
  accountId: number;
  notes: string;
}

export interface Debt {
  id: number;
  name: string;
  totalAmountCents: number;
  remainingBalanceCents: number;
  dueDate?: string;
  minPaymentCents?: number;
}

export interface SavingsGoal {
  id: number;
  name: string;
  goalCents: number;
  currentCents: number;
  targetDate?: string;
  active: boolean;
}

export interface UserStats {
  level: number;
  xp: number;
  nextLevelXp: number;
  title: string;
  streakDays: number;
}

export interface AIInsight {
  id: string;
  type: 'warning' | 'tip' | 'prediction';
  message: string;
  impact?: string;
}

// Chat interfaces
export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isTyping?: boolean;
  audioBase64?: string;
  modelUsed?: string;
  groundingMetadata?: any;
  attachment?: {
    type: 'image';
    data: string; // base64
    mimeType: string;
  };
}

export interface AIMemory {
  userName: string;
  facts: string[];
  preferences: Record<string, string>;
  lastInteraction: number;
}

// Artifacts (Simulations)
export interface Artifact {
  id: string;
  title: string;
  type: 'html' | 'image';
  content: string; // HTML/JS content or Base64 Image
  isVisible: boolean;
}

// Modal Types
export enum ModalType {
  NONE = 'NONE',
  ADD_ACCOUNT = 'ADD_ACCOUNT',
  ADD_EXPENSE = 'ADD_EXPENSE',
  ADD_INCOME = 'ADD_INCOME',
  ADD_DEBT = 'ADD_DEBT',
  ADD_GOAL = 'ADD_GOAL',
  SETTINGS = 'SETTINGS',
  PROFILE = 'PROFILE',
  RECEIPT_PREVIEW = 'RECEIPT_PREVIEW',
  PAYMENT = 'PAYMENT',
  CONNECT_BANK = 'CONNECT_BANK'
}

export interface ReceiptData {
  merchant: string;
  date: string;
  total: number;
  category: string;
}

export type AIState = 'idle' | 'listening' | 'thinking' | 'speaking';

export interface NewTransactionForm {
  amount: string;
  category: string;
  account: string;
  date: string;
  notes: string;
  type: 'EXPENSE' | 'INCOME';
}

export interface PaymentFormData {
  targetId: number; // Debt ID or Savings ID
  targetName: string;
  amountCents: number;
  fromAccountId: number;
  type: 'DEBT_PAYMENT' | 'SAVINGS_CONTRIBUTION';
}

// Views
export enum View {
  DASHBOARD = 'DASHBOARD',
  ACCOUNTS = 'ACCOUNTS',
  EXPENSES = 'EXPENSES',
  INCOME = 'INCOME',
  DEBTS = 'DEBTS',
  SAVINGS = 'SAVINGS',
  CALENDAR = 'CALENDAR',
  ROADMAP = 'ROADMAP',
  RESOURCES = 'RESOURCES'
}

export interface FinancialRank {
  title: string;
  minNetWorth: number;
  perks: string;
  icon: string;
}
