import React from 'react';

const statusConfig = {
  disponibil: { label: 'Disponibil', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  service: { label: 'Service', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
  indisponibil: { label: 'Indisponibil', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
  casat: { label: 'Casat', className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400' },
  activa: { label: 'Activa', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  finalizata: { label: 'Finalizata', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  suspendata: { label: 'Suspendata', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' },
  deschis: { label: 'Deschis', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
  inchis: { label: 'Inchis', className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400' },
};

export default function StatusBadge({ status, size = 'sm' }) {
  const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' };
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sizeClass} ${config.className}`}>
      {config.label}
    </span>
  );
}
