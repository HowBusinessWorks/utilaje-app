import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { useInbox } from '../inbox';
import { StatusBadge, SolicitareBody, SolicitareActions, fmtDate } from './solicitari';
import { ObservatieBody, ObservatieActions, ObservatieStatusBadge } from './observatii';
import { IconInbox, IconClose, IconCalendar, IconSpinner, IconObservatie } from './icons';
import useScrollLock from '../hooks/useScrollLock';

export default function Inbox() {
  const { user } = useAuth();
  const { items, observatii, unread, loading, refresh, markSeen } = useInbox();
  const isAdmin = user?.role === 'admin';
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState(null);
  const wrapRef = useRef(null);
  const btnRef = useRef(null);
  const panelRef = useRef(null);

  useScrollLock(open);

  const place = useCallback(() => {
    if (btnRef.current) setRect(btnRef.current.getBoundingClientRect());
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    place();
    const onScroll = () => place();
    const onResize = () => place();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    refresh();
    markSeen();
    const onDown = (e) => {
      if (wrapRef.current?.contains(e.target) || panelRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]); // eslint-disable-line

  // adminul vede intai cele noi; sefii vad totul cronologic
  const noi = isAdmin ? items.filter(s => s.status === 'noua') : [];
  const restul = isAdmin ? items.filter(s => s.status !== 'noua') : items;
  const obs = isAdmin ? (observatii || []) : [];
  const obsNoi = obs.filter(o => o.status === 'noua');
  const obsRest = obs.filter(o => o.status !== 'noua');
  const nimic = items.length === 0 && obs.length === 0;

  const openInPlanificare = (sol) => {
    setOpen(false);
    navigate('/planificare', { state: { solicitareId: sol.id } });
  };

  return (
    <div className="relative" ref={wrapRef}>
      <button
        ref={btnRef}
        onClick={() => setOpen(o => !o)}
        className="relative grid h-9 w-9 place-items-center rounded-lg border border-ink-200 text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-700 dark:border-ink-700 dark:text-ink-400 dark:hover:bg-ink-800 dark:hover:text-ink-200"
        title={isAdmin ? 'Notificari' : 'Solicitari'}
        aria-label={isAdmin ? 'Notificari' : 'Solicitari'}
      >
        <IconInbox size={18} weight={open ? 'fill' : 'regular'} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white dark:ring-ink-950">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && rect && createPortal(
        <div
          ref={panelRef}
          className="fixed z-[100] w-[calc(100vw-2rem)] max-w-[420px] overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-pop animate-pop-in dark:border-ink-700 dark:bg-ink-900"
          style={{
            top: rect.bottom + 10,
            left: Math.min(
              Math.max(16, rect.right - Math.min(420, window.innerWidth - 32)),
              window.innerWidth - 16 - Math.min(420, window.innerWidth - 32)
            ),
            touchAction: 'pan-y',
            overscrollBehavior: 'none',
          }}
        >
          <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3 dark:border-ink-800">
            <div>
              <p className="text-sm font-semibold text-ink-900 dark:text-white">{isAdmin ? 'Notificari' : 'Solicitari'}</p>
              <p className="text-[11px] text-ink-400">
                {isAdmin ? 'Cereri si observatii de la sefii de santier' : 'Cererile tale si raspunsurile lor'}
              </p>
            </div>
            <button onClick={() => setOpen(false)}
              className="grid h-7 w-7 place-items-center rounded-lg text-ink-400 hover:bg-ink-100 hover:text-ink-600 dark:hover:bg-ink-800"
              aria-label="Inchide">
              <IconClose size={16} />
            </button>
          </div>

          <div className="scroll-area max-h-[70vh] overflow-y-auto p-3">
            {loading && nimic ? (
              <div className="grid place-items-center py-10 text-ink-400">
                <IconSpinner size={22} className="animate-spin" />
              </div>
            ) : nimic ? (
              <div className="grid place-items-center gap-2 py-10 text-center">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-ink-100 text-ink-400 dark:bg-ink-800">
                  <IconInbox size={24} />
                </span>
                <p className="text-sm text-ink-500">
                  {isAdmin ? 'Nicio notificare deocamdata' : 'Nu ai trimis nicio solicitare'}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {isAdmin && (noi.length > 0 || restul.length > 0) && (
                  <div className="px-1 text-[11px] font-semibold uppercase tracking-wide text-ink-400">Solicitari</div>
                )}
                {noi.map(sol => (
                  <div key={sol.id} className="rounded-xl border border-amber-200 bg-amber-50/40 p-3 dark:border-amber-500/30 dark:bg-amber-500/5">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <StatusBadge status={sol.status} />
                      <span className="text-[11px] text-ink-400">{fmtDate((sol.created_at || '').slice(0, 10))}</span>
                    </div>
                    <SolicitareBody sol={sol} showSolicitant />
                    <div className="mt-3 space-y-2">
                      <SolicitareActions sol={sol} onDone={refresh} />
                      <button onClick={() => openInPlanificare(sol)}
                        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-brand-200 py-1.5 text-sm font-medium text-brand-600 transition-colors hover:bg-brand-50 dark:border-brand-500/30 dark:text-brand-400 dark:hover:bg-brand-500/10">
                        <IconCalendar size={15} /> Vezi in planificare
                      </button>
                    </div>
                  </div>
                ))}

                {noi.length > 0 && restul.length > 0 && (
                  <div className="px-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-ink-400">Istoric</div>
                )}

                {restul.map(sol => (
                  <div key={sol.id} className="rounded-xl border border-ink-200/70 p-3 dark:border-ink-800">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <StatusBadge status={sol.status} />
                      <span className="text-[11px] text-ink-400">{fmtDate((sol.created_at || '').slice(0, 10))}</span>
                    </div>
                    <SolicitareBody sol={sol} showSolicitant={isAdmin} />
                  </div>
                ))}

                {isAdmin && obs.length > 0 && (
                  <div className="flex items-center gap-1.5 px-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                    <IconObservatie size={13} /> Observatii
                  </div>
                )}

                {obsNoi.map(o => (
                  <div key={'o' + o.id} className="rounded-xl border border-amber-200 bg-amber-50/40 p-3 dark:border-amber-500/30 dark:bg-amber-500/5">
                    <div className="mb-2">
                      <ObservatieStatusBadge status={o.status} />
                    </div>
                    <ObservatieBody obs={o} showSef />
                    <div className="mt-3">
                      <ObservatieActions obs={o} onDone={refresh} onBeforeNavigate={() => setOpen(false)} />
                    </div>
                  </div>
                ))}

                {obsRest.map(o => (
                  <div key={'o' + o.id} className="rounded-xl border border-ink-200/70 p-3 dark:border-ink-800">
                    <div className="mb-2">
                      <ObservatieStatusBadge status={o.status} />
                    </div>
                    <ObservatieBody obs={o} showSef />
                    {o.status !== 'rezolvata' && (
                      <div className="mt-3">
                        <ObservatieActions obs={o} onDone={refresh} onBeforeNavigate={() => setOpen(false)} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
