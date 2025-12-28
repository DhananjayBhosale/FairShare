import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
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
    // Single source of truth loading.
    // This runs exactly once on mount.
    loadTrip();
  }, [loadTrip]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!trip) {
    return <TripSetup />;
  }

  return (
    <HashRouter>
      {/* 
        Main Container 
        Centered on desktop, full width on mobile.
      */}
      <div className="min-h-screen font-sans flex justify-center selection:bg-primary/30 relative">
        
        {/* APP FRAME */}
        <main className="w-full max-w-md h-[100dvh] relative shadow-2xl bg-transparent flex flex-col overflow-hidden">
           
           {/* SCROLLABLE CONTENT AREA */}
           <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 pb-32">
              <div className="p-6">
                <Routes>
                  {/* Default Redirect */}
                  <Route path="/" element={<Navigate to="/trip" replace />} />
                  
                  {/* Main Routes */}
                  <Route path="/trip" element={<Dashboard />} />
                  <Route path="/expenses" element={<ExpensesList />} />
                  <Route path="/settle" element={<Settlements />} />
                  <Route path="/settings" element={<Settings />} />

                  {/* Catch-all */}
                  <Route path="*" element={<Navigate to="/trip" replace />} />
                </Routes>
              </div>
           </div>

           {/* FAB (Floating Action Button) */}
           <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
              <motion.button 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={openExpenseModal}
                className="pointer-events-auto bg-white text-black rounded-full p-5 flex items-center justify-center border-4 border-[#0F172A] shadow-2xl shadow-primary/40"
              >
                <Plus size={32} strokeWidth={3} />
              </motion.button>
           </div>

           {/* NAV BAR */}
           <nav className="absolute bottom-0 left-0 right-0 z-20 pb-safe">
              <div className="absolute inset-0 bg-[#0F172A]/90 backdrop-blur-xl border-t border-white/5" />
              
              <div className="flex justify-around items-center h-20 px-2 relative z-10">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.id}
                      to={`/${item.id}`}
                      className={({ isActive }) =>
                        `flex flex-col items-center justify-center gap-1 p-2 rounded-2xl transition-all w-20 relative ${
                          isActive ? 'text-white' : 'text-slate-600'
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
                            <span className="text-[10px] font-bold relative z-10">{item.label}</span>
                          </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
           </nav>
        </main>

        {/* 
            MODAL LAYER 
            Placed OUTSIDE the 'main' overflow-hidden container to ensure z-index correctness.
        */}
        <AnimatePresence>
            {isExpenseModalOpen && (
                <div className="fixed inset-0 z-50 flex justify-center pointer-events-none">
                    <div className="w-full max-w-md relative h-full pointer-events-auto">
                        <AddExpenseModal 
                            isOpen={isExpenseModalOpen} 
                            onClose={closeExpenseModal} 
                        />
                    </div>
                </div>
            )}
        </AnimatePresence>

      </div>
    </HashRouter>
  );
};

export default App;