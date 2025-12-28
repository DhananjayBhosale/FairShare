import React from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { calculateBalances, calculateSettlements } from '../utils/calculations';
import { formatCurrency } from '../utils/format';
import { MemberAvatar } from '../components/MemberAvatar';
import { ArrowRight, Sparkles } from 'lucide-react';

export const Settlements: React.FC = () => {
  const { members, expenses, trip } = useAppStore();
  const balances = calculateBalances(members, expenses);
  const settlements = calculateSettlements(balances);

  if (settlements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-8">
         <motion.div 
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="w-32 h-32 bg-emerald-500/10 border border-emerald-500/50 rounded-full flex items-center justify-center relative"
         >
             <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full" />
             <Sparkles className="w-16 h-16 text-emerald-400 relative z-10" />
         </motion.div>
         <div>
            <h2 className="text-3xl font-extrabold text-white mb-2">All good here 😌</h2>
            <p className="text-slate-400 max-w-xs mx-auto text-lg">No one owes anything.</p>
         </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pt-6">
      <div className="space-y-2 px-2">
          <h1 className="text-3xl font-extrabold text-white">Settlements</h1>
          <p className="text-slate-400 font-medium">Who pays whom.</p>
      </div>

      <div className="space-y-4">
        {settlements.map((settlement, idx) => {
          const fromMember = members.find(m => m.id === settlement.from);
          const toMember = members.find(m => m.id === settlement.to);

          if (!fromMember || !toMember) return null;

          return (
            <motion.div
              key={`${settlement.from}-${settlement.to}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="relative group"
            >
              {/* Card Container */}
              <div className="glass-card rounded-[2rem] p-6 flex flex-col items-center gap-6 relative overflow-hidden">
                
                {/* Connecting Line Graphic */}
                <div className="absolute top-1/2 left-6 right-6 h-0.5 bg-white/5 -translate-y-1/2 z-0" />
                
                <div className="flex w-full justify-between items-center relative z-10">
                    <div className="flex flex-col items-center gap-2">
                        <MemberAvatar member={fromMember} size="md" />
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pays</span>
                    </div>

                    <div className="flex flex-col items-center">
                         <div className="bg-[#0B0E14] px-4 py-2 rounded-xl border border-white/10 shadow-xl z-20">
                            <span className="text-xl font-black text-white tracking-tight">
                                {formatCurrency(settlement.amount, trip?.currencySymbol)}
                            </span>
                         </div>
                         <motion.div 
                            className="mt-2 text-white/50"
                            animate={{ x: [0, 5, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                         >
                            <ArrowRight size={16} />
                         </motion.div>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                        <MemberAvatar member={toMember} size="md" />
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Receives</span>
                    </div>
                </div>

                <div className="w-full text-center">
                    <p className="text-sm text-slate-400">
                        <span className="text-white font-bold">{fromMember.name}</span> pays <span className="text-white font-bold">{toMember.name}</span>
                    </p>
                </div>
                
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};