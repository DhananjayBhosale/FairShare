import React from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { calculateBalances } from '../utils/calculations';
import { formatCurrency } from '../utils/format';
import { MemberAvatar } from '../components/MemberAvatar';
import { Button } from '../components/ui/Button';

export const Dashboard: React.FC = () => {
  const { members, expenses, trip } = useAppStore();
  const balances = calculateBalances(members, expenses);

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Split balances into who owes and who gets back
  const whoGets = balances.filter(b => b.amount > 0).sort((a, b) => b.amount - a.amount);
  const whoOwes = balances.filter(b => b.amount < 0).sort((a, b) => a.amount - b.amount);

  const getMember = (id: string) => members.find(m => m.id === id);

  return (
    <div className="space-y-8 pb-32 pt-2">
      {/* Header */}
      <header className="flex justify-between items-end">
        <div>
           <motion.div 
             initial={{ opacity: 0, y: -10 }} 
             animate={{ opacity: 1, y: 0 }}
             className="text-xs font-bold text-primary uppercase tracking-widest mb-1"
           >
             Current Trip
           </motion.div>
           <h1 className="text-4xl font-extrabold text-white tracking-tight">{trip?.name}</h1>
        </div>
        <div className="text-right">
           <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Spent</div>
           <div className="text-2xl font-black text-white">{formatCurrency(totalSpent, trip?.currencySymbol)}</div>
        </div>
      </header>

      {/* Hero Stats - Horizontal Scroll for "Stories" feel */}
      <section>
         <h2 className="text-lg font-bold text-slate-400 mb-4 px-1">How it stands</h2>
         <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 no-scrollbar snap-x">
            {/* Positive Balances (Green cards) */}
            {whoGets.map((balance, i) => {
               const member = getMember(balance.memberId);
               if (!member) return null;
               return (
                 <motion.div 
                   key={balance.memberId}
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: i * 0.1 }}
                   className="snap-center min-w-[200px] bg-gradient-to-br from-emerald-500/20 to-emerald-900/20 border border-emerald-500/30 p-5 rounded-3xl flex flex-col justify-between h-40 relative overflow-hidden backdrop-blur-md"
                 >
                   <div className="absolute top-0 right-0 p-3 opacity-20">
                     <MemberAvatar member={member} size="lg" />
                   </div>
                   <div className="relative z-10">
                     <MemberAvatar member={member} size="md" />
                     <div className="mt-3 text-emerald-300 font-bold text-sm">gets back</div>
                     <div className="text-3xl font-black text-emerald-400 tracking-tight">
                       {formatCurrency(balance.amount, trip?.currencySymbol)}
                     </div>
                   </div>
                 </motion.div>
               )
            })}

            {/* Negative Balances (Rose cards) */}
            {whoOwes.map((balance, i) => {
               const member = getMember(balance.memberId);
               if (!member) return null;
               return (
                 <motion.div 
                   key={balance.memberId}
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: (i + whoGets.length) * 0.1 }}
                   className="snap-center min-w-[200px] bg-gradient-to-br from-rose-500/20 to-rose-900/20 border border-rose-500/30 p-5 rounded-3xl flex flex-col justify-between h-40 relative overflow-hidden backdrop-blur-md"
                 >
                   <div className="absolute top-0 right-0 p-3 opacity-20">
                     <MemberAvatar member={member} size="lg" />
                   </div>
                   <div className="relative z-10">
                     <MemberAvatar member={member} size="md" />
                     <div className="mt-3 text-rose-300 font-bold text-sm">owes</div>
                     <div className="text-3xl font-black text-rose-400 tracking-tight">
                       {formatCurrency(Math.abs(balance.amount), trip?.currencySymbol)}
                     </div>
                   </div>
                 </motion.div>
               )
            })}

            {members.length === 0 && <div className="text-slate-500">No members yet</div>}
            {whoGets.length === 0 && whoOwes.length === 0 && members.length > 0 && (
                <div className="min-w-[200px] flex items-center justify-center bg-white/5 rounded-3xl h-40 text-slate-400 font-medium">
                    All settled up! ✨
                </div>
            )}
         </div>
      </section>

      {/* Recent Activity Mini-List */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-400 px-1">Recent</h2>
        {expenses.length === 0 ? (
          <div className="p-8 border-2 border-dashed border-slate-800 rounded-3xl text-center">
            <div className="text-4xl mb-3">😴</div>
            <p className="text-slate-500 font-medium">It's quiet here.</p>
            <p className="text-slate-600 text-sm">Tap + to add an expense.</p>
          </div>
        ) : (
          <div className="space-y-3">
             {expenses.slice(0, 3).map(expense => {
                const payer = getMember(expense.paidBy);
                return (
                   <div key={expense.id} className="glass-card p-4 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-lg">
                           {payer?.avatar}
                        </div>
                        <div>
                           <div className="font-bold text-white text-sm">{expense.title}</div>
                           <div className="text-xs text-slate-400">
                             <span style={{ color: payer?.color }}>{payer?.name}</span> paid
                           </div>
                        </div>
                      </div>
                      <div className="font-bold text-white">
                         {formatCurrency(expense.amount, trip?.currencySymbol)}
                      </div>
                   </div>
                )
             })}
             {expenses.length > 3 && (
                <button className="w-full py-3 text-sm font-bold text-slate-500 hover:text-white transition-colors">
                  View all activity
                </button>
             )}
          </div>
        )}
      </section>
    </div>
  );
};