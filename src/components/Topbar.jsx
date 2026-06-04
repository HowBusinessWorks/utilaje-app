import React from 'react';
import { useLocation } from 'react-router-dom';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/utilaje': 'Utilaje',
  '/planificare': 'Planificare',
  '/harta': 'Harta',
  '/motorina': 'Motorina',
  '/procese-verbale': 'Procese Verbale',
  '/reparatii': 'Reparatii',
  '/lucrari': 'Lucrari & Locatii',
  '/persoane': 'Persoane',
  '/rapoarte': 'Rapoarte',
};

export default function Topbar({ darkMode, setDarkMode }) {
  const location = useLocation();
  const path = '/' + location.pathname.split('/')[1];
  const title = pageTitles[path] || 'FleetOps';

  return (
    <header className="h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 shrink-0">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        title={darkMode ? 'Mod luminos' : 'Mod intunecat'}
      >
        {darkMode ? '☀️' : '🌙'}
      </button>
    </header>
  );
}
