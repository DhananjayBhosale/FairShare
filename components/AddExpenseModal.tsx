import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { distributeEqually } from '../utils/calculations';
import { Button } from './ui/Button';
import { MemberAvatar } from './MemberAvatar';
import { formatCurrency } from '../utils/format';
import { X, Edit2, RotateCcw, CheckCircle2, AlertCircle, Wand2, Trash2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type SplitMode = 'EQUAL' | 'EXACT';

export const AddExpenseModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { members, trip, addExpense, updateExpense, deleteExpense, editingExpenseId, expenses } = useAppStore();
  
  // Local Form State
  const [title, setTitle] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [paidBy, setPaidBy] = useState<string>('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  
  // Split Logic State
  const [splitMode, setSplitMode] = useState<SplitMode>('EQUAL');
  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>({}); 
  
  // Validation State
  const [error, setError] = useState<string | null>(null);

  // Initialize/Reset or Load Existing Data
  useEffect(() => {
    if (isOpen) {
      setError(null);
      
      if (editingExpenseId) {
          // EDIT MODE: Populate fields
          const expense = expenses.find(e => e.id === editingExpenseId);
          if (expense) {
            setTitle(expense.title);
            setAmountStr((expense.amount / 100).toString());
            setPaidBy(expense.paidBy);
            
            // Determine split mode
            const mode = expense.splitType === 'EQUAL' ? 'EQUAL' : 'EXACT';
            setSplitMode(mode);
            
            // Set selected members
            const memberIds = expense.splits.map(s => s.memberId);
            setSelectedMembers(memberIds);

            // Populate exact amounts map
            if (mode === 'EXACT') {
                const amounts: Record<string, string> = {};
                expense.splits.forEach(s => {
                    amounts[s.memberId] = (s.amount / 100).toString();
                });
                setExactAmounts(amounts);
            } else {
                setExactAmounts({});
            }
          }
      } else {
          // ADD MODE: Default State
          setTitle('');
          setAmountStr('');
          setSplitMode('EQUAL');
          setExactAmounts({});
          setPaidBy(members.length > 0 ? members[0].id : '');
          setSelectedMembers(members.map(m => m.id));
      }
    }
  }, [isOpen, editingExpenseId, members, expenses]);

  // --- Computed Values ---

  const totalAmount = parseFloat(amountStr) || 0;
  
  // Calculate stats for Exact Mode
  const assignedAmount = Object.entries(exactAmounts)
    .filter(([id]) => selectedMembers.includes(id))
    .reduce((sum, [_, val]) => sum + (parseFloat(val as string) || 0), 0);
    
  const remainingAmount = totalAmount - assignedAmount;
  const isBalanced = Math.abs(remainingAmount) < 0.01;
  const isOver = remainingAmount < -0.01;
  const isUnder = remainingAmount > 0.01;

  // --- Handlers ---

  const handleToggleMember = (id: string) => {
    setError(null);
    if (selectedMembers.includes(id)) {
       if (selectedMembers.length > 1) {
           setSelectedMembers(prev => prev.filter(m => m !== id));
           const newAmounts = { ...exactAmounts };
           delete newAmounts[id];
           setExactAmounts(newAmounts);
       }
    } else {
       setSelectedMembers(prev => [...prev, id]);
       if (splitMode === 'EXACT') {
           setExactAmounts(prev => ({ ...prev, [id]: '' }));
       }
    }
  };

  const handleToggleAll = () => {
    setError(null);
    if (selectedMembers.length === members.length) {
      const keepId = paidBy || (members[0]?.id);
      if (keepId) setSelectedMembers([keepId]);
    } else {
      setSelectedMembers(members.map(m => m.id));
    }
  };

  const switchToExactMode = () => {
    const amountInCents = Math.round(totalAmount * 100);
    const splits = distributeEqually(amountInCents, selectedMembers);
    
    const newAmounts: Record<string, string> = {};
    splits.forEach(s => {
        newAmounts[s.memberId] = (s.amount / 100).toFixed(2).replace(/\.00$/, '');
    });
    
    setExactAmounts(newAmounts);
    setSplitMode('EXACT');
  };

  const switchToEqualMode = () => {
    setSplitMode('EQUAL');
    setExactAmounts({});
  };

  const handleExactAmountChange = (id: string, val: string) => {
      if (/^\d*\.?\d{0,2}$/.test(val)) {
          setExactAmounts(prev => ({ ...prev, [id]: val }));
      }
  };

  const assignRemainingTo = (id: string) => {
      const currentVal = parseFloat(exactAmounts[id] || '0');
      const newVal = currentVal + remainingAmount;
      if (newVal < 0) return;
      setExactAmounts(prev => ({
          ...prev,
          [id]: newVal.toFixed(2).replace(/\.00$/, '')
      }));
  };

  const handleDelete = () => {
      if (editingExpenseId && confirm("Are you sure you want to delete this expense?")) {
          deleteExpense(editingExpenseId);
          onClose();
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Basic Validation
    if (!title.trim()) { setError("Please enter a description"); return; }
    if (isNaN(totalAmount) || totalAmount <= 0) { setError("Please enter a valid amount"); return; }
    if (!paidBy) { setError("Who paid?"); return; }
    if (selectedMembers.length === 0) { setError("Select at least one person"); return; }

    const amountInCents = Math.round(totalAmount * 100);
    let finalSplits: { memberId: string, amount: number }[] = [];

    // 2. Logic based on Mode
    if (splitMode === 'EQUAL') {
        finalSplits = distributeEqually(amountInCents, selectedMembers);
        if (finalSplits.length === 0) { setError("Could not calculate splits"); return; }
    } else {
        if (!isBalanced) {
            setError(`Amounts must equal ${trip?.currencySymbol}${totalAmount}`);
            return;
        }

        let checkSum = 0;
        selectedMembers.forEach(id => {
            const val = parseFloat(exactAmounts[id] || '0');
            const valCents = Math.round(val * 100);
            checkSum += valCents;
            finalSplits.push({ memberId: id, amount: valCents });
        });

        const diff = amountInCents - checkSum;
        if (diff !== 0 && finalSplits.length > 0) {
            finalSplits[0].amount += diff;
        }
    }

    // 3. Submit (Update or Create)
    try {
        const payload = {
            title: title.trim(),
            amount: amountInCents,
            paidBy: paidBy,
            splitType: splitMode,
            splits: finalSplits
        };

        if (editingExpenseId) {
            await updateExpense(editingExpenseId, payload);
        } else {
            addExpense(payload);
        }
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
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm pointer-events-auto"
        onClick={onClose}
      />

      {/* Modal Card */}
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full h-[90vh] bg-[#151923] rounded-t-[2rem] shadow-2xl flex flex-col pointer-events-auto border-t border-white/10"
      >
        {/* Handle & Close */}
        <div className="w-full flex justify-center pt-4 pb-2 shrink-0 cursor-pointer" onClick={onClose}>
             <div className="w-12 h-1.5 bg-slate-700 rounded-full" />
        </div>
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

                {/* 2. Description */}
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

                {/* 4. Split Section */}
                <div className="space-y-4 pb-8">
                     
                     {/* Header with Switcher */}
                     <div className="flex items-center justify-between px-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                            Split With {splitMode === 'EXACT' && '(Exact)'}
                        </label>
                        
                        {splitMode === 'EQUAL' ? (
                            <button 
                                type="button" 
                                onClick={switchToExactMode}
                                className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
                            >
                                <Edit2 size={12} />
                                Edit amounts
                            </button>
                        ) : (
                            <button 
                                type="button" 
                                onClick={switchToEqualMode}
                                className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
                            >
                                <RotateCcw size={12} />
                                Reset to Equal
                            </button>
                        )}
                     </div>

                     {/* Validation Bar (Only in Exact Mode) */}
                     <AnimatePresence>
                         {splitMode === 'EXACT' && (
                             <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="bg-slate-900/50 rounded-xl overflow-hidden"
                             >
                                 <div className={`px-4 py-3 flex items-center justify-between text-sm font-bold border-l-4 ${
                                     isBalanced ? 'border-emerald-500' : isUnder ? 'border-amber-500' : 'border-rose-500'
                                 }`}>
                                     <span className="text-slate-400">
                                         {isBalanced ? "All amounts assigned!" : isUnder ? "Remaining" : "Overassigned"}
                                     </span>
                                     <span className={
                                         isBalanced ? 'text-emerald-400' : isUnder ? 'text-amber-400' : 'text-rose-400'
                                     }>
                                         {isBalanced ? (
                                             <span className="flex items-center gap-1"><CheckCircle2 size={14}/> Perfect</span>
                                         ) : (
                                             <span>{formatCurrency(Math.abs(remainingAmount) * 100, trip?.currencySymbol)}</span>
                                         )}
                                     </span>
                                 </div>
                             </motion.div>
                         )}
                     </AnimatePresence>

                     {/* Content Body */}
                     {splitMode === 'EQUAL' ? (
                         /* EQUAL MODE: Chips */
                         <>
                            <div className="flex justify-end px-2">
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
                         </>
                     ) : (
                         /* EXACT MODE: List with Inputs */
                         <div className="space-y-2">
                            {members.filter(m => selectedMembers.includes(m.id)).map(m => (
                                <motion.div 
                                    key={m.id}
                                    layout
                                    className="flex items-center gap-3 bg-white/5 border border-white/10 p-3 rounded-2xl"
                                >
                                    <MemberAvatar member={m} size="sm" />
                                    <span className="flex-1 font-bold text-white text-sm truncate">{m.name}</span>
                                    
                                    <div className="flex items-center gap-2">
                                        {/* Helper: Auto assign remaining if this is the target */}
                                        {isUnder && (
                                            <button 
                                                type="button"
                                                onClick={() => assignRemainingTo(m.id)}
                                                className="text-primary opacity-50 hover:opacity-100 p-1"
                                                title="Add remaining"
                                            >
                                                <Wand2 size={14} />
                                            </button>
                                        )}
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">
                                                {trip?.currencySymbol}
                                            </span>
                                            <input
                                                type="number" 
                                                inputMode="decimal"
                                                value={exactAmounts[m.id] || ''}
                                                onChange={(e) => handleExactAmountChange(m.id, e.target.value)}
                                                placeholder="0"
                                                className="w-24 bg-black/20 border border-white/10 rounded-xl py-2 pl-7 pr-3 text-right font-bold text-white focus:border-primary focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                            
                            {/* Add back unselected members */}
                            {members.filter(m => !selectedMembers.includes(m.id)).length > 0 && (
                                <div className="pt-2">
                                    <p className="text-xs text-slate-500 font-bold mb-2 px-2 uppercase tracking-wide">Not Included</p>
                                    <div className="flex flex-wrap gap-2">
                                        {members.filter(m => !selectedMembers.includes(m.id)).map(m => (
                                            <button 
                                                key={m.id}
                                                type="button"
                                                onClick={() => handleToggleMember(m.id)}
                                                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full px-3 py-1.5 opacity-60"
                                            >
                                                <span className="text-xs">{m.avatar}</span>
                                                <span className="text-xs font-bold text-slate-300">{m.name}</span>
                                                <Plus size={12} className="text-slate-500" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                         </div>
                     )}
                </div>
            </div>

            {/* Error Message & Submit */}
            <div className="p-6 bg-[#151923] border-t border-white/10 shrink-0 pb-safe z-20 space-y-4">
                {error && (
                    <div className="flex items-center justify-center gap-2 text-rose-500 text-sm font-bold bg-rose-500/10 p-3 rounded-xl animate-pulse">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}
                
                <div className="flex gap-3">
                    {/* Delete button only in Edit Mode */}
                    {editingExpenseId && (
                        <Button 
                            type="button" 
                            variant="danger"
                            onClick={handleDelete}
                            className="w-16 flex items-center justify-center shrink-0"
                        >
                            <Trash2 size={20} />
                        </Button>
                    )}

                    <Button 
                        type="submit" 
                        fullWidth 
                        size="lg" 
                        disabled={splitMode === 'EXACT' && !isBalanced}
                        className={`shadow-xl shadow-primary/25 ${
                            splitMode === 'EXACT' && !isBalanced ? 'opacity-50 grayscale' : ''
                        }`}
                    >
                        {splitMode === 'EXACT' && !isBalanced 
                            ? 'Amounts must match total' 
                            : editingExpenseId ? 'Save Changes' : 'Add Expense'
                        }
                    </Button>
                </div>
            </div>
        </form>
      </motion.div>
    </div>
  );
};

// Simple Plus icon for the "Not included" section
const Plus = ({ size, className }: { size: number, className?: string }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);