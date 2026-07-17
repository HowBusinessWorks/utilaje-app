import React, { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth';
import { adminNav, sefNav } from '../nav';
import { IconLogout, IconSun, IconMoon, IconClose } from './icons';

// Navigatie mobila stil aplicatie (bara jos), inlocuieste sidebar-ul pe telefon.
export default function BottomNav({ darkMode, setDarkMode }) {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';
  const navGroups = isAdmin ? adminNav : sefNav;
  const items = navGroups.flatMap(g => g.items);
  const [accountOpen, setAccountOpen] = useState(false);
  const sheetRef = useRef(null);

  useEffect(() => {
    if (!accountOpen) return;
    const onDown = (e) => { if (sheetRef.current && !sheetRef.current.contains(e.target)) setAccountOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [accountOpen]);

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-ink-200/80 bg-white/95 backdrop-blur-md dark:border-ink-800 dark:bg-ink-950/95 lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="scroll-area flex w-full items-stretch overflow-x-auto">
          {items.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex min-w-[64px] flex-1 flex-col items-center justify-center gap-1 px-2 py-2 text-[11px] font-medium transition-colors ${
                  isActive ? 'text-brand-600 dark:text-brand-400' : 'text-ink-400 hover:text-ink-600 dark:hover:text-ink-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={22} weight={isActive ? 'fill' : 'regular'} />
                  <span className="truncate">{label}</span>
                </>
              )}
            </NavLink>
          ))}
          <button
            onClick={() => setAccountOpen(true)}
            className="flex min-w-[64px] flex-1 flex-col items-center justify-center gap-1 px-2 py-2 text-[11px] font-medium text-ink-400 transition-colors hover:text-ink-600 dark:hover:text-ink-200"
          >
            <span className="grid h-[22px] w-[22px] place-items-center rounded-full bg-brand-50 text-[11px] font-semibold text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
              {(user?.nume || '?').charAt(0).toUpperCase()}
            </span>
            <span>Cont</span>
          </button>
        </div>
      </nav>

      {accountOpen && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink-950/40 backdrop-blur-sm lg:hidden">
          <div ref={sheetRef} className="w-full rounded-t-2xl bg-white p-4 shadow-pop animate-sheet-up dark:bg-ink-900"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-50 text-sm font-semibold text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                  {(user?.nume || '?').charAt(0).toUpperCase()}
                </div>
                <div className="leading-tight">
                  <p className="text-[14px] font-medium text-ink-900 dark:text-white">{user?.nume}</p>
                  <p className="text-[12px] text-ink-400">{isAdmin ? 'Administrator' : 'Sef santier'}</p>
                </div>
              </div>
              <button onClick={() => setAccountOpen(false)} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800" aria-label="Inchide">
                <IconClose size={18} />
              </button>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="mb-2 flex w-full items-center gap-3 rounded-xl border border-ink-200 px-3 py-2.5 text-sm font-medium text-ink-700 dark:border-ink-700 dark:text-ink-200"
            >
              {darkMode ? <IconSun size={18} weight="fill" /> : <IconMoon size={18} />}
              {darkMode ? 'Mod luminos' : 'Mod intunecat'}
            </button>
            <button
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-xl border border-rose-200 px-3 py-2.5 text-sm font-medium text-rose-600 dark:border-rose-500/30 dark:text-rose-400"
            >
              <IconLogout size={18} /> Deconectare
            </button>
          </div>
        </div>
      )}
    </>
  );
}
