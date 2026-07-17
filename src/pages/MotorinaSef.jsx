import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { useToast } from '../App';
import Modal from '../components/Modal';
import Select from '../components/Select';
import { IconPlus, IconFuel, IconClip, IconFile, IconClose, IconCalendar, IconWarning, IconEdit, IconTrash } from '../components/icons';

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
  const [editing, setEditing] = useState(null);
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
    setEditing(null);
    setPendingFile(null);
    setForm({ ...emptyForm, utilaj_id: pvDeschise.length === 1 ? String(pvDeschise[0].utilaj_id) : '' });
    setModalOpen(true);
  };

  const openEdit = (fisa) => {
    setEditing(fisa);
    setPendingFile(null);
    setForm({
      utilaj_id: String(fisa.utilaj_id),
      data_consum: fisa.data_consum,
      nr_litri: String(fisa.nr_litri),
      furnizor: fisa.furnizor || '',
      ore_contor: String(fisa.ore_contor || ''),
      observatii: fisa.observatii || '',
    });
    setModalOpen(true);
  };

  const canSubmit = form.utilaj_id && form.data_consum && Number(form.nr_litri) > 0;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      let id;
      if (editing) {
        await api.put(`/motorina/${editing.id}`, form);
        id = editing.id;
        toast('Fisa actualizata');
      } else {
        const result = await api.post('/motorina', form);
        id = result.id;
        toast('Fisa de motorina adaugata');
      }
      if (pendingFile) {
        const fd = new FormData();
        fd.append('document', pendingFile);
        await api.upload(`/motorina/${id}/document`, fd);
      }
      setModalOpen(false);
      load();
    } catch (e) { toast(e.message, 'error'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Stergi aceasta fisa de motorina?')) return;
    try {
      await api.delete(`/motorina/${id}`);
      toast('Fisa stearsa');
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const utilajOptions = pvDeschise.map(pv => ({ value: String(pv.utilaj_id), label: pv.utilaj_denumire }));
  const docName = (url) => url ? url.split('/').pop() : '';

  return (
    <div className="mx-auto max-w-3xl space-y-3 lg:space-y-6">
      {/* Antet - laptop */}
      <div className="hidden items-center gap-3 lg:flex">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-600 text-white shadow-sm">
          <IconFuel size={22} weight="fill" />
        </span>
        <div>
          <h1 className="text-xl font-semibold text-ink-900 dark:text-white">Fise de motorina</h1>
          <p className="text-sm text-ink-500">Alimentarile facute de tine pe utilajele predate.</p>
        </div>
      </div>

      {/* Antet - mobil */}
      <div className="flex items-center justify-between gap-3 lg:hidden">
        <h1 className="text-lg font-semibold text-ink-900 dark:text-white">Fisele mele de motorina</h1>
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
            <div key={f.id} className="card p-4">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="truncate font-semibold text-ink-900 dark:text-white">{f.utilaj_denumire}</span>
                <span className="shrink-0 text-lg font-semibold tabular text-brand-600 dark:text-brand-400">{f.nr_litri} L</span>
              </div>
              <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-ink-500">
                <span className="flex items-center gap-1"><IconCalendar size={13} /> {fmtDate(f.data_consum)}</span>
                {f.furnizor && <span>{f.furnizor}</span>}
                {f.lucrare_nume && <span className="truncate">{f.lucrare_nume}</span>}
                {f.ore_contor ? <span>{f.ore_contor} h contor</span> : null}
              </div>
              {f.observatii && <p className="mb-2 text-sm text-ink-600 dark:text-ink-300">{f.observatii}</p>}
              <div className="flex items-center justify-between gap-2 border-t border-ink-100 pt-2.5 dark:border-ink-800">
                {f.document_url ? (
                  <a href={f.document_url} target="_blank" rel="noreferrer"
                    className="flex min-w-0 items-center gap-1.5 text-xs text-brand-600 hover:underline dark:text-brand-400">
                    <IconFile size={14} /> <span className="truncate">{docName(f.document_url)}</span>
                  </a>
                ) : <span />}
                <div className="flex shrink-0 gap-1">
                  <button onClick={() => openEdit(f)} className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-800" aria-label="Editeaza"><IconEdit size={16} /></button>
                  <button onClick={() => handleDelete(f.id)} className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10" aria-label="Sterge"><IconTrash size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal formular */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editeaza fisa de motorina' : 'Fisa de motorina noua'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-ink-600 dark:text-ink-300">
              Utilaj <span className="text-brand-500">*</span>
            </label>
            <Select value={form.utilaj_id} onChange={v => setForm(f => ({ ...f, utilaj_id: v }))}
              placeholder="Selecteaza utilaj" options={utilajOptions} disabled={!!editing} />
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
            {editing?.document_url && !pendingFile && (
              <div className="mb-2 flex items-center gap-2 rounded-lg bg-ink-50 p-2 text-sm dark:bg-ink-800">
                <IconFile size={16} className="text-ink-400" />
                <a href={editing.document_url} target="_blank" rel="noreferrer" className="flex-1 truncate text-brand-600 hover:underline dark:text-brand-400">{docName(editing.document_url)}</a>
              </div>
            )}
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
            <button type="button" onClick={() => setModalOpen(false)} className="btn-ghost h-11 flex-1">Anuleaza</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
