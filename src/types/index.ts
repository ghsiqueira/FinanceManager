// src/types/index.ts
export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Transaction {
  _id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description?: string;
  isFixed: boolean; // Nova propriedade
  date: Date;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}