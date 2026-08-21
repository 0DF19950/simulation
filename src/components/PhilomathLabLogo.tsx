import React from 'react';

interface PhilomathLabLogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark';
}

export const PhilomathLabLogo: React.FC<PhilomathLabLogoProps> = ({
  size = 'md',
  variant = 'light',
}) => {
  // Size presets
  const logoHeight = size === 'sm' ? 'h-8' : size === 'lg' ? 'h-14' : 'h-10';
  const colorClass = variant === 'dark' ? 'text-cream' : 'text-deepteal';

  return (
    <div className="flex items-center gap-3">
      <svg
        viewBox="0 0 240 180"
        className={`${logoHeight} w-auto ${colorClass}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="PhilomathLab Logo"
      >
        <g stroke="currentColor" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" fill="none">
          {/* Left Wing Feathers */}
          <path d="M 76 42 L 50 16" />
          <path d="M 60 56 L 34 30" />

          {/* Right Wing Feathers */}
          <path d="M 164 42 L 190 16" />
          <path d="M 180 56 L 206 30" />

          {/* Left Eye Outer Arc */}
          <path d="M 120 48 C 92 48 70 70 70 98 C 70 126 92 148 120 148 C 132 148 143 143 151 134" />

          {/* Right Eye Outer Arc */}
          <path d="M 120 48 C 148 48 170 70 170 98 C 170 126 148 148 120 148 C 108 148 97 143 89 134" />

          {/* Inner Eye Goggles / Spiral Loops */}
          <path d="M 94 98 A 18 18 0 1 0 112 80 L 112 98" />
          <path d="M 146 98 A 18 18 0 1 1 128 80 L 128 98" />

          {/* Central Pointed Beak */}
          <path d="M 104 128 L 120 162 L 136 128" />
        </g>
      </svg>
    </div>
  );
};