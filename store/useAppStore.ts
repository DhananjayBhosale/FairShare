import { create } from 'zustand';
import { AppState, Expense, Member, Trip } from '../types';
import { generateId } from '../utils/format';
import { saveToDB, loadAllFromDB, deleteFromDB, clearStore } from '../services/db';
import { MEMBER_COLORS, AVATARS } from '../constants';

interface ExtendedAppState extends AppState {
  isExpenseModalOpen: boolean;
  openExpenseModal: () => void;
  closeExpenseModal: () => void;
}

export const useAppStore = create<ExtendedAppState>((set, get) => ({
  trips: [],
  trip: null,
  members: [],
  expenses: [],
  isLoading: true,
  
  isExpenseModalOpen: false,
  isCreatingTrip: false,

  openExpenseModal: () => set({ isExpenseModalOpen: true }),
  closeExpenseModal: () => set({ isExpenseModalOpen: false }),

  startCreatingTrip: () => set({ isCreatingTrip: true }),
  cancelCreatingTrip: () => set({ isCreatingTrip: false }),

  loadTrip: async () => {
    set({ isLoading: true });
    try {
      const data = await loadAllFromDB();
      
      // Handle legacy: If data exists but format is old or we need to ensure consistency
      // In this simple implementation, we assume data loaded is the raw DB dump.
      
      const allTrips = Array.isArray(data.trip) ? data.trip : (data.trip ? [data.trip] : []);
      // Note: loadAllFromDB 'trip' might be an array or object depending on previous implementation.
      // The previous implementation returned tripReq.result[0], implying the DB might store multiple but we only fetched one.
      // We need to check services/db.ts. loadAllFromDB logic: tripReq.result[0].
      // To support multiple, we need to fix loadAllFromDB first? 
      // No, let's fix the logic here assuming we will fix DB service to return all.
      
      // Filter helpers
      const allMembers = Array.isArray(data.members) ? data.members : [];
      const allExpenses = Array.isArray(data.expenses) ? data.expenses : [];

      if (allTrips.length > 0) {
          // Sort by lastOpenedAt descending
          const sortedTrips = (allTrips as Trip[]).sort((a, b) => (b.lastOpenedAt || 0) - (a.lastOpenedAt || 0));
          const activeTrip = sortedTrips[0];

          // Filter data for active trip
          // Legacy support: if item has no tripId, assign to first trip found
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

        // Update state: append new trip, set as active
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
          
          // Update lastOpenedAt
          const updatedTrip = { ...targetTrip, lastOpenedAt: Date.now() };
          await saveToDB('trip', updatedTrip);

          // Reload all data to ensure we have fresh filtering
          // (In a real app we might cache, but here we just re-fetch for simplicity/robustness)
          const data = await loadAllFromDB();
          const allMembers = Array.isArray(data.members) ? data.members : [];
          const allExpenses = Array.isArray(data.expenses) ? data.expenses : [];
          
          const activeMembers = allMembers.filter(m => m.tripId === tripId);
          const activeExpenses = allExpenses.filter(e => e.tripId === tripId);
          
          // Update trips list with new timestamp
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
      const { trips, trip } = get();
      
      // 1. Delete from DB
      await deleteFromDB('trip', tripId);
      
      // 2. Delete associated data
      // For this, we need to load all data and delete matches.
      // Optimized: just filter current state if it matches, but rigorous way is:
      const data = await loadAllFromDB();
      const membersToDelete = (data.members as Member[]).filter(m => m.tripId === tripId);
      const expensesToDelete = (data.expenses as Expense[]).filter(e => e.tripId === tripId);
      
      for (const m of membersToDelete) await deleteFromDB('members', m.id);
      for (const e of expensesToDelete) await deleteFromDB('expenses', e.id);

      // 3. Update State
      const remainingTrips = trips.filter(t => t.id !== tripId);
      
      if (remainingTrips.length > 0) {
          // Switch to first available
          // (Recursive call might be cleaner but let's just set state manually to avoid loops)
          const nextTrip = remainingTrips[0];
          await get().switchTrip(nextTrip.id);
          set({ trips: remainingTrips }); // switchTrip updates trips but we need to ensure list is correct
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

  deleteExpense: async (id) => {
    const { expenses } = get();
    const safeExpenses = Array.isArray(expenses) ? expenses : [];
    
    const updatedExpenses = safeExpenses.filter(e => e.id !== id);
    set({ expenses: updatedExpenses });
    
    await deleteFromDB('expenses', id);
  }
}));