import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { useToast } from '../App';
import Modal from '../components/Modal';
import Select from '../components/Select';
import { IconPlus, IconFuel, IconClip, IconFile, IconClose, IconCalendar, IconWarning } from '../components/icons';

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fmtDate(d) {
  if (!d) return '—';
  const [y, m, day] = String(d).split('-');
  return y && m && day ? `${day}.${m}.${y}` : d;
}

const emptyForm = { utilaj_id: '', data_consum: todayStr(), nr_litri: '', furnizor: '', ore_contor: '', observatii: '' };

export default function MotorinaSef() {
  const toast = useToast();
  const [pvDeschise, setPvDeschise] = useState([]);
  const [fise, setFise] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const fileRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const [pv, f] = await Promise.all([
        api.get('/pvp?status=deschis'),
        api.get('/motorina'),
      ]);
      setPvDeschise(pv);
      setFise(f);
    } catch (e) {
      toast('Eroare la incarcare: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const openNew = () => {
    if (pvDeschise.length === 0) return;
    setPendingFile(null);
    setForm({ ...emptyForm, utilaj_id: pvDeschise.length === 1 ? String(pvDeschise[0].utilaj_id) : '' });
    setModalOpen(true);
  };

  const canSubmit = form.utilaj_id && form.data_consum && Number(form.nr_litri) > 0;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const result = await api.post('/motorina', form);
      toast('Fisa de motorina adaugata');
      if (pendingFile) {
        const fd = new FormData();
        fd.append('document', pendingFile);
        await api.upload(`/motorina/${result.id}/document`, fd);
      }
      setModalOpen(false);
      load();
    } catch (e) { toast(e.message, 'error'); }
    finally { setSubmitting(false); }
  };

  const utilajOptions = pvDeschise.map(pv => ({ value: String(pv.utilaj_id), label: pv.utilaj_denumire }));
  const docName = (url) => url ? url.split('/').pop() : '';

  return (
    <div className="mx-auto max-w-3xl space-y-3 lg:space-y-6">
      {/* Antet - mobil, doar butonul + pentru fisa noua (titlul e in bara de sus) */}
      <div className="flex items-center justify-end gap-3 lg:hidden">
        <button
          onClick={openNew}
          disabled={loading || pvDeschise.length === 0}
          className="btn-primary h-10 w-10 shrink-0 rounded-full p-0 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Fisa noua"
          title="Fisa noua"
        >
          <IconPlus size={19} weight="bold" />
        </button>
      </div>
      <button onClick={openNew} disabled={loading || pvDeschise.length === 0}
        className="btn-primary hidden h-11 w-full disabled:cursor-not-allowed disabled:opacity-40 lg:flex">
        <IconPlus size={17} weight="bold" /> Fisa de motorina noua
      </button>

      {/* Avertisment fara PV deschis */}
      {!loading && pvDeschise.length === 0 && (
        <div className="card flex items-start gap-3 p-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
            <IconWarning size={18} weight="fill" />
          </span>
          <p className="text-sm text-ink-600 dark:text-ink-300">
            Nu ai niciun proces verbal deschis, deci nu poti adauga o fisa de motorina. Cere biroului sa iti predea un utilaj printr-un proces verbal.
          </p>
        </div>
      )}

      {/* Lista fise */}
      {loading ? (
        <div className="space-y-2.5">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="card h-24 animate-pulse" />)}
        </div>
      ) : fise.length === 0 ? (
        <div className="card py-14 text-center text-sm text-ink-500">
          <IconFuel size={28} className="mx-auto mb-2 text-ink-300" />
          Nu ai adaugat inca nicio fisa de motorina.
        </div>
      ) : (
        <div className="space-y-2.5">
          {fise.map(f => (
            <div key={f.id} className="card overflow-hidden">
              <div className="flex items-start gap-3 p-3.5">
                <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                  <IconFuel size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="min-w-0 truncate font-semibold text-ink-900 dark:text-white">{f.utilaj_denumire}</span>
                    <span className="ml-auto shrink-0 text-base font-semibold tabular text-brand-600 dark:text-brand-400">{f.nr_litri} L</span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-500">
                    <span className="flex items-center gap-1"><IconCalendar size={12} /> {fmtDate(f.data_consum)}</span>
                    {f.furnizor && <span>· {f.furnizor}</span>}
                    {f.ore_contor ? <span className="shrink-0">· {f.ore_contor} h contor</span> : null}
                  </div>
                </div>
              </div>
              {(f.observatii || f.document_url) && (
                <div className="space-y-2 border-t border-ink-100 px-3.5 py-2.5 dark:border-ink-800">
                  {f.observatii && <p className="text-sm text-ink-600 dark:text-ink-300">{f.observatii}</p>}
                  {f.document_url && (
                    <a href={f.document_url} target="_blank" rel="noreferrer"
                      className="flex min-w-0 items-center gap-1.5 text-xs text-brand-600 hover:underline dark:text-brand-400">
                      <IconFile size={14} /> <span className="truncate">{docName(f.document_url)}</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal formular */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Fisa de motorina noua">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-ink-600 dark:text-ink-300">
              Utilaj <span className="text-brand-500">*</span>
            </label>
            <Select value={form.utilaj_id} onChange={v => setForm(f => ({ ...f, utilaj_id: v }))}
              placeholder="Selecteaza utilaj" options={utilajOptions} />
            <p className="mt-1 text-xs text-ink-400">Doar utilajele cu proces verbal deschis pe numele tau.</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-ink-600 dark:text-ink-300">
                Data <span className="text-brand-500">*</span>
              </label>
              <input type="date" required max={todayStr()} value={form.data_consum}
                onChange={e => setForm(f => ({ ...f, data_consum: e.target.value }))} className="field" />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-ink-600 dark:text-ink-300">
                Nr. litri <span className="text-brand-500">*</span>
              </label>
              <input type="number" step="0.1" min="0.1" required value={form.nr_litri}
                onChange={e => setForm(f => ({ ...f, nr_litri: e.target.value }))} className="field" placeholder="0" />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-ink-600 dark:text-ink-300">Furnizor</label>
              <input value={form.furnizor} onChange={e => setForm(f => ({ ...f, furnizor: e.target.value }))}
                className="field" placeholder="ex: Rompetrol" />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-ink-600 dark:text-ink-300">Ore contor</label>
              <input type="number" value={form.ore_contor} onChange={e => setForm(f => ({ ...f, ore_contor: e.target.value }))} className="field" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-[13px] font-medium text-ink-600 dark:text-ink-300">Observatii</label>
              <input value={form.observatii} onChange={e => setForm(f => ({ ...f, observatii: e.target.value }))} className="field" />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[13px] font-medium text-ink-600 dark:text-ink-300">Bon / factura (poza)</label>
            {pendingFile && (
              <div className="mb-2 flex items-center gap-2 rounded-lg bg-brand-50 p-2 text-sm dark:bg-brand-500/10">
                <IconFile size={16} className="text-brand-500" />
                <span className="flex-1 truncate text-brand-700 dark:text-brand-300">{pendingFile.name}</span>
                <button type="button" onClick={() => setPendingFile(null)} className="text-ink-400 hover:text-rose-500"><IconClose size={15} /></button>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
              onChange={e => { if (e.target.files[0]) setPendingFile(e.target.files[0]); e.target.value = ''; }} />
            <button type="button" onClick={() => fileRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-ink-300 px-4 py-3 text-sm text-ink-500 transition-colors hover:border-brand-400 hover:text-brand-600 dark:border-ink-700 dark:text-ink-400 dark:hover:border-brand-500">
              <IconClip size={16} /> Fa o poza sau alege un fisier
            </button>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={!canSubmit || submitting} className="btn-primary h-11 flex-1 disabled:cursor-not-allowed disabled:opacity-50">
              {submitting ? 'Se salveaza…' : 'Salveaza'}
            </button>
            <button type="button" onClick={() => setModalOpen(false)} className="btn-ghost-danger h-11 flex-1">Anuleaza</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
