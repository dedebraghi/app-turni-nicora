import React from 'react';

export const NicoraLogo: React.FC<{ className?: string; size?: number; variant?: 'icon' | 'white' }> = ({
  className = '',
  size = 32,
  variant = 'icon',
}) => {
  if (variant === 'white') {
    return (
      <img
        src="/nicora-marchio-white.svg"
        alt="Nicora Garden"
        className={`object-contain ${className}`}
        style={{ height: size, width: 'auto' }}
      />
    );
  }

  return (
    <img
      src="/nicora-marchio.svg"
      alt="Nicora Garden"
      className={`object-contain ${className}`}
      style={{ height: size, width: 'auto' }}
    />
  );
};
