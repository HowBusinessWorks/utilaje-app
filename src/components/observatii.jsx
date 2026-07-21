import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useToast } from '../App';
import Modal from './Modal';
import {
  IconUtilaj, IconCalendar, IconWork, IconUser,
  IconEye, IconMessage, IconWrench, IconHourglass, IconCheckCircle,
} from './icons';

// Tipurile de observatie pe care le poate raporta seful de santier.
export const TIPURI = [
  { value: 'defectiune',  label: 'Defectiune',           tone: 'red' },
  { value: 'avarie',      label: 'Avarie / accident',    tone: 'red' },
  { value: 'intretinere', label: 'Necesita intretinere', tone: 'amber' },
  { value: 'combustibil', label: 'Problema combustibil', tone: 'orange' },
  { value: 'alta',        label: 'Alta observatie',      tone: 'blue' },
];
export const TIP_MAP = Object.fromEntries(TIPURI.map(t => [t.value, t]));

const toneCls = {
  red:    'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/20',
  amber:  'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/20',
  orange: 'bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-500/10 dark:text-orange-300 dark:ring-orange-400/20',
  blue:   'bg-brand-50 text-brand-700 ring-brand-600/20 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-400/20',
};

export function TipBadge({ tip }) {
  const cfg = TIP_MAP[tip];
  if (!cfg) return null;
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${toneCls[cfg.tone]}`}>
      {cfg.label}
    </span>
  );
}

const STATUS = {
  noua:      { label: 'Noua',            cls: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300', Icon: IconHourglass },
  vazuta:    { label: 'Vazuta de birou', cls: 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300', Icon: IconEye },
  rezolvata: { label: 'Rezolvata',       cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300', Icon: IconCheckCircle },
};

export function ObservatieStatusBadge({ status }) {
  const s = STATUS[status] || STATUS.noua;
  const { Icon } = s;
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${s.cls}`}>
      <Icon size={13} weight="fill" /> {s.label}
    </span>
  );
}

export function fmtDateTime(d) {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  const p = (n) => String(n).padStart(2, '0');
  return `${p(dt.getDate())}.${p(dt.getMonth() + 1)}.${dt.getFullYear()}, ${p(dt.getHours())}:${p(dt.getMinutes())}`;
}

// Detaliile unei observatii — reutilizat in inbox si pe pagina de admin.
export function ObservatieBody({ obs, showSef = false }) {
  return (
    <div className="space-y-1.5 text-sm">
      <div className="flex items-center gap-2">
        <IconUtilaj size={15} className="shrink-0 text-ink-400" />
        <span className="min-w-0 truncate font-medium text-ink-900 dark:text-white">{obs.utilaj_denumire}</span>
        <TipBadge tip={obs.tip} />
      </div>
      <p className="flex items-center gap-1.5 text-ink-500">
        <IconCalendar size={14} className="shrink-0 text-ink-400" />
        {fmtDateTime(obs.created_at)}
        {obs.pv_status === 'inchis' && <span className="text-ink-400">· PV inchis</span>}
      </p>
      {obs.lucrare_nume && (
        <p className="flex items-center gap-1.5 text-ink-600 dark:text-ink-300">
          <IconWork size={14} className="shrink-0 text-ink-400" />
          <span className="truncate">{obs.lucrare_nume}</span>
        </p>
      )}
      {showSef && obs.persoana_nume && (
        <p className="flex items-center gap-1.5 text-ink-500">
          <IconUser size={14} className="shrink-0 text-ink-400" />
          <span className="truncate">De la {obs.persoana_nume}</span>
        </p>
      )}
      <p className="whitespace-pre-line rounded-lg bg-ink-50 px-2.5 py-1.5 text-[13px] text-ink-700 dark:bg-ink-800/60 dark:text-ink-200">
        {obs.mesaj}
      </p>
      {obs.raspuns_admin && (
        <p className="whitespace-pre-line rounded-lg bg-brand-50 px-2.5 py-1.5 text-[13px] text-brand-700 dark:bg-brand-500/10 dark:text-brand-200">
          <span className="mb-0.5 flex items-center gap-1 font-medium"><IconMessage size={13} weight="fill" /> Raspuns birou</span>
          {obs.raspuns_admin}
        </p>
      )}
      {obs.status === 'rezolvata' && obs.reparatie_id && (
        <p className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
          <IconWrench size={14} className="shrink-0" />
          <span>Transformata in reparatie (#{obs.reparatie_id})</span>
        </p>
      )}
    </div>
  );
}

// Butoane admin: marcheaza vazut, trimite mesaj, transforma in reparatie.
export function ObservatieActions({ obs, onDone, onBeforeNavigate }) {
  const toast = useToast();
  const navigate = useNavigate();
  const [msgOpen, setMsgOpen] = useState(false);
  const [mesaj, setMesaj] = useState(obs.raspuns_admin || '');
  const [busy, setBusy] = useState(false);

  const markVazut = async () => {
    setBusy(true);
    try {
      await api.post(`/observatii/${obs.id}/vazut`);
      toast('Marcata ca vazuta');
      onDone?.();
    } catch (e) { toast(e.message, 'error'); }
    finally { setBusy(false); }
  };

  const sendMesaj = async () => {
    if (!mesaj.trim()) { toast('Scrie un mesaj', 'error'); return; }
    setBusy(true);
    try {
      await api.post(`/observatii/${obs.id}/raspuns`, { mesaj: mesaj.trim() });
      toast('Mesaj trimis catre seful de santier');
      setMsgOpen(false);
      onDone?.();
    } catch (e) { toast(e.message, 'error'); }
    finally { setBusy(false); }
  };

  const convertToReparatie = () => {
    onBeforeNavigate?.();
    navigate('/reparatii', {
      state: {
        observatie: {
          id: obs.id,
          utilaj_id: obs.utilaj_id,
          utilaj_denumire: obs.utilaj_denumire,
          mesaj: obs.mesaj,
        },
      },
    });
  };

  const rezolvata = obs.status === 'rezolvata';

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {obs.status === 'noua' && (
          <button onClick={markVazut} disabled={busy}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-ink-200 px-3 py-1.5 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-50 disabled:opacity-50 dark:border-ink-700 dark:text-ink-200 dark:hover:bg-ink-800">
            <IconEye size={15} weight="bold" /> Vazut
          </button>
        )}
        <button onClick={() => { setMesaj(obs.raspuns_admin || ''); setMsgOpen(true); }}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-brand-200 px-3 py-1.5 text-sm font-medium text-brand-600 transition-colors hover:bg-brand-50 dark:border-brand-500/30 dark:text-brand-400 dark:hover:bg-brand-500/10">
          <IconMessage size={15} weight="bold" /> Mesaj
        </button>
        {!rezolvata && (
          <button onClick={convertToReparatie}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:border-rose-500/30 dark:text-rose-400 dark:hover:bg-rose-500/10">
            <IconWrench size={15} weight="bold" /> Reparatie
          </button>
        )}
      </div>

      <Modal isOpen={msgOpen} onClose={() => setMsgOpen(false)} title="Mesaj catre seful de santier" size="sm">
        <div className="space-y-4">
          <div className="rounded-xl border border-ink-200/80 bg-ink-50/60 p-3 dark:border-ink-800 dark:bg-ink-950/40">
            <ObservatieBody obs={obs} showSef />
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-ink-600 dark:text-ink-300">
              Mesaj <span className="font-normal text-ink-400">(va fi vazut de sef pe pagina lui de observatii)</span>
            </label>
            <textarea value={mesaj} onChange={e => setMesaj(e.target.value)} rows={4}
              className="field resize-none" placeholder="ex: opreste utilajul si asteapta echipa de service" />
          </div>
          <div className="flex gap-3">
            <button onClick={sendMesaj} disabled={busy || !mesaj.trim()} className="btn-primary flex-1 disabled:opacity-50">
              {busy ? 'Se trimite…' : 'Trimite mesaj'}
            </button>
            <button onClick={() => setMsgOpen(false)} className="btn-ghost flex-1">Anuleaza</button>
          </div>
        </div>
      </Modal>
    </>
  );
}
