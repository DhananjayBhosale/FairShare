// Core Entities

export interface Member {
  id: string;
  tripId: string; // Linked to a specific trip
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
  tripId: string; // Linked to a specific trip
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
  trips: Trip[]; // List of all available trips
  trip: Trip | null; // Currently active trip
  members: Member[]; // Members of the active trip
  expenses: Expense[]; // Expenses of the active trip
  isLoading: boolean;
  
  // Actions
  loadTrip: () => Promise<void>;
  
  // Trip Management
  startTrip: (name: string, currency: string, initialMembers: { name: string, avatar: string, color: string }[]) => Promise<void>;
  switchTrip: (tripId: string) => Promise<void>;
  deleteTrip: (tripId: string) => Promise<void>;
  
  // Creation Flow
  isCreatingTrip: boolean;
  startCreatingTrip: () => void;
  cancelCreatingTrip: () => void;

  // Member/Expense Actions (Scoped to active trip)
  addMember: (name: string) => void;
  updateMember: (id: string, name: string, color: string) => void;
  removeMember: (id: string) => void;
  
  // Expense Management
  isExpenseModalOpen: boolean;
  editingExpenseId: string | null; // ID of expense being edited
  openExpenseModal: () => void;
  closeExpenseModal: () => void;
  setEditingExpense: (id: string | null) => void;

  addExpense: (expense: Omit<Expense, 'id' | 'date' | 'tripId'>) => void;
  updateExpense: (id: string, expense: Omit<Expense, 'id' | 'date' | 'tripId'>) => Promise<void>;
  deleteExpense: (id: string) => void;
}