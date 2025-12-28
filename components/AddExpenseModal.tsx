import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ChevronDown } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { SplitType } from '../types';
import { distributeEqually } from '../utils/calculations';
import { Button } from './ui/Button';
import { MemberAvatar } from './MemberAvatar';
import { formatCurrency } from '../utils/format';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AddExpenseModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { members, trip, addExpense } = useAppStore();
  
  const [title, setTitle] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [paidBy, setPaidBy] = useState<string>(members[0]?.id || '');
  const [splitType, setSplitType] = useState<SplitType>('EQUAL');
  const [selectedMembers, setSelectedMembers] = useState<string[]>(members.map(m => m.id));
  
  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setAmountStr('');
      setPaidBy(members[0]?.id || '');
      setSplitType('EQUAL');
      setSelectedMembers(members.map(m => m.id));
    }
  }, [isOpen, members]);

  const totalAmount = Math.round(parseFloat(amountStr || '0') * 100);
  const payerMember = members.find(m => m.id === paidBy);

  const toggleMemberSelection = (id: string) => {
    if (selectedMembers.includes(id)) {
      if (selectedMembers.length > 1) {
        setSelectedMembers(prev => prev.filter(m => m !== id));
      }
    } else {
      setSelectedMembers(prev => [...prev, id]);
    }
  };

  const handleSave = () => {
    if (!title || totalAmount <= 0) return;

    let splits = [];
    // Currently only supporting EQUAL in this simplified fun UI, logic remains for others though
    splits = distributeEqually(totalAmount, selectedMembers);

    addExpense({
      title,
      amount: totalAmount,
      paidBy,
      splitType,
      splits
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm pointer-events-auto transition-opacity duration-300" 
        onClick={onClose} 
      />
      
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="pointer-events-auto relative w-full max-w-lg bg-[#1A1F2E] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden border-t border-white/10"
      >
        {/* Drag Handle */}
        <div className="w-full flex justify-center pt-4 pb-2" onClick={onClose}>
            <div className="w-12 h-1.5 bg-slate-700 rounded-full" />
        </div>

        <div className="overflow-y-auto px-6 py-2 flex-1 space-y-8 custom-scrollbar">
          
          {/* Big Amount Input */}
          <div className="text-center space-y-2 py-4">
             <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Amount</label>
             <div className="relative inline-block">
                <span className="absolute -left-6 top-1/2 -translate-y-1/2 text-3xl font-bold text-slate-500">
                    {trip?.currencySymbol}
                </span>
                <input
                    type="number"
                    placeholder="0"
                    autoFocus
                    value={amountStr}
                    onChange={e => setAmountStr(e.target.value)}
                    className="bg-transparent text-center text-6xl font-black text-white w-48 focus:outline-none placeholder:text-slate-700 caret-primary"
                />
             </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <input
              type="text"
              placeholder="What is this for?"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-surface/50 border border-slate-700 rounded-2xl p-4 text-center text-lg font-bold text-white focus:border-primary focus:outline-none transition-colors"
            />
          </div>

          {/* Who Paid Section - Horizontal Scroll */}
          <div className="space-y-3">
             <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block text-center">Who Paid?</label>
             <div className="flex justify-center gap-4 flex-wrap">
                {members.map(member => (
                   <motion.button
                      key={member.id}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setPaidBy(member.id)}
                      className={`flex flex-col items-center gap-2 p-2 rounded-2xl transition-all ${
                         paidBy === member.id ? 'opacity-100 scale-110' : 'opacity-50 grayscale'
                      }`}
                   >
                      <MemberAvatar member={member} size="md" />
                      <span className={`text-xs font-bold ${paidBy === member.id ? 'text-white' : 'text-slate-500'}`}>
                        {member.name}
                      </span>
                   </motion.button>
                ))}
             </div>
          </div>

          {/* Split Section */}
          <div className="space-y-3 pb-8">
             <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block text-center">For Whom?</label>
             <div className="glass-card p-4 rounded-3xl">
                <div className="flex flex-wrap gap-2 justify-center">
                    {members.map(member => {
                        const isSelected = selectedMembers.includes(member.id);
                        return (
                            <motion.button
                                key={member.id}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => toggleMemberSelection(member.id)}
                                className={`
                                    px-3 py-2 rounded-xl flex items-center gap-2 text-sm font-bold border transition-all
                                    ${isSelected 
                                        ? 'bg-primary/20 border-primary text-white' 
                                        : 'bg-transparent border-slate-700 text-slate-500'}
                                `}
                            >
                                <span>{member.avatar}</span>
                                {member.name}
                            </motion.button>
                        )
                    })}
                </div>
                
                {/* Visual Split Bar */}
                <div className="mt-4 pt-4 border-t border-white/5">
                    <div className="flex h-4 rounded-full overflow-hidden bg-slate-800">
                        {selectedMembers.map((id) => {
                           const m = members.find(mem => mem.id === id);
                           if(!m) return null;
                           return (
                               <div key={id} style={{ backgroundColor: m.color, flex: 1 }} />
                           )
                        })}
                    </div>
                    <div className="text-center mt-2 text-xs text-slate-400 font-medium">
                        {formatCurrency(totalAmount / selectedMembers.length, trip?.currencySymbol)} / person
                    </div>
                </div>
             </div>
          </div>

        </div>

        <div className="p-6 bg-surface/50 border-t border-white/5 backdrop-blur-xl">
          <Button fullWidth size="lg" onClick={handleSave} disabled={!title || !amountStr}>
            Add Expense
          </Button>
        </div>
      </motion.div>
    </div>
  );
};