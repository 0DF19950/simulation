import React, { useEffect, useRef } from 'react';
import katex from 'katex';

interface MathFormulaProps {
  latex: string;
  block?: boolean;
  className?: string;
}

export const MathFormula: React.FC<MathFormulaProps> = ({ latex, block = false, className = '' }) => {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      try {
        katex.render(latex, containerRef.current, {
          displayMode: block,
          throwOnError: false,
          output: 'html',
        });
      } catch (err) {
        if (containerRef.current) {
          containerRef.current.textContent = latex;
        }
      }
    }
  }, [latex, block]);

  return <span ref={containerRef} className={`inline-block ${className}`} />;
};

interface MathTextProps {
  text: string;
  className?: string;
}

export const MathText: React.FC<MathTextProps> = ({ text, className = '' }) => {
  if (!text) return null;

  const parts = text.split('$');

  if (parts.length === 1) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (index % 2 === 0) {
          return <React.Fragment key={index}>{part}</React.Fragment>;
        }
        return <MathFormula key={index} latex={part} block={false} className="mx-1 text-deepteal font-bold" />;
      })}
    </span>
  );
};

