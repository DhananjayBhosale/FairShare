import { create } from 'zustand';
import { AppState, Expense, Member, Trip } from '../types';
import { generateId } from '../utils/format';
import { saveToDB, loadAllFromDB, deleteFromDB, clearStore } from '../services/db';
import { MEMBER_COLORS, AVATARS } from '../constants';

// Extending AppState to support the new initialization flow and UI state
interface ExtendedAppState extends AppState {
  isExpenseModalOpen: boolean; // UI State
  openExpenseModal: () => void;
  closeExpenseModal: () => void;
  startTrip: (name: string, currency: string, initialMembers: { name: string, avatar: string, color: string }[]) => Promise<void>;
}

export const useAppStore = create<ExtendedAppState>((set, get) => ({
  trip: null,
  members: [],
  expenses: [],
  isLoading: true,
  isExpenseModalOpen: false,

  openExpenseModal: () => set({ isExpenseModalOpen: true }),
  closeExpenseModal: () => set({ isExpenseModalOpen: false }),

  startTrip: async (name: string, currency: string, initialMembers: { name: string, avatar: string, color: string }[]) => {
    const newTrip: Trip = {
      id: generateId(),
      name,
      currencySymbol: currency,
      createdAt: Date.now(),
      lastOpenedAt: Date.now(),
    };

    // Convert simple member objects to full Member entities
    // Assign colors from constants if not provided or just cycle through them
    const members: Member[] = initialMembers.map((m, index) => ({
      id: generateId(),
      name: m.name,
      avatar: m.avatar,
      color: MEMBER_COLORS[index % MEMBER_COLORS.length],
    }));

    await saveToDB('trip', newTrip);
    await saveToDB('members', members);

    set({ trip: newTrip, members: members, expenses: [], isLoading: false });
  },

  // Legacy createTrip kept for compatibility
  createTrip: async (name, currency) => { 
    console.warn("Legacy createTrip called. Use startTrip instead.");
  },

  loadTrip: async () => {
    set({ isLoading: true });
    try {
      const data = await loadAllFromDB();
      if (data.trip) {
        set({ trip: data.trip, members: data.members, expenses: data.expenses });
      } else {
        set({ trip: null });
      }
    } catch (e) {
      console.error("Failed to load DB", e);
    } finally {
      set({ isLoading: false });
    }
  },

  addMember: (name: string) => {
    const { members } = get();
    const newMember: Member = {
      id: generateId(),
      name,
      color: MEMBER_COLORS[members.length % MEMBER_COLORS.length],
      avatar: AVATARS[members.length % AVATARS.length],
    };
    
    saveToDB('members', newMember);
    set({ members: [...members, newMember] });
  },

  updateMember: (id, name, color) => {
    const { members } = get();
    const updatedMembers = members.map(m => m.id === id ? { ...m, name, color } : m);
    saveToDB('members', updatedMembers);
    set({ members: updatedMembers });
  },

  removeMember: async (id) => {
    const { expenses, members } = get();
    const hasExpenses = expenses.some(e => e.paidBy === id || e.splits.some(s => s.memberId === id));
    
    if (hasExpenses) {
        alert("Cannot remove member who has existing transactions.");
        return;
    }

    await deleteFromDB('members', id);
    set({ members: members.filter(m => m.id !== id) });
  },

  addExpense: (expenseData) => {
    const { expenses } = get();
    const newExpense: Expense = {
      ...expenseData,
      id: generateId(),
      date: Date.now(),
    };

    saveToDB('expenses', newExpense);
    set({ expenses: [newExpense, ...expenses] });
  },

  deleteExpense: async (id) => {
    const { expenses } = get();
    await deleteFromDB('expenses', id);
    set({ expenses: expenses.filter(e => e.id !== id) });
  },

  resetTrip: async () => {
      await clearStore('trip');
      await clearStore('members');
      await clearStore('expenses');
      set({ trip: null, members: [], expenses: [] });
  }
}));