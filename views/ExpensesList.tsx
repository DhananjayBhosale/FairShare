import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { formatCurrency } from '../utils/format';
import { MemberAvatar } from '../components/MemberAvatar';
import { Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const ExpensesList: React.FC = () => {
  const { expenses, members, trip, deleteExpense } = useAppStore();

  const getMember = (id: string) => members.find(m => m.id === id);

  if (expenses.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500 space-y-6">
            <div className="w-24 h-24 bg-surface rounded-full flex items-center justify-center animate-bounce">
                <span className="text-4xl">💸</span>
            </div>
            <div className="text-center">
                <h3 className="text-white font-bold text-lg">No expenses yet</h3>
                <p className="text-sm">Go ahead, buy something nice!</p>
            </div>
        </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 pt-4">
      <h1 className="text-3xl font-extrabold text-white">History</h1>
      
      <div className="space-y-4">
        {expenses.map((expense, i) => {
          const payer = getMember(expense.paidBy);
          
          return (
            <motion.div 
                key={expense.id} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card rounded-3xl p-4 flex items-center gap-4 group relative overflow-hidden"
            >
                {/* Color Strip */}
                <div 
                    className="absolute left-0 top-0 bottom-0 w-1.5" 
                    style={{ backgroundColor: payer?.color }} 
                />

                <div className="pl-2">
                    <MemberAvatar member={payer!} size="md" />
                </div>
                
                <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold text-lg leading-tight truncate">{expense.title}</h3>
                    <p className="text-xs text-slate-400 font-medium mt-1">
                        <span style={{ color: payer?.color }}>{payer?.name}</span> paid for {expense.splits.length} people
                    </p>
                </div>

                <div className="text-right">
                    <div className="text-xl font-black text-white">
                        {formatCurrency(expense.amount, trip?.currencySymbol)}
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase mt-1">
                        {new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                </div>
                
                {/* Delete Button (Visible on Hover/Focus or swiping on mobile ideally) */}
                <button 
                    onClick={() => {
                        if(confirm('Delete this expense?')) deleteExpense(expense.id);
                    }}
                    className="absolute right-0 top-0 bottom-0 w-16 bg-red-500/90 text-white flex items-center justify-center translate-x-full group-hover:translate-x-0 transition-transform"
                >
                    <Trash2 size={20} />
                </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};