import React from 'react';
import { Member } from '../types';
import { motion } from 'framer-motion';

interface MemberAvatarProps {
  member: Member;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showName?: boolean;
  className?: string;
}

export const MemberAvatar: React.FC<MemberAvatarProps> = ({ 
  member, 
  size = 'md', 
  showName = false,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-xl',
    lg: 'w-16 h-16 text-3xl',
    xl: 'w-24 h-24 text-5xl',
  };

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <motion.div 
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center relative select-none`}
        style={{ 
          backgroundColor: `${member.color}20`, // 20% opacity fill
          border: `2px solid ${member.color}`,
          boxShadow: `0 0 15px ${member.color}40, inset 0 0 10px ${member.color}20` 
        }}
      >
        <span className="relative z-10 drop-shadow-md filter">{member.avatar}</span>
      </motion.div>
      {showName && (
        <span className="text-xs font-bold text-slate-300 truncate max-w-[80px]">
          {member.name}
        </span>
      )}
    </div>
  );
};