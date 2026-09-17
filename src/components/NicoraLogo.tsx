import React from 'react';

export const NicoraLogo: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 28 }) => {
  return (
    <div 
      className={`relative inline-flex items-center justify-center rounded-lg bg-nicora-teal text-white shadow-sm overflow-hidden flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" fill="none" className="w-full h-full p-1">
        <path 
          d="M50 15C38 28 26 44 26 60C26 73.25 36.75 84 50 84C63.25 84 74 73.25 74 60C74 44 62 28 50 15Z" 
          fill="#E75113"
        />
        <path 
          d="M50 32C44 42 36 52 36 63C36 70.73 42.27 77 50 77C57.73 77 64 70.73 64 63C64 52 56 42 50 32Z" 
          fill="#FFFFFF" 
          opacity="0.25"
        />
        <path d="M50 35V75" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round"/>
        <path d="M50 50L38 42" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round"/>
        <path d="M50 60L62 53" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round"/>
      </svg>
    </div>
  );
};
