import React from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { calculateBalances, calculateSettlements } from '../utils/calculations';
import { formatCurrency } from '../utils/format';
import { MemberAvatar } from '../components/MemberAvatar';
import { ArrowRight, CheckCircle } from 'lucide-react';

export const Settlements: React.FC = () => {
  const { members, expenses, trip } = useAppStore();
  const balances = calculateBalances(members, expenses);
  const settlements = calculateSettlements(balances);

  if (settlements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-6">
         <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-32 h-32 bg-emerald-500/20 rounded-full flex items-center justify-center"
         >
             <CheckCircle className="w-16 h-16 text-emerald-500" />
         </motion.div>
         <div>
            <h2 className="text-3xl font-bold text-white mb-2">All Squared Away!</h2>
            <p className="text-slate-400 max-w-xs mx-auto">Everyone has paid their share. Time to plan the next trip?</p>
         </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-32 pt-4">
      <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-white">Settlements</h1>
          <p className="text-slate-400 font-medium">The easiest way to settle debts.</p>
      </div>

      <div className="space-y-4">
        {settlements.map((settlement, idx) => {
          const fromMember = members.find(m => m.id === settlement.from);
          const toMember = members.find(m => m.id === settlement.to);

          if (!fromMember || !toMember) return null;

          return (
            <motion.div
              key={`${settlement.from}-${settlement.to}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.15 }}
              className="glass-card rounded-3xl p-6 relative overflow-hidden group"
            >
              <div className="flex items-center justify-between relative z-10">
                
                {/* From */}
                <div className="flex flex-col items-center gap-3">
                    <MemberAvatar member={fromMember} size="md" />
                    <span className="text-sm font-bold text-slate-300">{fromMember.name}</span>
                </div>

                {/* Flow Animation */}
                <div className="flex-1 flex flex-col items-center px-4">
                    <div className="text-2xl font-black text-white mb-2">
                        {formatCurrency(settlement.amount, trip?.currencySymbol)}
                    </div>
                    <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden relative">
                        <motion.div 
                            className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-white to-transparent opacity-50"
                            animate={{ x: ['-100%', '200%'] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        />
                    </div>
                    <ArrowRight className="text-slate-500 mt-2" size={16} />
                </div>

                {/* To */}
                <div className="flex flex-col items-center gap-3">
                    <MemberAvatar member={toMember} size="md" />
                    <span className="text-sm font-bold text-slate-300">{toMember.name}</span>
                </div>

              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};