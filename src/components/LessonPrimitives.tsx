import React from 'react';
import { MathFormula } from './MathFormula';

// Shared layout pieces for long-form lesson pages.

export const Card: React.FC<{
  id?: string;
  eyebrow?: string;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}> = ({ id, eyebrow, title, icon, children }) => (
  <div
    id={id}
    className="scroll-mt-24 bg-cream-card border border-sage rounded-xl p-5 sm:p-6 space-y-3 shadow-xs"
  >
    {eyebrow && (
      <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-sage-dark">
        {eyebrow}
      </p>
    )}
    <h3 className="font-sans font-semibold text-lg text-deepteal flex items-center gap-2">
      {icon}
      <span>{title}</span>
    </h3>
    <div className="space-y-3 text-sm text-deepteal-soft leading-relaxed">{children}</div>
  </div>
);

/** Centred display equation on the page background. */
export const Eq: React.FC<{ latex: string; note?: string }> = ({ latex, note }) => (
  <div className="bg-cream border border-sage/60 rounded-lg py-3 px-4 text-center overflow-x-auto">
    <MathFormula latex={latex} block className="text-deepteal" />
    {note && <p className="font-mono text-[10px] text-deepteal-soft mt-1">{note}</p>}
  </div>
);

export const SymbolTable: React.FC<{
  rows: { symbol: string; meaning: string; unit?: string }[];
  unitHeader?: string;
}> = ({ rows, unitHeader = 'SI unit' }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-xs border-collapse min-w-[320px]">
      <thead>
        <tr className="border-b border-sage text-deepteal font-mono uppercase text-[10px] tracking-wider">
          <th className="text-left py-2 pr-4 font-bold">Symbol</th>
          <th className="text-left py-2 pr-4 font-bold">Meaning</th>
          {rows.some((r) => r.unit !== undefined) && (
            <th className="text-left py-2 font-bold">{unitHeader}</th>
          )}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.symbol} className="border-b border-sage/30">
            <td className="py-2 pr-4 align-top">
              <MathFormula latex={r.symbol} className="text-deepteal font-bold" />
            </td>
            <td className="py-2 pr-4 align-top text-deepteal-soft font-sans">{r.meaning}</td>
            {rows.some((x) => x.unit !== undefined) && (
              <td className="py-2 align-top font-mono text-[11px] text-deepteal-soft">
                {r.unit ?? '—'}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const Predict: React.FC<{ items: React.ReactNode[] }> = ({ items }) => (
  <div className="bg-cream border-l-2 border-gold rounded-r-lg p-3.5">
    <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-gold-hover mb-2">
      Predict before you run
    </p>
    <ol className="space-y-1.5 text-xs font-sans list-decimal list-inside text-deepteal-soft">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ol>
  </div>
);
