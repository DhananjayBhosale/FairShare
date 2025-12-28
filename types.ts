// Core Entities

export interface Member {
  id: string;
  name: string;
  color: string;
  avatar: string; // Emoji character
}

export type SplitType = 'EQUAL' | 'EXACT' | 'PERCENT';

export interface SplitDetail {
  memberId: string;
  amount: number; // Stored in minor currency unit (e.g., paise/cents)
}

export interface Expense {
  id: string;
  title: string;
  amount: number; // Total amount in minor units
  paidBy: string; // Member ID who paid
  date: number; // Timestamp
  splitType: SplitType;
  splits: SplitDetail[];
}

export interface Trip {
  id: string;
  name: string;
  currencySymbol: string;
  createdAt: number;
  lastOpenedAt: number;
}

// Derived Data

export interface Balance {
  memberId: string;
  amount: number; // Positive = owed to them, Negative = they owe
}

export interface Settlement {
  from: string; // Member ID
  to: string;   // Member ID
  amount: number;
}

// Store State
export interface AppState {
  trip: Trip | null;
  members: Member[];
  expenses: Expense[];
  isLoading: boolean;
  
  // Actions
  createTrip: (name: string, currency: string) => Promise<void>;
  loadTrip: () => Promise<void>;
  addMember: (name: string) => void;
  updateMember: (id: string, name: string, color: string) => void;
  removeMember: (id: string) => void;
  addExpense: (expense: Omit<Expense, 'id' | 'date'>) => void;
  deleteExpense: (id: string) => void;
  resetTrip: () => Promise<void>;
}