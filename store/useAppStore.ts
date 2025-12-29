import { create } from 'zustand';
import { AppState, Expense, Member, Trip } from '../types';
import { generateId } from '../utils/format';
import { saveToDB, loadAllFromDB, deleteFromDB, clearStore } from '../services/db';
import { MEMBER_COLORS, AVATARS } from '../constants';

interface ExtendedAppState extends AppState {
  // Extended types if needed, but AppState covers it
}

export const useAppStore = create<ExtendedAppState>((set, get) => ({
  trips: [],
  trip: null,
  members: [],
  expenses: [],
  isLoading: true,
  
  isExpenseModalOpen: false,
  editingExpenseId: null,
  isCreatingTrip: false,

  openExpenseModal: () => set({ isExpenseModalOpen: true }),
  closeExpenseModal: () => set({ isExpenseModalOpen: false, editingExpenseId: null }),
  setEditingExpense: (id) => set({ editingExpenseId: id, isExpenseModalOpen: !!id }),

  startCreatingTrip: () => set({ isCreatingTrip: true }),
  cancelCreatingTrip: () => set({ isCreatingTrip: false }),

  loadTrip: async () => {
    set({ isLoading: true });
    try {
      const data = await loadAllFromDB();
      
      const allTrips = Array.isArray(data.trip) ? data.trip : (data.trip ? [data.trip] : []);
      const allMembers = Array.isArray(data.members) ? data.members : [];
      const allExpenses = Array.isArray(data.expenses) ? data.expenses : [];

      if (allTrips.length > 0) {
          const sortedTrips = (allTrips as Trip[]).sort((a, b) => (b.lastOpenedAt || 0) - (a.lastOpenedAt || 0));
          const activeTrip = sortedTrips[0];

          const activeMembers = allMembers.filter(m => m.tripId === activeTrip.id || !m.tripId);
          const activeExpenses = allExpenses.filter(e => e.tripId === activeTrip.id || !e.tripId);

          set({ 
              trips: sortedTrips, 
              trip: activeTrip, 
              members: activeMembers, 
              expenses: activeExpenses 
          });
      } else {
          set({ trips: [], trip: null, members: [], expenses: [] });
      }
    } catch (e) {
      console.error("Failed to load DB", e);
      set({ trips: [], trip: null, members: [], expenses: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  startTrip: async (name, currency, initialMembers) => {
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
            tripId: newTrip.id,
            name: m.name,
            avatar: m.avatar,
            color: MEMBER_COLORS[index % MEMBER_COLORS.length],
        }));

        await saveToDB('trip', newTrip);
        await saveToDB('members', members);

        const { trips } = get();
        set({ 
            trips: [...trips, newTrip], 
            trip: newTrip, 
            members: members, 
            expenses: [], 
            isCreatingTrip: false,
            isLoading: false 
        });
    } catch (e) {
        console.error("Failed to start trip", e);
    }
  },

  switchTrip: async (tripId: string) => {
      const { trips } = get();
      const targetTrip = trips.find(t => t.id === tripId);
      
      if (targetTrip) {
          set({ isLoading: true });
          
          const updatedTrip = { ...targetTrip, lastOpenedAt: Date.now() };
          await saveToDB('trip', updatedTrip);

          const data = await loadAllFromDB();
          const allMembers = Array.isArray(data.members) ? data.members : [];
          const allExpenses = Array.isArray(data.expenses) ? data.expenses : [];
          
          const activeMembers = allMembers.filter(m => m.tripId === tripId);
          const activeExpenses = allExpenses.filter(e => e.tripId === tripId);
          
          const updatedTrips = trips.map(t => t.id === tripId ? updatedTrip : t);

          set({
              trips: updatedTrips,
              trip: updatedTrip,
              members: activeMembers,
              expenses: activeExpenses,
              isLoading: false,
              isCreatingTrip: false
          });
      }
  },

  deleteTrip: async (tripId: string) => {
      const { trips } = get();
      await deleteFromDB('trip', tripId);
      
      const data = await loadAllFromDB();
      const membersToDelete = (data.members as Member[]).filter(m => m.tripId === tripId);
      const expensesToDelete = (data.expenses as Expense[]).filter(e => e.tripId === tripId);
      
      for (const m of membersToDelete) await deleteFromDB('members', m.id);
      for (const e of expensesToDelete) await deleteFromDB('expenses', e.id);

      const remainingTrips = trips.filter(t => t.id !== tripId);
      
      if (remainingTrips.length > 0) {
          const nextTrip = remainingTrips[0];
          await get().switchTrip(nextTrip.id);
          set({ trips: remainingTrips });
      } else {
          set({ trips: [], trip: null, members: [], expenses: [] });
      }
  },

  addMember: (name: string) => {
    const { members, trip } = get();
    if (!trip) return;

    const safeMembers = Array.isArray(members) ? members : [];
    
    const newMember: Member = {
      id: generateId(),
      tripId: trip.id,
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
        const { expenses, trip } = get();
        if (!trip) return;

        const safeExpenses = Array.isArray(expenses) ? expenses : [];
    
        const newExpense: Expense = {
          ...expenseData,
          tripId: trip.id,
          id: generateId(),
          date: Date.now(),
        };
    
        const updatedExpenses = [newExpense, ...safeExpenses];
        set({ expenses: updatedExpenses });
        
        saveToDB('expenses', newExpense);
    } catch (err) {
        console.error("CRITICAL: Error in addExpense action", err);
    }
  },

  updateExpense: async (id, expenseData) => {
    const { expenses, trip } = get();
    if (!trip) return;

    const existingExpense = expenses.find(e => e.id === id);
    if (!existingExpense) return;

    const updatedExpense: Expense = {
        ...existingExpense,
        ...expenseData,
        tripId: trip.id,
        id: id,
    };

    const updatedExpenses = expenses.map(e => e.id === id ? updatedExpense : e);
    set({ expenses: updatedExpenses });
    
    await saveToDB('expenses', updatedExpense);
  },

  deleteExpense: async (id) => {
    const { expenses } = get();
    const safeExpenses = Array.isArray(expenses) ? expenses : [];
    
    const updatedExpenses = safeExpenses.filter(e => e.id !== id);
    set({ expenses: updatedExpenses });
    
    await deleteFromDB('expenses', id);
  }
}));