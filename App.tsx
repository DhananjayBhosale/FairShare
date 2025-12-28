import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { useAppStore } from './store/useAppStore';
import { TripSetup } from './views/TripSetup';
import { Dashboard } from './views/Dashboard';
import { ExpensesList } from './views/ExpensesList';
import { Settlements } from './views/Settlements';
import { Settings } from './views/Settings';
import { NAV_ITEMS } from './constants';
import { Plus } from 'lucide-react';
import { AddExpenseModal } from './components/AddExpenseModal';
import { AnimatePresence, motion } from 'framer-motion';

const App: React.FC = () => {
  const { trip, isLoading, loadTrip } = useAppStore();
  const [isExpenseModalOpen, setExpenseModalOpen] = useState(false);

  useEffect(() => {
    loadTrip();
  }, [loadTrip]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse w-16 h-16 rounded-full bg-primary/50 blur-xl"></div>
      </div>
    );
  }

  if (!trip) {
    return <TripSetup />;
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen text-slate-100 font-sans flex justify-center selection:bg-primary/30">
        
        <main className="w-full max-w-md h-full min-h-screen relative backdrop-blur-sm sm:border-x sm:border-white/5 shadow-2xl">
           
           {/* Top Content Area */}
           <div className="p-6 h-full min-h-screen overflow-y-auto custom-scrollbar relative z-10">
              <Routes>
                <Route path="/" element={<Navigate to="/trip" replace />} />
                <Route path="/trip" element={<Dashboard />} />
                <Route path="/expenses" element={<ExpensesList />} />
                <Route path="/settle" element={<Settlements />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
           </div>

           {/* Floating Add Button */}
           <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
              <motion.button 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setExpenseModalOpen(true)}
                className="pointer-events-auto bg-gradient-to-tr from-primary to-accent text-white rounded-3xl p-5 shadow-xl shadow-primary/40 flex items-center justify-center"
              >
                <Plus size={32} strokeWidth={3} />
              </motion.button>
           </div>

           {/* Bottom Navigation */}
           <nav className="fixed bottom-0 left-0 right-0 z-30 pb-safe">
             {/* Glass background for nav */}
              <div className="absolute inset-0 bg-[#0B0E14]/80 backdrop-blur-xl border-t border-white/5" />
              
              <div className="max-w-md mx-auto flex justify-around items-center h-20 px-2 relative z-10">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.id}
                      to={`/${item.id}`}
                      className={({ isActive }) =>
                        `flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all w-16 ${
                          isActive ? 'text-primary scale-110' : 'text-slate-500 hover:text-slate-300'
                        }`
                      }
                    >
                      {({ isActive }) => (
                          <>
                            <Icon size={24} strokeWidth={isActive ? 3 : 2} />
                            {isActive && <motion.div layoutId="nav-dot" className="w-1 h-1 bg-primary rounded-full" />}
                          </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
           </nav>

           {/* Modals */}
           <AnimatePresence>
             {isExpenseModalOpen && (
               <AddExpenseModal 
                  isOpen={isExpenseModalOpen} 
                  onClose={() => setExpenseModalOpen(false)} 
               />
             )}
           </AnimatePresence>

        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;