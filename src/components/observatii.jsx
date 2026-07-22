import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useToast } from '../App';
import Modal from './Modal';
import {
  IconUtilaj, IconCalendar, IconWork, IconUser,
  IconEye, IconMessage, IconWrench, IconHourglass, IconCheckCircle,
  IconCamera, IconImage, IconClose, IconSpinner,
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

export const MAX_POZE = 5;

// Redimensioneaza/comprima o poza in browser inainte de a o trimite ca base64,
// ca sa nu incarcam fotografii de cativa MB facute direct din camera telefonului.
function compressImage(file, maxSize = 1280, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxSize || height > maxSize) {
        const scale = maxSize / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Fisier invalid.')); };
    img.src = url;
  });
}

// Selector de poze pentru formularul de observatie noua: camera sau galerie,
// cu previzualizare si eliminare inainte de trimitere. `value` e o lista de data URL-uri.
export function PozePicker({ value, onChange }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;
    const slots = MAX_POZE - value.length;
    if (slots <= 0) { toast(`Poti atasa cel mult ${MAX_POZE} poze.`, 'error'); return; }
    setBusy(true);
    try {
      const compressed = await Promise.all(files.slice(0, slots).map(f => compressImage(f)));
      onChange([...value, ...compressed]);
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const remove = (idx) => onChange(value.filter((_, i) => i !== idx));

  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-medium text-ink-600 dark:text-ink-300">
        Poze <span className="font-normal text-ink-400">(optional, max {MAX_POZE})</span>
      </label>

      {value.length > 0 && (
        <div className="mb-2.5 grid grid-cols-4 gap-2">
          {value.map((src, idx) => (
            <div key={idx} className="group relative aspect-square overflow-hidden rounded-lg border border-ink-200 dark:border-ink-700">
              <img src={src} alt="" className="h-full w-full object-cover" />
              <button type="button" onClick={() => remove(idx)}
                className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-ink-950/70 text-white">
                <IconClose size={12} weight="bold" />
              </button>
            </div>
          ))}
        </div>
      )}

      {value.length < MAX_POZE && (
        <div className="flex gap-2">
          <button type="button" disabled={busy} onClick={() => cameraRef.current?.click()}
            className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg border border-ink-200 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-50 disabled:opacity-50 dark:border-ink-700 dark:text-ink-200 dark:hover:bg-ink-800">
            {busy ? <IconSpinner size={15} className="animate-spin" /> : <IconCamera size={15} weight="bold" />} Camera
          </button>
          <button type="button" disabled={busy} onClick={() => galleryRef.current?.click()}
            className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg border border-ink-200 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-50 disabled:opacity-50 dark:border-ink-700 dark:text-ink-200 dark:hover:bg-ink-800">
            {busy ? <IconSpinner size={15} className="animate-spin" /> : <IconImage size={15} weight="bold" />} Galerie
          </button>
        </div>
      )}

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={e => { handleFiles(e.target.files); e.target.value = ''; }} />
      <input ref={galleryRef} type="file" accept="image/*" multiple className="hidden"
        onChange={e => { handleFiles(e.target.files); e.target.value = ''; }} />
    </div>
  );
}

// Iconul din dreapta cardului unei observatii cu poze atasate. La click deschide
// un popup cu galeria (incarcata la cerere), iar din galerie se poate mari fiecare poza.
export function PozeIndicator({ observatieId, count, className = '' }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [poze, setPoze] = useState(null);
  const [loading, setLoading] = useState(false);
  const [zoomed, setZoomed] = useState(null);

  if (!count) return null;

  const openModal = (e) => {
    e.stopPropagation();
    setOpen(true);
    if (poze === null) {
      setLoading(true);
      api.get(`/observatii/${observatieId}/poze`)
        .then(setPoze)
        .catch(err => toast('Eroare la incarcarea pozelor: ' + err.message, 'error'))
        .finally(() => setLoading(false));
    }
  };

  return (
    <>
      <button type="button" onClick={openModal}
        className={`ml-auto flex shrink-0 items-center gap-1 rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-medium text-ink-600 transition-colors hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300 dark:hover:bg-ink-700 ${className}`}
        title="Vezi pozele atasate">
        <IconImage size={12} weight="fill" /> {count}
      </button>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Poze atasate" size="lg">
        {loading ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {Array.from({ length: Math.min(count, 4) }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-lg bg-ink-100 dark:bg-ink-800" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {(poze || []).map(p => (
              <button key={p.id} type="button" onClick={() => setZoomed(p)}
                className="aspect-square overflow-hidden rounded-lg border border-ink-200 dark:border-ink-700">
                <img src={`data:${p.mime_type};base64,${p.data_base64}`} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </Modal>

      {zoomed && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-ink-950/80 p-4" onClick={() => setZoomed(null)}>
          <img src={`data:${zoomed.mime_type};base64,${zoomed.data_base64}`} alt=""
            className="max-h-full max-w-full rounded-lg object-contain" />
          <button type="button" onClick={() => setZoomed(null)}
            className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20">
            <IconClose size={18} weight="bold" />
          </button>
        </div>
      )}
    </>
  );
}

// Detaliile unei observatii — reutilizat in inbox si pe pagina de admin.
export function ObservatieBody({ obs, showSef = false }) {
  return (
    <div className="space-y-1.5 text-sm">
      <div className="flex items-center gap-2">
        <IconUtilaj size={15} className="shrink-0 text-ink-400" />
        <span className="min-w-0 truncate font-medium text-ink-900 dark:text-white">{obs.utilaj_denumire}</span>
        <TipBadge tip={obs.tip} />
        <PozeIndicator observatieId={obs.id} count={obs.poze_count} />
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
