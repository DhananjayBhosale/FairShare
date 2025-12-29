import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { calculateBalances, calculateSettlements } from '../utils/calculations';
import { formatCurrency } from '../utils/format';
import { MemberAvatar } from '../components/MemberAvatar';
import { Plus, ArrowRight, Check } from 'lucide-react';

const FUN_EMPTY_MESSAGES = [
  "This trip is free… for now 💸",
  "Go on, start the money rolling 😏",
  "No bills yet. Enjoy it while it lasts.",
  "Your wallet is safe... for the moment 🛡️"
];

export const Dashboard: React.FC = () => {
  const { members, expenses, trip, openExpenseModal, setEditingExpense } = useAppStore();
  
  // Calculations
  const balances = calculateBalances(members, expenses);
  const settlements = calculateSettlements(balances);
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  
  const [emptyMessage, setEmptyMessage] = useState(FUN_EMPTY_MESSAGES[0]);

  useEffect(() => {
    setEmptyMessage(FUN_EMPTY_MESSAGES[Math.floor(Math.random() * FUN_EMPTY_MESSAGES.length)]);
  }, []);

  const getMember = (id: string) => members.find(m => m.id === id);

  // EMPTY STATE
  if (expenses.length === 0) {
    return (
      <div className="flex flex-col h-full pt-6 pb-20 px-4">
        <div className="flex justify-center mb-8">
            <div className="px-4 py-1.5 bg-white/5 rounded-full border border-white/10 backdrop-blur-md">
                <span className="font-bold text-slate-300 uppercase tracking-widest text-xs">{trip?.name}</span>
            </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center space-y-10">
            <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="relative"
            >
                <div className="absolute inset-0 bg-primary/30 blur-3xl rounded-full" />
                <div className="text-8xl relative z-10 drop-shadow-2xl">💸</div>
            </motion.div>

            <div className="text-center space-y-3">
                <h2 className="text-3xl font-black text-white leading-tight">Add your first transaction</h2>
                <p className="text-slate-400 font-medium">{emptyMessage}</p>
            </div>

            <div className="space-y-3 w-full flex flex-col items-center">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">The Squad</span>
                <div className="flex flex-wrap justify-center gap-3">
                    {members.map((m, i) => (
                        <motion.div 
                            key={m.id}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.3 + (i * 0.1) }}
                        >
                            <MemberAvatar member={m} size="md" />
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>

        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="w-full max-w-xs mx-auto mt-8"
        >
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    openExpenseModal();
                }}
                className="w-full bg-white text-black font-bold text-lg py-4 rounded-full shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
            >
                <Plus strokeWidth={3} size={20} />
                Add Expense
            </button>
        </motion.div>
      </div>
    );
  }

  // REGULAR DASHBOARD
  return (
    <div className="space-y-10 pt-6">
      {/* Hero Header */}
      <header className="relative">
        <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-2"
        >
            <div className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                <span className="text-xs font-bold text-slate-300 tracking-wider uppercase">{trip?.name}</span>
            </div>
            <div className="flex flex-col items-center">
                <span className="text-sm font-medium text-slate-500 mb-1">Total Spent</span>
                <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 tracking-tighter">
                    {formatCurrency(totalSpent, trip?.currencySymbol)}
                </h1>
            </div>
        </motion.div>
      </header>

      {/* Settle Up Section (Replaces Balances) */}
      <section>
         <div className="flex items-end justify-between px-2 mb-4">
             <h2 className="text-lg font-bold text-white">Settle Up</h2>
         </div>
         
         {settlements.length === 0 ? (
             <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-3"
             >
                 <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-1 ring-4 ring-emerald-500/10">
                    <Check strokeWidth={4} size={24} />
                 </div>
                 <div>
                    <div className="text-white font-bold text-lg">All settled up!</div>
                    <div className="text-slate-400 text-sm">No pending debts between anyone.</div>
                 </div>
             </motion.div>
         ) : (
            <div className="space-y-3">
                {settlements.map((settlement, i) => {
                    const from = getMember(settlement.from);
                    const to = getMember(settlement.to);
                    if (!from || !to) return null;

                    return (
                        <motion.div
                            key={`${settlement.from}-${settlement.to}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="glass-card p-4 rounded-3xl flex items-center justify-between border border-white/5 relative overflow-hidden"
                        >
                            {/* Gradient Background based on payer color */}
                            <div 
                                className="absolute left-0 top-0 bottom-0 w-1 opacity-50"
                                style={{ backgroundColor: from.color }}
                            />

                            {/* Payer */}
                            <div className="flex flex-col items-center gap-1 z-10 w-16">
                                <MemberAvatar member={from} size="md" />
                                <span className="text-[10px] font-bold text-slate-400 truncate max-w-full">{from.name}</span>
                            </div>

                            {/* Action Arrow & Amount */}
                            <div className="flex-1 flex flex-col items-center justify-center z-10 px-2">
                                <div className="text-xl font-black text-white tracking-tight mb-1">
                                    {formatCurrency(settlement.amount, trip?.currencySymbol)}
                                </div>
                                <div className="flex items-center gap-2 text-slate-500 w-full justify-center">
                                    <div className="h-[2px] w-full bg-white/10 rounded-full overflow-hidden relative">
                                        <motion.div 
                                            className="absolute inset-0 bg-white/30"
                                            animate={{ x: ['-100%', '100%'] }}
                                            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                        />
                                    </div>
                                    <ArrowRight size={14} className="shrink-0" />
                                </div>
                            </div>

                            {/* Receiver */}
                            <div className="flex flex-col items-center gap-1 z-10 w-16">
                                <MemberAvatar member={to} size="md" />
                                <span className="text-[10px] font-bold text-slate-400 truncate max-w-full">{to.name}</span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
         )}
      </section>

      {/* Recent Activity */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white px-2">Money Adventures 💸</h2>
        <div className="space-y-3">
            {expenses.slice(0, 5).map((expense, i) => {
            const payer = getMember(expense.paidBy);
            return (
                <motion.button 
                    key={expense.id}
                    onClick={() => setEditingExpense(expense.id)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="w-full text-left p-4 rounded-2xl flex items-center justify-between bg-white/5 border border-white/5 active:scale-98 transition-transform hover:bg-white/10"
                >
                    <div className="flex items-center gap-4">
                    <MemberAvatar member={payer} size="sm" />
                    <div>
                        <div className="font-bold text-white">{expense.title}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-1">
                            <span className="font-bold" style={{ color: payer?.color || '#94a3b8' }}>{payer?.name || 'Unknown'}</span>
                            <span>paid for everyone</span>
                        </div>
                    </div>
                    </div>
                    <div className="font-bold text-white text-lg">
                        {formatCurrency(expense.amount, trip?.currencySymbol)}
                    </div>
                </motion.button>
            )
            })}
        </div>
      </section>
    </div>
  );
};