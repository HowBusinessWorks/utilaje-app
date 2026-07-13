import React from 'react';

// Tone-based badges with a leading dot. One muted surface per semantic tone.
const tones = {
  green:  'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/20',
  amber:  'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/20',
  red:    'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/20',
  blue:   'bg-brand-50 text-brand-700 ring-brand-600/20 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-400/20',
  orange: 'bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-500/10 dark:text-orange-300 dark:ring-orange-400/20',
  gray:   'bg-ink-100 text-ink-600 ring-ink-500/15 dark:bg-ink-800 dark:text-ink-300 dark:ring-ink-500/20',
};
const dotColor = {
  green: 'bg-emerald-500', amber: 'bg-amber-500', red: 'bg-rose-500',
  blue: 'bg-brand-500', orange: 'bg-orange-500', gray: 'bg-ink-400',
};

const statusConfig = {
  disponibil:  { label: 'Disponibil', tone: 'green' },
  service:     { label: 'Service', tone: 'amber' },
  indisponibil:{ label: 'Indisponibil', tone: 'red' },
  casat:       { label: 'Casat', tone: 'gray' },
  activa:      { label: 'Activa', tone: 'green' },
  finalizata:  { label: 'Finalizata', tone: 'blue' },
  suspendata:  { label: 'Suspendata', tone: 'orange' },
  deschis:     { label: 'Deschis', tone: 'amber' },
  inchis:      { label: 'Inchis', tone: 'gray' },
};

export default function StatusBadge({ status, size = 'sm' }) {
  const config = statusConfig[status] || { label: status, tone: 'gray' };
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ring-1 ring-inset ${sizeClass} ${tones[config.tone]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor[config.tone]}`} />
      {config.label}
    </span>
  );
}
