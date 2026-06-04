import React from 'react';
import { NavLink } from 'react-router-dom';

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

export default function Sidebar() {
  return (
    <aside className="w-60 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col shrink-0">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🚛</span>
          <div>
            <h1 className="font-bold text-lg text-gray-900 dark:text-white">FleetOps</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Gestiune Utilaje</p>
          </div>
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
        <p className="text-xs text-gray-400 dark:text-gray-500">FleetOps v1.0 · Local</p>
      </div>
    </aside>
  );
}
