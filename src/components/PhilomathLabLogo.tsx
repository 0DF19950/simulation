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
      <img src="/logo1.png" width={dimensions.iconWidth} height={dimensions.iconHeight} alt="Philomathlab logo" className="shrink-0" />

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

