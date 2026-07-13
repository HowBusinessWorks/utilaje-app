import React from 'react';
import { useLocation } from 'react-router-dom';
import { IconMenu, IconSun, IconMoon } from './icons';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/utilaje': 'Utilaje',
  '/planificare': 'Planificare',
  '/harta': 'Harta',
  '/motorina': 'Motorina',
  '/procese-verbale': 'Procese verbale',
  '/reparatii': 'Reparatii',
  '/lucrari': 'Lucrari & locatii',
  '/persoane': 'Persoane',
  '/rapoarte': 'Rapoarte',
};

export default function Topbar({ darkMode, setDarkMode, onMenuClick }) {
  const location = useLocation();
  const path = '/' + location.pathname.split('/')[1];
  const title = pageTitles[path] || 'Gestiune Utilaje';

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b border-ink-200/80 bg-white/80 px-4 backdrop-blur-md dark:border-ink-800 dark:bg-ink-950/80 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-ink-500 transition-colors hover:bg-ink-100 dark:text-ink-400 dark:hover:bg-ink-800 lg:hidden"
          aria-label="Deschide meniu"
        >
          <IconMenu size={20} />
        </button>
        <h2 className="truncate text-lg font-semibold tracking-tight text-ink-900 dark:text-white">{title}</h2>
      </div>
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="grid h-9 w-9 place-items-center rounded-lg border border-ink-200 text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-700 dark:border-ink-700 dark:text-ink-400 dark:hover:bg-ink-800 dark:hover:text-ink-200"
        title={darkMode ? 'Mod luminos' : 'Mod intunecat'}
        aria-label={darkMode ? 'Mod luminos' : 'Mod intunecat'}
      >
        {darkMode ? <IconSun size={18} weight="fill" /> : <IconMoon size={18} />}
      </button>
    </header>
  );
}
