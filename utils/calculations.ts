import { Expense, Member, Balance, Settlement, SplitDetail } from '../types';

// ==========================================
// CORE CALCULATION ENGINE
// ==========================================
// This file is the single source of truth for math.
// It effectively swallows errors and returns safe defaults (0, [], etc)
// to prevent UI crashes.

/**
 * Validates if a number is a valid finite number.
 */
const isValidNumber = (num: any): boolean => {
  return typeof num === 'number' && !isNaN(num) && isFinite(num);
};

/**
 * Calculates net balances.
 * Returns safe Balance objects even if input data is corrupt.
 */
export const calculateBalances = (members: Member[], expenses: Expense[]): Balance[] => {
  try {
    const balances: Record<string, number> = {};

    // 1. Initialize all members with 0
    // Safe-guard: handle null/undefined members array
    if (Array.isArray(members)) {
      members.forEach(m => {
        if (m?.id) balances[m.id] = 0;
      });
    }

    // 2. Process expenses
    if (Array.isArray(expenses)) {
      expenses.forEach(expense => {
        // Skip invalid expenses
        if (!expense) return;

        if (!isValidNumber(expense.amount)) {
            console.warn(`Skipping expense ${expense.id}: Invalid amount`, expense.amount);
            return;
        }

        const amount = Math.round(expense.amount); // Force integer
        const payerId = expense.paidBy;

        // Credit Payer
        if (payerId && balances.hasOwnProperty(payerId)) {
          balances[payerId] = (balances[payerId] || 0) + amount;
        } else if (payerId) {
            console.warn(`Payer ${payerId} not found in member list. Balance ignored.`);
        }

        // Debit Split Members
        if (Array.isArray(expense.splits)) {
          expense.splits.forEach(split => {
            if (split?.memberId && isValidNumber(split.amount)) {
              if (balances.hasOwnProperty(split.memberId)) {
                balances[split.memberId] = (balances[split.memberId] || 0) - Math.round(split.amount);
              } else {
                 console.warn(`Split member ${split.memberId} not found. Ignored.`);
              }
            }
          });
        }
      });
    }

    // 3. Convert to array
    return Object.entries(balances).map(([memberId, amount]) => ({
      memberId,
      amount,
    }));

  } catch (error) {
    console.error("CRITICAL: Error in calculateBalances", error);
    // Return empty array (safe fallback) or just 0 balances for known members
    return (members || []).map(m => ({ memberId: m.id, amount: 0 }));
  }
};

/**
 * Distributes amount equally.
 * Ensures total split sum exactly equals totalAmount (distributes remainder).
 */
export const distributeEqually = (totalAmount: number, memberIds: string[]): SplitDetail[] => {
  try {
    if (!isValidNumber(totalAmount) || totalAmount <= 0) return [];
    if (!Array.isArray(memberIds) || memberIds.length === 0) return [];

    const amount = Math.floor(totalAmount); // Ensure integer input
    const count = memberIds.length;
    
    // Basic division
    const baseShare = Math.floor(amount / count);
    const remainder = amount % count;

    // Distribute
    return memberIds.map((id, index) => {
      // Give remainder pennies to the first few people
      const share = baseShare + (index < remainder ? 1 : 0);
      return {
        memberId: id,
        amount: share
      };
    });
  } catch (error) {
    console.error("Error in distributeEqually", error);
    return [];
  }
};

/**
 * Calculates settlements to clear debts.
 */
export const calculateSettlements = (balances: Balance[]): Settlement[] => {
  try {
    if (!Array.isArray(balances) || balances.length === 0) return [];

    // Separate into debtors (-) and creditors (+)
    // Filter out negligible amounts (< 1 minor unit)
    const debtors = balances
      .filter(b => b.amount <= -1)
      .sort((a, b) => a.amount - b.amount); // Ascending (most negative first)

    const creditors = balances
      .filter(b => b.amount >= 1)
      .sort((a, b) => b.amount - a.amount); // Descending (most positive first)

    const settlements: Settlement[] = [];
    
    let d = 0;
    let c = 0;

    // Greedy algorithm
    while (d < debtors.length && c < creditors.length) {
      const debtor = debtors[d];
      const creditor = creditors[c];

      const amountOwed = Math.abs(debtor.amount);
      const amountReceivable = creditor.amount;
      
      const settleAmount = Math.min(amountOwed, amountReceivable);

      if (settleAmount > 0) {
        settlements.push({
          from: debtor.memberId,
          to: creditor.memberId,
          amount: settleAmount
        });
      }

      // Adjust temp balances
      debtor.amount += settleAmount;
      creditor.amount -= settleAmount;

      // Move pointers if settled
      if (Math.abs(debtor.amount) < 1) d++;
      if (creditor.amount < 1) c++;
    }

    return settlements;

  } catch (error) {
    console.error("Error in calculateSettlements", error);
    return [];
  }
};