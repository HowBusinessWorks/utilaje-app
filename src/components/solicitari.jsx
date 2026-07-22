import React, { useState } from 'react';
import { api } from '../api';
import { useToast } from '../App';
import Modal from './Modal';
import Select from './Select';
import {
  IconHourglass, IconCheckCircle, IconXCircle, IconCalendar, IconWork,
  IconUser, IconUtilaj, IconCheck, IconClose,
} from './icons';

export const STATUS = {
  noua:      { label: 'In asteptare', cls: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300', Icon: IconHourglass },
  acceptata: { label: 'Acceptata',    cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300', Icon: IconCheckCircle },
  respinsa:  { label: 'Respinsa',     cls: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300', Icon: IconXCircle },
};

export function fmtDate(s) {
  if (!s) return '';
  const [y, m, d] = s.split('-');
  return `${d}.${m}.${y}`;
}
export function fmtInterval(a, b) {
  return `${fmtDate(a)} – ${fmtDate(b)}`;
}

export function StatusBadge({ status, className = '' }) {
  const s = STATUS[status] || STATUS.noua;
  const { Icon } = s;
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${s.cls} ${className}`}>
      <Icon size={13} weight="fill" /> {s.label}
    </span>
  );
}

// Detaliile unei solicitari — reutilizat in inbox, pe pagina Planificare si la sef.
export function SolicitareBody({ sol, showSolicitant = false, showDetails = true }) {
  const subs = sol.subcontractanti_nume || [];
  return (
    <div className="text-sm">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 font-semibold text-ink-900 dark:text-white">
          <span className="truncate">{sol.categorie_nume || 'Categorie'}</span>
        </div>
        <p className="flex items-center gap-1.5 text-ink-600 dark:text-ink-300">
          <IconCalendar size={14} className="shrink-0 text-ink-400" />
          {fmtInterval(sol.data_start, sol.data_sfarsit)}
        </p>
        {showSolicitant && sol.solicitant_nume && (
          <p className="flex items-center gap-1.5 text-ink-500">
            <IconUser size={14} className="shrink-0 text-ink-400" />
            <span className="truncate">Solicitat de {sol.solicitant_nume}</span>
          </p>
        )}
      </div>

      {/* Detalii — se plieaza lin la expandare/colapsare */}
      <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${showDetails ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <div className="space-y-1.5 pt-1.5">
            {sol.lucrare_nume && (
              <p className="flex items-center gap-1.5 text-ink-600 dark:text-ink-300">
                <IconWork size={14} className="shrink-0 text-ink-400" />
                <span className="truncate">{sol.lucrare_nume}</span>
              </p>
            )}
            {subs.length > 0 && (
              <p className="flex items-start gap-1.5 text-ink-600 dark:text-ink-300">
                <IconUser size={14} className="mt-0.5 shrink-0 text-ink-400" />
                <span>{subs.join(', ')}</span>
              </p>
            )}
            {sol.nota && (
              <p className="rounded-lg bg-ink-50 px-2.5 py-1.5 text-[13px] text-ink-600 dark:bg-ink-800/60 dark:text-ink-300">
                {sol.nota}
              </p>
            )}
            {sol.status === 'acceptata' && sol.utilaj_denumire && (
              <p className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                <IconUtilaj size={14} className="shrink-0" />
                <span className="truncate">Alocat: {sol.utilaj_denumire}</span>
              </p>
            )}
            {sol.status === 'respinsa' && sol.motiv_respingere && (
              <p className="rounded-lg bg-rose-50 px-2.5 py-1.5 text-[13px] text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                Motiv: {sol.motiv_respingere}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Butoane + modale de Accept / Respinge pentru admin.
export function SolicitareActions({ sol, onDone }) {
  const toast = useToast();
  const [acceptOpen, setAcceptOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [dispo, setDispo] = useState(null);
  const [loadingDispo, setLoadingDispo] = useState(false);
  const [utilajId, setUtilajId] = useState('');
  const [motiv, setMotiv] = useState('');
  const [busy, setBusy] = useState(false);

  const openAccept = async () => {
    setUtilajId('');
    setDispo(null);
    setAcceptOpen(true);
    setLoadingDispo(true);
    try {
      const d = await api.get(`/solicitari/disponibilitate?categorie_id=${sol.categorie_id}&data_start=${sol.data_start}&data_sfarsit=${sol.data_sfarsit}`);
      setDispo(d);
      const firstFree = d.utilaje.find(u => u.disponibil);
      if (firstFree) setUtilajId(String(firstFree.id));
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setLoadingDispo(false);
    }
  };

  const confirmAccept = async () => {
    if (!utilajId) { toast('Alege un utilaj', 'error'); return; }
    setBusy(true);
    try {
      await api.post(`/solicitari/${sol.id}/accept`, { utilaj_id: Number(utilajId) });
      toast('Solicitare acceptata — planificare creata');
      setAcceptOpen(false);
      onDone?.();
    } catch (e) { toast(e.message, 'error'); }
    finally { setBusy(false); }
  };

  const confirmReject = async () => {
    setBusy(true);
    try {
      await api.post(`/solicitari/${sol.id}/reject`, { motiv: motiv.trim() || null });
      toast('Solicitare respinsa');
      setRejectOpen(false);
      setMotiv('');
      onDone?.();
    } catch (e) { toast(e.message, 'error'); }
    finally { setBusy(false); }
  };

  return (
    <>
      <div className="flex gap-2">
        <button onClick={openAccept}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700">
          <IconCheck size={15} weight="bold" /> Accepta
        </button>
        <button onClick={() => setRejectOpen(true)}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:border-rose-500/30 dark:text-rose-400 dark:hover:bg-rose-500/10">
          <IconClose size={15} weight="bold" /> Respinge
        </button>
      </div>

      {/* Accept — alege utilaj concret */}
      <Modal isOpen={acceptOpen} onClose={() => setAcceptOpen(false)} title="Accepta solicitarea" size="sm">
        <div className="space-y-4">
          <div className="rounded-xl border border-ink-200/80 bg-ink-50/60 p-3 dark:border-ink-800 dark:bg-ink-950/40">
            <SolicitareBody sol={sol} showSolicitant />
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-ink-600 dark:text-ink-300">
              Aloca un utilaj din categorie
            </label>
            {loadingDispo ? (
              <div className="space-y-2">
                {[0, 1].map(i => <div key={i} className="h-10 animate-pulse rounded-lg bg-ink-100 dark:bg-ink-800" />)}
              </div>
            ) : !dispo || dispo.utilaje.length === 0 ? (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                Nu exista utilaje in aceasta categorie.
              </p>
            ) : (
              <div className="space-y-1.5">
                {dispo.utilaje.map(u => {
                  const sel = String(u.id) === String(utilajId);
                  return (
                    <button key={u.id} type="button"
                      disabled={!u.disponibil}
                      onClick={() => setUtilajId(String(u.id))}
                      className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                        !u.disponibil
                          ? 'cursor-not-allowed border-ink-200 bg-ink-50 opacity-60 dark:border-ink-800 dark:bg-ink-900'
                          : sel
                          ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/20 dark:border-brand-500 dark:bg-brand-500/10'
                          : 'border-ink-200 hover:border-ink-300 dark:border-ink-700 dark:hover:border-ink-600'
                      }`}>
                      <span className="min-w-0 truncate font-medium text-ink-900 dark:text-white">
                        {u.denumire}{u.alias ? ` · ${u.alias}` : ''}
                      </span>
                      {u.disponibil ? (
                        sel ? <IconCheck size={16} weight="bold" className="shrink-0 text-brand-600 dark:text-brand-400" />
                            : <span className="shrink-0 text-xs font-medium text-emerald-600 dark:text-emerald-400">liber</span>
                      ) : (
                        <span className="shrink-0 text-xs font-medium text-rose-500">ocupat</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={confirmAccept} disabled={busy || !utilajId}
              className="btn-primary flex-1 disabled:opacity-50">
              {busy ? 'Se creeaza…' : 'Accepta si planifica'}
            </button>
            <button onClick={() => setAcceptOpen(false)} className="btn-ghost flex-1">Anuleaza</button>
          </div>
        </div>
      </Modal>

      {/* Reject — motiv optional */}
      <Modal isOpen={rejectOpen} onClose={() => setRejectOpen(false)} title="Respinge solicitarea" size="sm">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-ink-600 dark:text-ink-300">
              Motiv <span className="font-normal text-ink-400">(optional, va fi vazut de sef)</span>
            </label>
            <textarea value={motiv} onChange={e => setMotiv(e.target.value)} rows={3}
              className="field resize-none" placeholder="ex: nu avem utilaje libere in acest interval" />
          </div>
          <div className="flex gap-3">
            <button onClick={confirmReject} disabled={busy}
              className="flex-1 rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-700 disabled:opacity-50">
              {busy ? 'Se trimite…' : 'Respinge solicitarea'}
            </button>
            <button onClick={() => setRejectOpen(false)} className="btn-ghost flex-1">Anuleaza</button>
          </div>
        </div>
      </Modal>
    </>
  );
}
