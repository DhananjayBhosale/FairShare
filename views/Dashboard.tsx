import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { calculateBalances } from '../utils/calculations';
import { formatCurrency } from '../utils/format';
import { MemberAvatar } from '../components/MemberAvatar';
import { Button } from '../components/ui/Button';
import { Sparkles, Plus } from 'lucide-react';

const FUN_EMPTY_MESSAGES = [
  "Someone has to spend money first 😅",
  "This trip is free… for now 💸",
  "Go on, add the first expense 😏",
  "No bills yet. Enjoy it while it lasts.",
  "Your wallet is safe... for the moment 🛡️"
];

export const Dashboard: React.FC = () => {
  const { members, expenses, trip, openExpenseModal } = useAppStore();
  const balances = calculateBalances(members, expenses);
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  
  const [emptyMessage, setEmptyMessage] = useState(FUN_EMPTY_MESSAGES[0]);

  useEffect(() => {
    setEmptyMessage(FUN_EMPTY_MESSAGES[Math.floor(Math.random() * FUN_EMPTY_MESSAGES.length)]);
  }, []);

  const sortedBalances = balances.sort((a, b) => b.amount - a.amount);
  const getMember = (id: string) => members.find(m => m.id === id);

  // EMPTY STATE: If no expenses, show the fun welcome screen instead of boring dashboard
  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-8 px-4">
        <motion.div
           initial={{ scale: 0, rotate: -10 }}
           animate={{ scale: 1, rotate: 0 }}
           transition={{ type: "spring", bounce: 0.6 }}
           className="relative"
        >
          <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full" />
          <div className="text-8xl relative z-10 drop-shadow-2xl">👀</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <h2 className="text-3xl font-black text-white">Nothing here yet</h2>
          <p className="text-slate-300 text-lg font-medium max-w-[250px] mx-auto leading-relaxed">
            {emptyMessage}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-4 w-full max-w-xs"
        >
          <button
             onClick={openExpenseModal}
             className="w-full bg-white text-black font-bold text-lg py-4 rounded-full shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-105 hover:shadow-[0_0_50px_rgba(255,255,255,0.5)] active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 animate-pulse-slow"
          >
             <Plus strokeWidth={3} size={20} />
             Add First Expense
          </button>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
            It takes 2 seconds, promise.
          </p>
        </motion.div>
      </div>
    );
  }

  // REGULAR DASHBOARD (When data exists)
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

      {/* Balance Cards - Horizontal Scroll */}
      <section>
         <div className="flex items-end justify-between px-2 mb-4">
             <h2 className="text-lg font-bold text-white">Balances</h2>
             <span className="text-xs font-medium text-slate-500">{members.length} people</span>
         </div>
         
         <div className="flex gap-4 overflow-x-auto pb-8 -mx-6 px-6 no-scrollbar snap-x">
            {sortedBalances.map((balance, i) => {
               const member = getMember(balance.memberId);
               if (!member) return null;
               
               const isPositive = balance.amount >= 0;
               const isSettled = Math.abs(balance.amount) < 1;

               return (
                 <motion.div 
                   key={balance.memberId}
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   transition={{ delay: i * 0.1, type: "spring" }}
                   className="snap-center min-w-[180px] h-[220px] relative group"
                 >
                   <div 
                        className="absolute inset-0 bg-white/5 backdrop-blur-xl rounded-[2rem] border transition-all duration-300"
                        style={{ borderColor: isSettled ? '#334155' : member.color }}
                   />
                   
                   <div 
                        className="absolute inset-0 opacity-20 rounded-[2rem] blur-xl transition-all"
                        style={{ backgroundColor: isSettled ? 'transparent' : member.color }}
                   />

                   <div className="relative z-10 flex flex-col h-full p-5 justify-between">
                     <div className="flex justify-between items-start">
                         <MemberAvatar member={member} size="md" />
                         {isSettled && <div className="bg-white/10 rounded-full px-2 py-1 text-[10px] font-bold">SETTLED</div>}
                     </div>

                     <div>
                        <div className="font-bold text-white text-lg leading-tight mb-1">{member.name}</div>
                        
                        {isSettled ? (
                            <div className="text-slate-500 font-medium">All good</div>
                        ) : (
                            <>
                                <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {isPositive ? 'Gets Back' : 'Owes'}
                                </div>
                                <div className="text-2xl font-black text-white tracking-tight">
                                    {formatCurrency(Math.abs(balance.amount), trip?.currencySymbol)}
                                </div>
                            </>
                        )}
                     </div>
                   </div>
                 </motion.div>
               )
            })}
         </div>
      </section>

      {/* Recent Activity */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white px-2">Money Adventures 💸</h2>
        <div className="space-y-3">
            {expenses.slice(0, 5).map((expense, i) => {
            const payer = getMember(expense.paidBy);
            return (
                <motion.div 
                    key={expense.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-4 rounded-2xl flex items-center justify-between bg-white/5 border border-white/5 active:scale-98 transition-transform"
                >
                    <div className="flex items-center gap-4">
                    <MemberAvatar member={payer!} size="sm" />
                    <div>
                        <div className="font-bold text-white">{expense.title}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-1">
                            <span className="font-bold" style={{ color: payer?.color }}>{payer?.name}</span>
                            <span>paid for everyone</span>
                        </div>
                    </div>
                    </div>
                    <div className="font-bold text-white text-lg">
                        {formatCurrency(expense.amount, trip?.currencySymbol)}
                    </div>
                </motion.div>
            )
            })}
        </div>
      </section>
    </div>
  );
};