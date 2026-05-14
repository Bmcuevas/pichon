import React from 'react';

export const Logo: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 24 }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M12 22c-4.4 0-8-3.6-8-8 0-6.6 4.4-12 8-12s8 5.4 8 12c0 4.4-3.6 8-8 8z"/>
      <path d="M8 12.5l2 2 2-3 2 3 2-2"/>
    </svg>
  );
};
