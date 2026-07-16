import React, { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { api } from '../api';
import {
  IconDashboard, IconUtilaj, IconFuel, IconRepair, IconCalendar,
  IconClipboard, IconWork, IconMap, IconPeople, IconReports, IconClose, IconCheck,
  IconRefresh,
} from './icons';

const navGroups = [
  {
    label: null,
    items: [
      { to: '/dashboard', label: 'Dashboard', Icon: IconDashboard },
    ],
  },
  {
    label: 'Utilaje',
    items: [
      { to: '/utilaje', label: 'Utilaje', Icon: IconUtilaj },
      { to: '/motorina', label: 'Motorina', Icon: IconFuel },
      { to: '/reparatii', label: 'Reparatii', Icon: IconRepair },
      { to: '/planificare', label: 'Planificari', Icon: IconCalendar },
      { to: '/procese-verbale', label: 'Procese verbale', Icon: IconClipboard },
    ],
  },
  {
    label: 'Operatiuni',
    items: [
      { to: '/lucrari', label: 'Lucrari', Icon: IconWork },
      { to: '/harta', label: 'Harta', Icon: IconMap },
    ],
  },
  {
    label: 'Resurse',
    items: [
      { to: '/persoane', label: 'Persoane', Icon: IconPeople },
      { to: '/rapoarte', label: 'Rapoarte', Icon: IconReports },
    ],
  },
];

function PretMotorina() {
  const today = new Date().toISOString().slice(0, 10);
  const [pret, setPret] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fromApi, setFromApi] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFromApi = () => api.get('/preturi-motorina/extern')
    .then(ext => {
      if (ext?.pret_per_litru == null) return null;
      setPret(String(ext.pret_per_litru));
      setFromApi(true);
      setSaved(false);
      return ext.pret_per_litru;
    })
    .catch(() => null);

  useEffect(() => {
    let cancelled = false;
    api.get('/preturi-motorina/today')
      .then(d => {
        if (cancelled) return;
        if (d?.pret_per_litru != null) {
          setPret(String(d.pret_per_litru));
          setFromApi(false);
        } else {
          return fetchFromApi();
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const handleSave = async () => {
    if (!pret || isNaN(Number(pret))) return;
    setSaving(true);
    try {
      await api.post('/preturi-motorina', { data: today, pret_per_litru: Number(pret) });
      setSaved(true);
      setFromApi(false);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { /* silent */ }
    setSaving(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    const val = await fetchFromApi();
    if (val != null) {
      try {
        await api.post('/preturi-motorina', { data: today, pret_per_litru: Number(val) });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (e) { /* silent */ }
    }
    setRefreshing(false);
  };

  return (
    <div className="rounded-xl border border-ink-200/80 bg-ink-50/60 p-3 dark:border-ink-800 dark:bg-ink-950/40">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-ink-400">
          Pret motorina azi{fromApi && <span className="normal-case text-brand-500"> · din API</span>}
        </p>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          title="Actualizeaza pretul din API"
          aria-label="Actualizeaza pretul din API"
          className="shrink-0 rounded-md p-0.5 text-ink-400 transition-colors hover:bg-ink-200/60 hover:text-ink-700 disabled:opacity-50 dark:hover:bg-ink-800 dark:hover:text-ink-100"
        >
          <IconRefresh size={13} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="flex flex-1 items-center rounded-lg border border-ink-200 bg-white px-2 focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/15 dark:border-ink-700 dark:bg-ink-900">
          <input
            type="number" step="0.01" min="0" value={pret}
            onChange={e => { setPret(e.target.value); setSaved(false); setFromApi(false); }}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            placeholder="0.00"
            className="w-full min-w-0 bg-transparent py-1.5 text-sm tabular text-ink-900 outline-none dark:text-ink-50"
          />
          <span className="shrink-0 text-[11px] text-ink-400">RON/L</span>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
            saved
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
              : 'bg-brand-600 text-white hover:bg-brand-700'
          }`}
        >
          {saved ? <IconCheck size={15} weight="bold" /> : saving ? '…' : 'Salveaza'}
        </button>
      </div>
    </div>
  );
}

export default function Sidebar({ open, onClose }) {
  return (
    <aside
      className="fixed inset-y-0 left-0 z-30 flex w-[260px] -translate-x-full flex-col border-r border-ink-200/80 bg-white transition-transform duration-200 dark:border-ink-800 dark:bg-ink-950 lg:relative lg:inset-auto lg:w-[260px] lg:translate-x-0 lg:shrink-0"
      style={open ? { transform: 'translateX(0)' } : undefined}
    >
      <div className="flex items-start justify-between gap-2 px-5 pb-4 pt-5">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white shadow-sm">
            <IconUtilaj size={20} weight="fill" />
          </div>
          <div className="leading-tight">
            <h1 className="text-[15px] font-semibold text-ink-900 dark:text-white">Gestiune</h1>
            <p className="text-[11px] font-medium text-ink-400">Utilaje &amp; teren</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-600 dark:hover:bg-ink-800 lg:hidden"
          aria-label="Inchide meniu"
        >
          <IconClose size={18} />
        </button>
      </div>

      <div className="px-3 pb-3">
        <PretMotorina />
      </div>

      <nav className="scroll-area flex-1 space-y-5 overflow-y-auto px-3 py-2">
        {navGroups.map((group, gi) => (
          <div key={gi}>
            {group.label && (
              <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map(({ to, label, Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/12 dark:text-brand-300'
                        : 'text-ink-500 hover:bg-ink-100 hover:text-ink-800 dark:text-ink-400 dark:hover:bg-ink-800/60 dark:hover:text-ink-100'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand-600" />}
                      <Icon size={19} weight={isActive ? 'fill' : 'regular'} className="shrink-0" />
                      <span>{label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-ink-200/70 px-5 py-3.5 dark:border-ink-800">
        <p className="text-[11px] text-ink-400">Gestiune Utilaje · v1.0</p>
      </div>
    </aside>
  );
}
