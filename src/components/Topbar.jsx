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

export default function Topbar({ darkMode, setDarkMode, onMenuClick }) {
  const location = useLocation();
  const path = '/' + location.pathname.split('/')[1];
  const title = pageTitles[path] || 'FleetOps';

  return (
    <header className="h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 lg:px-6 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shrink-0"
          aria-label="Deschide meniu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
        <h2 className="text-base lg:text-lg font-semibold text-gray-900 dark:text-white truncate">{title}</h2>
      </div>
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shrink-0"
        title={darkMode ? 'Mod luminos' : 'Mod intunecat'}
      >
        {darkMode ? '☀️' : '🌙'}
      </button>
    </header>
  );
}
