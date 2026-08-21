import React from 'react';

interface PhilomathLabLogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  variant?: 'light' | 'dark' | 'gold';
  layout?: 'horizontal' | 'vertical';
}

export const PhilomathLabLogo: React.FC<PhilomathLabLogoProps> = ({
  className = '',
  iconOnly = false,
  size = 'md',
  variant = 'light',
  layout = 'horizontal',
}) => {
  // Color configuration
  const primaryColor =
    variant === 'dark'
      ? '#16404D'
      : variant === 'gold'
      ? '#DDA853'
      : variant === 'light'
      ? '#FBF5DD'
      : '#16404D';

  const accentColor = variant === 'light' ? '#DDA853' : '#DDA853';

  // Sizing matrix
  const dimensions = {
    sm: { iconWidth: 32, iconHeight: 24, textSize: 'text-xs tracking-[0.22em]', space: 'gap-2' },
    md: { iconWidth: 44, iconHeight: 32, textSize: 'text-sm tracking-[0.24em]', space: 'gap-2.5' },
    lg: { iconWidth: 60, iconHeight: 44, textSize: 'text-lg tracking-[0.26em]', space: 'gap-3' },
    xl: { iconWidth: 80, iconHeight: 58, textSize: 'text-2xl tracking-[0.28em]', space: 'gap-4' },
    '2xl': { iconWidth: 120, iconHeight: 88, textSize: 'text-4xl tracking-[0.3em]', space: 'gap-5' },
  }[size];

  return (
    <div
      className={`inline-flex items-center ${
        layout === 'vertical' ? 'flex-col text-center' : ''
      } ${dimensions.space} ${className}`}
    >
      {/* PhilomathLab Geometric Owl Logo SVG */}
      <svg
        viewBox="0 0 240 180"
        width={dimensions.iconWidth}
        height={dimensions.iconHeight}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-200 hover:scale-105"
        aria-label="PhilomathLab Owl Logo"
      >
        <g stroke={primaryColor} strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" fill="none">
          {/* Left Wing Feathers (Angled geometric bars) */}
          <path d="M 76 42 L 50 16" />
          <path d="M 60 56 L 34 30" />

          {/* Right Wing Feathers (Angled geometric bars) */}
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

      {!iconOnly && (
        <div className="flex flex-col">
          <span
            className={`font-mono font-black uppercase leading-none ${dimensions.textSize}`}
            style={{ color: primaryColor }}
          >
            PHILOMATH<span style={{ color: accentColor }}>LAB</span>
          </span>
        </div>
      )}
    </div>
  );
};

