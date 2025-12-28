import React, { useEffect } from 'react';
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
  const { trip, isLoading, loadTrip, isExpenseModalOpen, openExpenseModal, closeExpenseModal } = useAppStore();

  useEffect(() => {
    loadTrip();
  }, [loadTrip]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!trip) {
    return <TripSetup />;
  }

  return (
    <BrowserRouter>
      {/* Background is handled in index.html, we just need transparency here */}
      <div className="min-h-screen text-slate-100 font-sans flex justify-center selection:bg-primary/30">
        
        <main className="w-full max-w-md h-full min-h-screen relative shadow-2xl overflow-hidden bg-transparent">
           
           {/* Top Content Area */}
           <div className="p-6 h-full min-h-screen overflow-y-auto custom-scrollbar relative z-10 pb-32">
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
                animate={{ 
                    scale: [1, 1.05, 1],
                    boxShadow: ["0px 0px 20px rgba(139, 92, 246, 0.3)", "0px 0px 40px rgba(139, 92, 246, 0.6)", "0px 0px 20px rgba(139, 92, 246, 0.3)"]
                }}
                transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={openExpenseModal}
                className="pointer-events-auto bg-white text-black rounded-full p-5 flex items-center justify-center border-4 border-[#0F172A]"
              >
                <Plus size={32} strokeWidth={3} />
              </motion.button>
           </div>

           {/* Bottom Navigation */}
           <nav className="fixed bottom-0 left-0 right-0 z-30 pb-safe">
             {/* Glass background for nav */}
              <div className="absolute inset-0 bg-[#0F172A]/80 backdrop-blur-xl border-t border-white/5" />
              
              <div className="max-w-md mx-auto flex justify-around items-center h-20 px-2 relative z-10">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.id}
                      to={`/${item.id}`}
                      className={({ isActive }) =>
                        `flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all w-16 relative ${
                          isActive ? 'text-white' : 'text-slate-600 hover:text-slate-400'
                        }`
                      }
                    >
                      {({ isActive }) => (
                          <>
                            {isActive && (
                                <motion.div 
                                    layoutId="nav-bg"
                                    className="absolute inset-0 bg-white/5 rounded-2xl"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} className="relative z-10" />
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
                  onClose={closeExpenseModal} 
               />
             )}
           </AnimatePresence>

        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;