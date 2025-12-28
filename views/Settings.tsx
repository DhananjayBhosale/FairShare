import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { Button } from '../components/ui/Button';
import { LogOut, Trash2, Edit } from 'lucide-react';
import { MemberAvatar } from '../components/MemberAvatar';

export const Settings: React.FC = () => {
  const { trip, members, resetTrip, removeMember } = useAppStore();

  const handleEndTrip = async () => {
    if (confirm("Are you sure you want to delete this trip?")) {
      await resetTrip();
    }
  };

  return (
    <div className="space-y-8 pb-32 pt-4">
      <h1 className="text-3xl font-extrabold text-white">Manage Trip</h1>

      {/* Trip Info */}
      <section className="glass-card p-6 rounded-3xl space-y-4">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Trip Details</h2>
        <div>
          <div className="text-2xl font-bold text-white">{trip?.name}</div>
          <div className="text-sm text-slate-400">
             Started on {new Date(trip?.createdAt || 0).toLocaleDateString()}
          </div>
        </div>
      </section>

      {/* Member List (Read Only-ish) */}
      <section className="space-y-4">
         <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2">People</h2>
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
      </section>

      {/* Danger Zone */}
      <section className="space-y-4 pt-8">
        <Button variant="danger" fullWidth onClick={handleEndTrip}>
          <LogOut size={18} className="mr-2 inline" />
          End Trip & Clear Data
        </Button>
      </section>
    </div>
  );
};

// Simple Icon helper for this file
import { X } from 'lucide-react';
