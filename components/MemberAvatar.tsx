import React from 'react';
import { Member } from '../types';

interface MemberAvatarProps {
  member: Member;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}

export const MemberAvatar: React.FC<MemberAvatarProps> = ({ member, size = 'md', showName = false }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-xl',
    lg: 'w-16 h-16 text-3xl',
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div 
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center relative`}
        style={{ 
          backgroundColor: member.color,
          boxShadow: `0 0 15px ${member.color}60` // Glow effect based on member color
        }}
      >
        <div className="absolute inset-0 rounded-full bg-black/10"></div> {/* Inner shadow overlay */}
        <span className="relative z-10 drop-shadow-md">{member.avatar}</span>
      </div>
      {showName && (
        <span className="text-xs font-bold text-slate-300 truncate max-w-[80px]">
          {member.name}
        </span>
      )}
    </div>
  );
};