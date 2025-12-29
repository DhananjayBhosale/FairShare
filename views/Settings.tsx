import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Button } from '../components/ui/Button';
import { LogOut, Trash2, Edit, UserPlus, Plus, Map, Check } from 'lucide-react';
import { MemberAvatar } from '../components/MemberAvatar';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';

export const Settings: React.FC = () => {
  const { trip, trips, members, deleteTrip, removeMember, addMember, switchTrip, startCreatingTrip } = useAppStore();
  const [newMemberName, setNewMemberName] = useState('');

  const handleDeleteTrip = async () => {
    if (confirm("Are you sure you want to delete this trip and all its data?")) {
      if (trip) await deleteTrip(trip.id);
    }
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMemberName.trim()) {
        addMember(newMemberName.trim());
        setNewMemberName('');
    }
  };

  return (
    <div className="space-y-8 pb-32 pt-4">
      <h1 className="text-3xl font-extrabold text-white">Manage</h1>

      {/* Switch Trip Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Your Trips</h2>
            <button 
                onClick={startCreatingTrip}
                className="text-xs font-bold text-primary flex items-center gap-1 hover:text-white transition-colors"
            >
                <Plus size={14} /> New Trip
            </button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x px-1 -mx-1 no-scrollbar">
            {trips.map(t => {
                const isActive = t.id === trip?.id;
                return (
                    <button
                        key={t.id}
                        onClick={() => !isActive && switchTrip(t.id)}
                        className={`flex-shrink-0 snap-center w-40 p-4 rounded-2xl border text-left transition-all ${
                            isActive 
                            ? 'bg-white/10 border-white/20 shadow-lg' 
                            : 'bg-white/5 border-transparent opacity-60 hover:opacity-100'
                        }`}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <Map size={20} className={isActive ? 'text-white' : 'text-slate-500'} />
                            {isActive && <Check size={16} className="text-emerald-400" />}
                        </div>
                        <div className="font-bold text-white truncate">{t.name}</div>
                        <div className="text-xs text-slate-500">{new Date(t.createdAt).toLocaleDateString()}</div>
                    </button>
                )
            })}
        </div>
      </section>

      {/* Trip Info */}
      <section className="glass-card p-6 rounded-3xl space-y-4">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Current Trip</h2>
        <div>
          <div className="text-2xl font-bold text-white">{trip?.name}</div>
          <div className="text-sm text-slate-400">
             Started on {new Date(trip?.createdAt || 0).toLocaleDateString()}
          </div>
        </div>
      </section>

      {/* Member List */}
      <section className="space-y-4">
         <div className="flex items-center justify-between px-2">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">People</h2>
            <span className="text-xs font-medium text-slate-600">{members.length} members</span>
         </div>
         
         <div className="grid grid-cols-1 gap-3">
             {members.map(member => (
                 <div key={member.id} className="glass-card p-3 rounded-2xl flex items-center justify-between">
                     <div className="flex items-center gap-3">
                         <MemberAvatar member={member} size="sm" />
                         <span className="font-bold text-white">{member.name}</span>
                     </div>
                     <button 
                         onClick={() => { if(confirm('Remove?')) removeMember(member.id) }}
                         className="p-2 text-slate-500 hover:text-rose-500 transition-colors"
                     >
                         <X size={16} />
                     </button>
                 </div>
             ))}
         </div>

         {/* Add New Member Input */}
         <form onSubmit={handleAddMember} className="glass-card p-2 pl-4 rounded-2xl flex items-center gap-3 border border-dashed border-white/20 mt-4">
            <UserPlus size={18} className="text-slate-500" />
            <input 
                type="text" 
                placeholder="Add new person..." 
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                className="flex-1 bg-transparent text-sm font-bold text-white placeholder:text-slate-600 focus:outline-none py-2"
            />
            <button 
                type="submit"
                disabled={!newMemberName.trim()}
                className="p-2 bg-primary/20 text-primary rounded-xl disabled:opacity-50 disabled:bg-slate-800 disabled:text-slate-600"
            >
                <Plus size={18} />
            </button>
         </form>
      </section>

      {/* Danger Zone */}
      <section className="space-y-4 pt-8">
        <Button variant="danger" fullWidth onClick={handleDeleteTrip}>
          <Trash2 size={18} className="mr-2 inline" />
          Delete Trip
        </Button>
      </section>
    </div>
  );
};