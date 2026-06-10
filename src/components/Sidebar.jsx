import React, { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { api } from '../api';

const navGroups = [
  {
    label: null,
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: '📊' },
    ],
  },
  {
    label: 'Utilaje',
    items: [
      { to: '/utilaje', label: 'Utilaje', icon: '🚜' },
      { to: '/motorina', label: 'Motorina', icon: '⛽' },
      { to: '/reparatii', label: 'Reparatii', icon: '🔧' },
      { to: '/planificare', label: 'Planificari', icon: '📅' },
      { to: '/procese-verbale', label: 'Procese Verbale', icon: '📋' },
    ],
  },
  {
    label: 'Operatiuni',
    items: [
      { to: '/lucrari', label: 'Lucrari', icon: '🏗️' },
      { to: '/harta', label: 'Harta', icon: '🗺️' },
    ],
  },
  {
    label: 'Resurse',
    items: [
      { to: '/persoane', label: 'Persoane', icon: '👥' },
      { to: '/rapoarte', label: 'Rapoarte', icon: '📈' },
    ],
  },
];

function PretMotorina() {
  const today = new Date().toISOString().slice(0, 10);
  const [pret, setPret] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    api.get('/preturi-motorina/today')
      .then(d => { if (d?.pret_per_litru) setPret(String(d.pret_per_litru)); })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    if (!pret || isNaN(Number(pret))) return;
    setSaving(true);
    try {
      await api.post('/preturi-motorina', { data: today, pret_per_litru: Number(pret) });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { /* silent */ }
    setSaving(false);
  };

  return (
    <div className="mt-2">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Pret motorina azi</p>
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          type="number"
          step="0.01"
          min="0"
          value={pret}
          onChange={e => { setPret(e.target.value); setSaved(false); }}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          placeholder="0.00"
          className="w-full min-w-0 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs bg-white dark:bg-gray-700 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
        />
        <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">RON/L</span>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`shrink-0 px-2 py-1 rounded text-xs font-medium transition-colors ${
            saved
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {saved ? '✓' : saving ? '…' : 'Salv'}
        </button>
      </div>
    </div>
  );
}

export default function Sidebar({ open, onClose }) {
  return (
    <aside
      className="-translate-x-full fixed inset-y-0 left-0 z-30 flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-transform duration-200 lg:relative lg:inset-auto lg:translate-x-0 lg:w-60 lg:shrink-0"
      style={open ? { transform: 'translateX(0)' } : undefined}
    >
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-base text-gray-900 dark:text-white">Gestiune Utilaje</h1>
            <PretMotorina />
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 shrink-0 mt-0.5"
            aria-label="Inchide meniu"
          >
            ✕
          </button>
        </div>
      </div>
      <nav className="flex-1 p-3 overflow-y-auto space-y-4">
        {navGroups.map((group, gi) => (
          <div key={gi}>
            {group.label && (
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-3 mb-1">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`
                  }
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-400 dark:text-gray-500">Gestiune Utilaje v1.0</p>
      </div>
    </aside>
  );
}
