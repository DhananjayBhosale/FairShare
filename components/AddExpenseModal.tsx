import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { distributeEqually } from '../utils/calculations';
import { Button } from './ui/Button';
import { MemberAvatar } from './MemberAvatar';
import { formatCurrency } from '../utils/format';
import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AddExpenseModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { members, trip, addExpense } = useAppStore();
  
  // Local Form State
  const [title, setTitle] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [paidBy, setPaidBy] = useState<string>('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  
  // Validation State
  const [error, setError] = useState<string | null>(null);

  // Initialize/Reset
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setAmountStr('');
      setError(null);
      // Default payer: first member or none
      setPaidBy(members.length > 0 ? members[0].id : '');
      // Default split: everyone
      setSelectedMembers(members.map(m => m.id));
    }
  }, [isOpen, members]);

  // Handlers
  const handleToggleMember = (id: string) => {
    setError(null);
    if (selectedMembers.includes(id)) {
       // Prevent deselecting everyone (must have at least 1)
       if (selectedMembers.length > 1) {
           setSelectedMembers(prev => prev.filter(m => m !== id));
       }
    } else {
       setSelectedMembers(prev => [...prev, id]);
    }
  };

  const handleToggleAll = () => {
    setError(null);
    if (selectedMembers.length === members.length) {
      // If all selected, select only payer if possible, else random
      const keepId = paidBy || (members[0]?.id);
      if (keepId) setSelectedMembers([keepId]);
    } else {
      setSelectedMembers(members.map(m => m.id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Validate Inputs
    if (!title.trim()) {
        setError("Please enter a description");
        return;
    }
    
    const rawAmount = parseFloat(amountStr);
    if (isNaN(rawAmount) || rawAmount <= 0) {
        setError("Please enter a valid amount");
        return;
    }

    if (!paidBy) {
        setError("Who paid?");
        return;
    }

    if (selectedMembers.length === 0) {
        setError("Select at least one person to split with");
        return;
    }

    // 2. Process Amount (Convert to minor units, e.g. cents)
    const amountInCents = Math.round(rawAmount * 100);

    // 3. Calculate Splits
    const splits = distributeEqually(amountInCents, selectedMembers);

    if (splits.length === 0) {
        setError("Could not calculate splits");
        return;
    }

    // 4. Submit to Store
    try {
        addExpense({
            title: title.trim(),
            amount: amountInCents,
            paidBy: paidBy,
            splitType: 'EQUAL',
            splits: splits
        });
        onClose();
    } catch (err) {
        console.error(err);
        setError("Failed to save expense");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end pointer-events-none">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm pointer-events-auto"
        onClick={onClose}
      />

      {/* Modal Card */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full h-[90vh] bg-[#151923] rounded-t-[2rem] shadow-2xl flex flex-col pointer-events-auto border-t border-white/10"
      >
        {/* Header Handle */}
        <div className="w-full flex justify-center pt-4 pb-2 shrink-0 cursor-pointer" onClick={onClose}>
             <div className="w-12 h-1.5 bg-slate-700 rounded-full" />
        </div>

        {/* Close Button absolute */}
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/5 rounded-full text-slate-400">
            <X size={20} />
        </button>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-2 space-y-8 custom-scrollbar">
                
                {/* 1. Amount Input */}
                <div className="text-center pt-4">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Amount</label>
                    <div className="flex justify-center items-center gap-2">
                        <span className="text-4xl font-bold text-slate-500 pb-2">{trip?.currencySymbol}</span>
                        <input
                            type="number"
                            inputMode="decimal"
                            placeholder="0"
                            autoFocus
                            value={amountStr}
                            onChange={(e) => {
                                setError(null);
                                setAmountStr(e.target.value);
                            }}
                            className="bg-transparent text-center text-6xl font-black text-white w-48 focus:outline-none placeholder:text-slate-800 caret-primary p-0"
                        />
                    </div>
                </div>

                {/* 2. Description Input */}
                <div className="space-y-2">
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block text-center">For</label>
                     <input
                        type="text"
                        placeholder="Dinner, Taxi, Groceries..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-white/5 border border-slate-700 rounded-2xl p-4 text-center text-lg font-bold text-white focus:border-primary focus:outline-none"
                     />
                </div>

                {/* 3. Payer Selection */}
                <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block text-center">Paid By</label>
                    <div className="flex flex-wrap justify-center gap-3">
                        {members.map(m => (
                            <button
                                key={m.id}
                                type="button"
                                onClick={() => setPaidBy(m.id)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-full border transition-all ${
                                    paidBy === m.id 
                                    ? 'bg-white text-black border-white scale-105 shadow-lg' 
                                    : 'bg-transparent border-slate-700 text-slate-400 hover:border-slate-500'
                                }`}
                            >
                                <span className="text-lg">{m.avatar}</span>
                                <span className="font-bold text-sm">{m.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 4. Split Selection */}
                <div className="space-y-3 pb-8">
                     <div className="flex items-center justify-between px-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Split With</label>
                        <button type="button" onClick={handleToggleAll} className="text-xs font-bold text-primary">
                            {selectedMembers.length === members.length ? "Select None" : "Select All"}
                        </button>
                     </div>

                     <div className="grid grid-cols-2 gap-2">
                        {members.map(m => {
                            const isSelected = selectedMembers.includes(m.id);
                            return (
                                <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => handleToggleMember(m.id)}
                                    className={`
                                        p-3 rounded-2xl border flex items-center gap-3 transition-all active:scale-95
                                        ${isSelected 
                                            ? 'bg-primary/10 border-primary text-white' 
                                            : 'bg-transparent border-slate-800 text-slate-500 opacity-60'}
                                    `}
                                >
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'bg-primary border-primary' : 'border-slate-600'}`}>
                                        {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                                    </div>
                                    <span className="font-bold text-sm truncate">{m.name}</span>
                                </button>
                            );
                        })}
                     </div>
                </div>
            </div>

            {/* Error Message & Submit */}
            <div className="p-6 bg-[#151923] border-t border-white/10 shrink-0 pb-safe z-20 space-y-4">
                {error && (
                    <div className="text-rose-500 text-sm font-bold text-center bg-rose-500/10 p-2 rounded-lg animate-pulse">
                        {error}
                    </div>
                )}
                
                <Button 
                    type="submit" 
                    fullWidth 
                    size="lg" 
                    className="shadow-xl shadow-primary/25"
                >
                    Add Expense
                </Button>
            </div>
        </form>
      </motion.div>
    </div>
  );
};