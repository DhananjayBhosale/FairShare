import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { Button } from '../components/ui/Button';
import { AVATARS } from '../constants';
import { ChevronRight, Plus, Sparkles, WifiOff, ShieldCheck, Zap } from 'lucide-react';

type Step = 'TRIP_DETAILS' | 'ADD_MEMBERS';

export const TripSetup: React.FC = () => {
  const { startTrip } = useAppStore();
  
  const [step, setStep] = useState<Step>('TRIP_DETAILS');
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('₹');
  
  const [members, setMembers] = useState<{name: string, avatar: string}[]>([]);
  const [tempName, setTempName] = useState('');
  const [tempAvatar, setTempAvatar] = useState(AVATARS[0]);

  const handleAddMember = () => {
    if (!tempName.trim()) return;
    setMembers([...members, { name: tempName.trim(), avatar: tempAvatar }]);
    setTempName('');
    setTempAvatar(AVATARS[(members.length + 1) % AVATARS.length]);
  };

  const handleFinish = () => {
    if (members.length < 1) return;
    startTrip(name, currency, members);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2 animate-blob" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-3xl translate-y-1/2 translate-x-1/2 animate-blob animation-delay-2000" />

      <main className="w-full max-w-md relative z-10 flex flex-col flex-1 justify-center">
        <AnimatePresence mode="wait">
          {step === 'TRIP_DETAILS' && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className="space-y-8"
            >
               <header className="text-center space-y-2">
                 <motion.div 
                   initial={{ scale: 0 }} animate={{ scale: 1 }}
                   className="w-20 h-20 bg-gradient-to-tr from-primary to-accent rounded-3xl mx-auto flex items-center justify-center shadow-xl shadow-primary/30 mb-6"
                 >
                   <Sparkles className="text-white w-10 h-10" />
                 </motion.div>
                 <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                   FairShare
                 </h1>
                 <p className="text-slate-400 font-medium text-lg">The fun way to split bills.</p>
               </header>

               <div className="glass-card p-6 rounded-3xl space-y-6">
                 <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Trip Name</label>
                   <input
                     type="text"
                     placeholder="e.g. Goa Roadtrip"
                     value={name}
                     autoFocus
                     onChange={(e) => setName(e.target.value)}
                     className="w-full bg-surface/50 border border-white/10 rounded-2xl p-4 text-xl font-bold text-white placeholder:text-slate-600 focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                   />
                 </div>

                 <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Currency</label>
                   <div className="grid grid-cols-4 gap-2">
                     {['₹', '$', '€', '£'].map((sym) => (
                       <button
                         key={sym}
                         onClick={() => setCurrency(sym)}
                         className={`py-3 rounded-2xl font-bold text-lg transition-all ${
                           currency === sym 
                             ? 'bg-white text-black shadow-lg scale-105' 
                             : 'bg-surface/50 text-slate-500 hover:bg-surface'
                         }`}
                       >
                         {sym}
                       </button>
                     ))}
                   </div>
                 </div>

                 <Button 
                    fullWidth 
                    size="lg" 
                    onClick={() => setStep('ADD_MEMBERS')} 
                    disabled={!name.trim()}
                    className="mt-4"
                  >
                    Next Step <ChevronRight size={18} className="ml-2 inline" />
                  </Button>
               </div>

               {/* SEO Content Section */}
               <section className="mt-8 pt-8 border-t border-white/5 space-y-4">
                  <div className="grid grid-cols-1 gap-4 text-slate-400 text-sm">
                    <div className="flex items-start gap-3">
                      <WifiOff className="text-primary mt-1" size={20} />
                      <div>
                        <h2 className="text-white font-bold mb-0.5">Offline First</h2>
                        <p>Works completely without internet. Perfect for remote trips and flights.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="text-secondary mt-1" size={20} />
                      <div>
                        <h2 className="text-white font-bold mb-0.5">Private & Secure</h2>
                        <p>No login required. Your data stays on your device and is never sent to a server.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Zap className="text-accent mt-1" size={20} />
                      <div>
                        <h2 className="text-white font-bold mb-0.5">Visual Splitting</h2>
                        <p>See who owes whom instantly with beautiful, interactive visualizations.</p>
                      </div>
                    </div>
                  </div>
               </section>
            </motion.div>
          )}

          {step === 'ADD_MEMBERS' && (
            <motion.div
              key="members"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-6"
            >
               <div className="text-center">
                 <h2 className="text-3xl font-bold text-white mb-2">Who's Going?</h2>
                 <p className="text-slate-400">Add everyone joining the trip.</p>
               </div>

               {/* Member List Animation */}
               <div className="flex flex-wrap gap-3 justify-center min-h-[60px]">
                 <AnimatePresence>
                   {members.map((m, i) => (
                     <motion.div
                       key={i}
                       initial={{ scale: 0, opacity: 0 }}
                       animate={{ scale: 1, opacity: 1 }}
                       exit={{ scale: 0, opacity: 0 }}
                       className="glass-card pl-2 pr-4 py-1.5 rounded-full flex items-center gap-2 border-white/20"
                     >
                       <span className="text-xl">{m.avatar}</span>
                       <span className="font-bold text-white">{m.name}</span>
                     </motion.div>
                   ))}
                 </AnimatePresence>
               </div>

               {/* Add Form */}
               <div className="glass-card p-4 rounded-3xl space-y-4">
                 <div className="flex gap-2">
                    <button 
                      onClick={() => setTempAvatar(AVATARS[(AVATARS.indexOf(tempAvatar) + 1) % AVATARS.length])}
                      className="w-14 h-14 bg-surface rounded-2xl flex items-center justify-center text-2xl hover:bg-surface/80 active:scale-95 transition-all"
                    >
                      {tempAvatar}
                    </button>
                    <input
                      type="text"
                      placeholder="Name"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddMember()}
                      className="flex-1 bg-background border border-white/10 rounded-2xl px-4 text-lg font-bold text-white focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                    <button 
                      onClick={handleAddMember}
                      disabled={!tempName.trim()}
                      className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center disabled:opacity-50 hover:bg-primary/90 active:scale-95 transition-all"
                    >
                      <Plus size={24} />
                    </button>
                 </div>
               </div>

               <div className="flex gap-3 pt-4">
                  <Button variant="ghost" onClick={() => setStep('TRIP_DETAILS')}>
                    Back
                  </Button>
                  <Button 
                    fullWidth 
                    size="lg" 
                    onClick={handleFinish} 
                    disabled={members.length === 0}
                  >
                    Start Adventure 🚀
                  </Button>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};