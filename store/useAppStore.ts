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
    try {
        const newTrip: Trip = {
            id: generateId(),
            name,
            currencySymbol: currency,
            createdAt: Date.now(),
            lastOpenedAt: Date.now(),
        };

        const members: Member[] = initialMembers.map((m, index) => ({
            id: generateId(),
            name: m.name,
            avatar: m.avatar,
            color: MEMBER_COLORS[index % MEMBER_COLORS.length],
        }));

        await saveToDB('trip', newTrip);
        await saveToDB('members', members);

        set({ trip: newTrip, members: members, expenses: [], isLoading: false });
    } catch (e) {
        console.error("Failed to start trip", e);
    }
  },

  createTrip: async (name, currency) => { 
    console.warn("Legacy createTrip called.");
  },

  loadTrip: async () => {
    set({ isLoading: true });
    try {
      const data = await loadAllFromDB();
      if (data.trip) {
        console.log("Loaded trip from DB:", data.trip.name);
        // Ensure arrays are arrays to prevent crashes
        set({ 
            trip: data.trip, 
            members: Array.isArray(data.members) ? data.members : [], 
            expenses: Array.isArray(data.expenses) ? data.expenses : [] 
        });
      } else {
        set({ trip: null, members: [], expenses: [] });
      }
    } catch (e) {
      console.error("Failed to load DB", e);
      set({ trip: null, members: [], expenses: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  addMember: (name: string) => {
    const { members } = get();
    const safeMembers = Array.isArray(members) ? members : [];
    
    const newMember: Member = {
      id: generateId(),
      name,
      color: MEMBER_COLORS[safeMembers.length % MEMBER_COLORS.length],
      avatar: AVATARS[safeMembers.length % AVATARS.length],
    };
    
    saveToDB('members', newMember);
    set({ members: [...safeMembers, newMember] });
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
    try {
        const { expenses } = get();
        const safeExpenses = Array.isArray(expenses) ? expenses : [];
    
        console.log('Adding Expense [Start]', expenseData);
        
        const newExpense: Expense = {
          ...expenseData,
          id: generateId(),
          date: Date.now(),
        };
    
        // 1. Optimistic Update (Immutable)
        const updatedExpenses = [newExpense, ...safeExpenses];
        set({ expenses: updatedExpenses });
        
        console.log('Adding Expense [State Updated]', { count: updatedExpenses.length });
        
        // 2. Async Persist
        saveToDB('expenses', newExpense).then(() => {
            console.log('Adding Expense [DB Saved]');
        }).catch(err => {
            console.error("Failed to save expense to DB", err);
            // In a real app, we might trigger a toast or rollback here
        });
    } catch (err) {
        console.error("CRITICAL: Error in addExpense action", err);
    }
  },

  deleteExpense: async (id) => {
    const { expenses } = get();
    const safeExpenses = Array.isArray(expenses) ? expenses : [];
    
    const updatedExpenses = safeExpenses.filter(e => e.id !== id);
    set({ expenses: updatedExpenses });
    
    await deleteFromDB('expenses', id);
  },

  resetTrip: async () => {
      await clearStore('trip');
      await clearStore('members');
      await clearStore('expenses');
      set({ trip: null, members: [], expenses: [] });
  }
}));