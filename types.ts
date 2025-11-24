
export enum AccountType {
  BANK = 'BANK',
  CASH = 'CASH',
  CREDIT = 'CREDIT',
  INVESTMENT = 'INVESTMENT',
  OTHER = 'OTHER'
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
  metaOrigin: 'manual' | 'recurring' | 'ai_generated' | 'receipt_scan' | 'transfer';
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
  userId: string;
  facts: string[]; // Explicit facts (e.g., "User wants to buy a house in 2025")
  summary: string; // Long-term narrative summary
  conversationHistory: ChatMessage[]; // Last N messages for context
  lastInteraction: number;
}

// Artifacts (Simulations)
export interface Artifact {
  id: string;
  title: string;
  code: string; // HTML/JS content
  isVisible: boolean;
}

// Modal Types
export enum ModalType {
  NONE = 'NONE',
  ADD_ACCOUNT = 'ADD_ACCOUNT',
  EDIT_ACCOUNT = 'EDIT_ACCOUNT',
  ADD_EXPENSE = 'ADD_EXPENSE',
  ADD_INCOME = 'ADD_INCOME',
  ADD_DEBT = 'ADD_DEBT',
  ADD_GOAL = 'ADD_GOAL',
  SETTINGS = 'SETTINGS',
  PROFILE = 'PROFILE',
  RECEIPT_PREVIEW = 'RECEIPT_PREVIEW',
  PAYMENT = 'PAYMENT',
  HISTORY = 'HISTORY',
  TRANSFER = 'TRANSFER'
}

export interface PaymentFormData {
  targetId: number;
  targetName: string;
  type: 'DEBT' | 'SAVINGS';
  amountCents: number;
  accountId: number;
}

export interface TransferFormData {
  fromAccountId: number;
  toAccountId: number;
  amountCents: number;
}

export interface ReceiptData {
  merchant: string;
  date: string;
  total: number;
  category: string;
}

export interface HistoryModalData {
  title: string;
  filterTerm: string; // term to search in notes to find related transactions
}

export interface BatchTransaction {
    date: string;
    amount: number;
    merchant: string;
    category: string;
}

export type AIState = 'idle' | 'listening' | 'thinking' | 'speaking';
