import { Expense, Member, Balance, Settlement, SplitDetail } from '../types';

/**
 * Calculates the net balance for each member.
 * Positive balance = Member is owed money (Paid more than consumed).
 * Negative balance = Member owes money (Consumed more than paid).
 */
export const calculateBalances = (members: Member[], expenses: Expense[]): Balance[] => {
  const balances: Record<string, number> = {};

  // Initialize 0 balance
  members.forEach(m => {
    balances[m.id] = 0;
  });

  expenses.forEach(expense => {
    // Credit the payer
    balances[expense.paidBy] = (balances[expense.paidBy] || 0) + expense.amount;

    // Debit the consumers
    expense.splits.forEach(split => {
      balances[split.memberId] = (balances[split.memberId] || 0) - split.amount;
    });
  });

  return Object.entries(balances).map(([memberId, amount]) => ({
    memberId,
    amount,
  }));
};

/**
 * Generates an efficient list of settlement transactions to clear all debts.
 * Uses a greedy algorithm to match max debtor with max creditor.
 */
export const calculateSettlements = (balances: Balance[]): Settlement[] => {
  let debtors = balances.filter(b => b.amount < -1).sort((a, b) => a.amount - b.amount); // Ascending (most negative first)
  let creditors = balances.filter(b => b.amount > 1).sort((a, b) => b.amount - a.amount); // Descending (most positive first)

  const settlements: Settlement[] = [];

  let dIndex = 0;
  let cIndex = 0;

  while (dIndex < debtors.length && cIndex < creditors.length) {
    const debtor = debtors[dIndex];
    const creditor = creditors[cIndex];

    const amountOwed = Math.abs(debtor.amount);
    const amountToReceive = creditor.amount;

    const settlementAmount = Math.min(amountOwed, amountToReceive);

    // Record settlement
    if (settlementAmount > 0) {
      settlements.push({
        from: debtor.memberId,
        to: creditor.memberId,
        amount: settlementAmount,
      });
    }

    // Update remaining balances
    debtor.amount += settlementAmount;
    creditor.amount -= settlementAmount;

    // Move indices if settled (allow small epsilon for int rounding safety, though int should be exact)
    if (Math.abs(debtor.amount) < 1) dIndex++;
    if (creditor.amount < 1) cIndex++;
  }

  return settlements;
};

/**
 * Helper to calculate total spent by a member
 */
export const calculateTotalPaid = (memberId: string, expenses: Expense[]): number => {
  return expenses
    .filter(e => e.paidBy === memberId)
    .reduce((sum, e) => sum + e.amount, 0);
};

/**
 * Helper to calculate total share/consumed by a member
 */
export const calculateTotalShare = (memberId: string, expenses: Expense[]): number => {
  return expenses.reduce((sum, e) => {
    const mySplit = e.splits.find(s => s.memberId === memberId);
    return sum + (mySplit ? mySplit.amount : 0);
  }, 0);
};

/**
 * Distributes an amount equally among selected member IDs.
 * Handles remainder distribution to ensure sum matches exactly.
 */
export const distributeEqually = (totalAmount: number, memberIds: string[]): SplitDetail[] => {
  if (memberIds.length === 0) return [];
  
  const count = memberIds.length;
  const baseAmount = Math.floor(totalAmount / count);
  const remainder = totalAmount % count;

  return memberIds.map((id, index) => ({
    memberId: id,
    amount: baseAmount + (index < remainder ? 1 : 0), // Distribute pennies to first few
  }));
};