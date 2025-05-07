// src/types/index.ts
export interface User {
  id: string;
  email: string;
  name: string;
  theme?: 'light' | 'dark' | 'system';
}

export interface Transaction {
  _id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description?: string;
  isFixed: boolean;
  recurrence?: {
    isRecurrent: boolean;
    frequency?: 'monthly' | 'weekly' | 'yearly';
    dayOfMonth?: number;
    dayOfWeek?: number;
    month?: number;
    nextDate?: Date;
  };
  date: Date;
}

export interface Goal {
  _id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  isExpense: boolean;
  category?: string;
  description?: string;
  createdAt: Date;
}

export interface GoalTransaction {
  _id: string;
  goalId: string;
  amount: number;
  type: 'deposit' | 'withdraw';
  description?: string;
  date: Date;
}

export interface Budget {
  _id: string;
  category: string;
  amount: number;
  period: 'monthly' | 'weekly' | 'yearly';
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
}

export interface Investment {
  _id: string;
  name: string;
  type: 'ações' | 'fundos' | 'renda fixa' | 'poupança' | 'outros';
  initialAmount: number;
  currentAmount: number;
  startDate: Date;
  expectedReturn?: number;
  description?: string;
}

export interface InvestmentTransaction {
  _id: string;
  investmentId: string;
  type: 'aporte' | 'resgate' | 'rendimento';
  amount: number;
  date: Date;
  description?: string;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface ColorTheme {
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  primary: string;
  secondary: string;
  success: string;
  danger: string;
  warning: string;
  info: string;
}

export interface TransactionItemProps {
  transaction: Transaction;
  colors: ColorTheme;
  onPress: () => void;
}