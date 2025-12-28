import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { Button } from '../components/ui/Button';
import { AVATARS } from '../constants';
import { ChevronRight, Plus, Sparkles, Settings, X, ArrowRight } from 'lucide-react';
import { MemberAvatar } from '../components/MemberAvatar';

type Step = 'TRIP_DETAILS' | 'ADD_MEMBERS';

export const TripSetup: React.FC = () => {
  const { startTrip } = useAppStore();
  
  const [step, setStep] = useState<Step>('TRIP_DETAILS');
  const [showSettings, setShowSettings] = useState(false);
  
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('₹');
  
  // No default members - we build the squad from scratch
  const [members, setMembers] = useState<{name: string, avatar: string, color: string}[]>([]);
  const [tempName, setTempName] = useState('');
  
  // Cycle random avatar for the input
  const [nextAvatarIndex, setNextAvatarIndex] = useState(0);

  const handleAddMember = () => {
    if (!tempName.trim()) return;
    
    // Assign a temporary color for preview (actual color assigned in store)
    const tempColor = '#fff'; 

    setMembers([...members, { 
        name: tempName.trim(), 
        avatar: AVATARS[nextAvatarIndex % AVATARS.length],
        color: tempColor 
    }]);
    
    setTempName('');
    setNextAvatarIndex(prev => prev + 1);
  };

  const handleFinish = () => {
    if (members.length < 1) return;
    startTrip(name, currency, members);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[100px] animate-blob" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/20 rounded-full blur-[100px] animate-blob animation-delay-2000" />
      </div>

      {/* Settings Toggle */}
      <div className="absolute top-6 right-6 z-40">
        <button 
          onClick={() => setShowSettings(true)}
          className="p-3 bg-white/5 hover:bg-white/10 rounded-full backdrop-blur-md border border-white/10 text-slate-400 hover:text-white transition-all shadow-lg active:scale-95"
        >
          <Settings size={24} />
        </button>
      </div>

      <main className="w-full max-w-md relative z-10 flex flex-col flex-1 justify-center">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: NAMING */}
          {step === 'TRIP_DETAILS' && (
            <motion.div
              key="details"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, x: -50, scale: 0.95 }}
              className="flex flex-col items-center text-center space-y-10"
            >
               <motion.div 
                 initial={{ y: 20, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 transition={{ delay: 0.2 }}
                 className="relative"
               >
                 <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                 <Sparkles className="relative text-white w-16 h-16" strokeWidth={1.5} />
               </motion.div>

               <div className="space-y-4 w-full">
                 <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400 leading-tight">
                   Let's plan a<br/>new adventure.
                 </h1>
                 
                 <div className="relative group">
                    <input
                        type="text"
                        placeholder="Trip Name..."
                        value={name}
                        autoFocus
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-transparent border-b-2 border-white/20 py-4 text-center text-3xl font-bold text-white placeholder:text-slate-700 focus:border-primary focus:outline-none transition-all"
                    />
                    <div className="absolute bottom-0 left-0 h-0.5 bg-primary w-0 group-focus-within:w-full transition-all duration-500" />
                 </div>
               </div>

               <Button 
                  size="lg" 
                  onClick={() => setStep('ADD_MEMBERS')} 
                  disabled={!name.trim()}
                  className="rounded-full px-10 h-16 text-lg shadow-xl shadow-primary/20"
                >
                  Start Building Squad <ArrowRight className="ml-2" />
                </Button>
            </motion.div>
          )}

          {/* STEP 2: SQUAD */}
          {step === 'ADD_MEMBERS' && (
            <motion.div
              key="members"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col h-full max-h-[80vh]"
            >
               <div className="text-center mb-8">
                 <h2 className="text-3xl font-extrabold text-white mb-2">Who's going?</h2>
                 <p className="text-slate-400 font-medium">Add your friends (and yourself!)</p>
               </div>

               {/* Dynamic Grid of Members */}
               <div className="flex-1 overflow-y-auto min-h-[200px] content-start p-4">
                 <div className="flex flex-wrap gap-4 justify-center">
                    <AnimatePresence mode="popLayout">
                        {members.map((m, i) => (
                            <motion.div
                            key={`${m.name}-${i}`}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            layout
                            className="flex flex-col items-center gap-2"
                            >
                                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-3xl shadow-lg backdrop-blur-sm">
                                    {m.avatar}
                                </div>
                                <span className="font-bold text-sm text-white">{m.name}</span>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    
                    {/* Ghost Chip for Empty State */}
                    {members.length === 0 && (
                        <div className="w-full h-32 flex items-center justify-center border-2 border-dashed border-white/10 rounded-3xl text-slate-600">
                            Add the first person 👇
                        </div>
                    )}
                 </div>
               </div>

               {/* Input Area */}
               <div className="mt-auto space-y-4 pt-6">
                 <div className="glass-card p-2 pl-6 rounded-full flex items-center gap-4 border border-white/20 shadow-2xl">
                    <input
                      type="text"
                      placeholder="Name..."
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddMember()}
                      className="flex-1 bg-transparent text-lg font-bold text-white placeholder:text-slate-600 focus:outline-none"
                    />
                    <button 
                      onClick={handleAddMember}
                      disabled={!tempName.trim()}
                      className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center disabled:opacity-50 disabled:scale-90 hover:scale-110 active:scale-90 transition-all"
                    >
                      <Plus size={24} strokeWidth={3} />
                    </button>
                 </div>

                 <div className="flex gap-4">
                    <Button variant="ghost" className="flex-1" onClick={() => setStep('TRIP_DETAILS')}>
                        Back
                    </Button>
                    <Button 
                        className="flex-[2]" 
                        onClick={handleFinish}
                        disabled={members.length < 1} // Allow single player for testing
                    >
                        Let's Go! 🚀
                    </Button>
                 </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Settings Modal - Redesigned */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md" 
              onClick={() => setShowSettings(false)} 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-[#1A1F2E] border border-white/10 rounded-[2rem] p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-white">Preferences</h2>
                <button onClick={() => setShowSettings(false)} className="p-2 bg-white/5 rounded-full text-slate-400">
                  <X size={20}/>
                </button>
              </div>

               <div className="space-y-4">
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Currency</label>
                 <div className="grid grid-cols-4 gap-3">
                   {['₹', '$', '€', '£'].map((sym) => (
                     <button
                       key={sym}
                       onClick={() => setCurrency(sym)}
                       className={`h-14 rounded-2xl font-bold text-xl transition-all flex items-center justify-center ${
                         currency === sym 
                           ? 'bg-white text-black scale-105 shadow-lg shadow-white/20' 
                           : 'bg-white/5 text-slate-500 hover:bg-white/10'
                       }`}
                     >
                       {sym}
                     </button>
                   ))}
                 </div>
               </div>

              <div className="mt-8">
                 <Button fullWidth onClick={() => setShowSettings(false)}>Done</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};