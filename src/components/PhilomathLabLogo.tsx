import React from 'react';

interface PhilomathLabLogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark';
}

export const PhilomathLabLogo: React.FC<PhilomathLabLogoProps> = ({
  size = 'md',
}) => {
  // Size presets
  const logoHeight = size === 'sm' ? 'h-8' : size === 'lg' ? 'h-14' : 'h-10';

  return (
    <div className="flex items-center gap-3">
      {/* Your PNG Logo */}
      <img
        src="/logo.png"
        alt="PhilomathLab Logo"
        className={`${logoHeight} w-auto object-contain`}
      />
    </div>
  );
};