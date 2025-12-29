import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { formatCurrency } from '../utils/format';
import { MemberAvatar } from '../components/MemberAvatar';
import { Plus, Pencil } from 'lucide-react';
import { motion } from 'framer-motion';

export const ExpensesList: React.FC = () => {
  const { expenses, members, trip, openExpenseModal, setEditingExpense } = useAppStore();

  const getMember = (id: string) => members.find(m => m.id === id);

  const handleEdit = (id: string) => {
      setEditingExpense(id);
  };

  if (expenses.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500 space-y-6">
            <div className="text-6xl animate-bounce">
                👻
            </div>
            <div className="text-center space-y-2">
                <h3 className="text-white font-bold text-xl">Add your first transaction</h3>
                <p className="text-sm font-medium">It's awfully quiet in here.</p>
            </div>
            <button
                onClick={openExpenseModal}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full font-bold transition-all flex items-center gap-2"
            >
                <Plus size={18} />
                Add Expense
            </button>
        </div>
    );
  }

  return (
    <div className="space-y-6 pt-4">
      <h1 className="text-3xl font-extrabold text-white">History</h1>
      
      <div className="space-y-4">
        {expenses.map((expense, i) => {
          const payer = getMember(expense.paidBy);
          // Safe color fallback
          const accentColor = payer?.color || '#94a3b8';
          
          return (
            <motion.button 
                key={expense.id} 
                onClick={() => handleEdit(expense.id)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="w-full text-left glass-card rounded-3xl p-4 flex items-center gap-4 group relative overflow-hidden hover:bg-white/5 transition-colors active:scale-98"
            >
                {/* Color Strip */}
                <div 
                    className="absolute left-0 top-0 bottom-0 w-1.5" 
                    style={{ backgroundColor: accentColor }} 
                />

                <div className="pl-2">
                    <MemberAvatar member={payer} size="md" />
                </div>
                
                <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold text-lg leading-tight truncate">{expense.title}</h3>
                    <p className="text-xs text-slate-400 font-medium mt-1">
                        <span style={{ color: accentColor }}>{payer?.name || 'Unknown'}</span> paid for {expense.splits.length} people
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
                
                {/* Edit Icon Hint */}
                <div className="absolute top-4 right-4 text-white/10 group-hover:text-white/30 transition-colors">
                    <Pencil size={12} />
                </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};