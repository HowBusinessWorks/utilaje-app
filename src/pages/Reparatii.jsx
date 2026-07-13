import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { useToast } from '../App';
import Modal from '../components/Modal';
import Select from '../components/Select';
import { IconPlus, IconClose, IconRepair, IconFile, IconClip, IconEdit, IconTrash } from '../components/icons';

function Field({ label, required, children, full }) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <label className="mb-1.5 block text-[13px] font-medium text-ink-600 dark:text-ink-300">
        {label}{required && <span className="text-brand-500"> *</span>}
      </label>
      {children}
    </div>
  );
}

export default function Reparatii() {
  const toast = useToast();
  const [reparatii, setReparatii] = useState([]);
  const [utilaje, setUtilaje] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterUtilaj, setFilterUtilaj] = useState('');
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [pendingDoc, setPendingDoc] = useState(null);
  const fileRef = useRef(null);
  const [form, setForm] = useState({
    utilaj_id: '', data_reparatie: new Date().toISOString().slice(0, 10),
    furnizor: '', descriere: '', cost_total: '', ore_contor: '', durata_zile: '', observatii: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterUtilaj) params.set('utilaj_id', filterUtilaj);
      if (filterStart) params.set('data_start', filterStart);
      if (filterEnd) params.set('data_sfarsit', filterEnd);
      const [r, u] = await Promise.all([
        api.get('/reparatii' + (params.toString() ? '?' + params : '')),
        api.get('/utilaje'),
      ]);
      setReparatii(r); setUtilaje(u);
    } catch (e) {
      toast('Eroare: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filterUtilaj, filterStart, filterEnd]);

  const openNew = () => {
    setEditing(null);
    setPendingDoc(null);
    setForm({ utilaj_id: '', data_reparatie: new Date().toISOString().slice(0, 10), furnizor: '', descriere: '', cost_total: '', ore_contor: '', durata_zile: '', observatii: '' });
    setModalOpen(true);
  };

  const openEdit = (r) => {
    setEditing(r);
    setPendingDoc(null);
    setForm({
      utilaj_id: String(r.utilaj_id),
      data_reparatie: r.data_reparatie,
      furnizor: r.furnizor,
      descriere: r.descriere,
      cost_total: String(r.cost_total),
      ore_contor: String(r.ore_contor || ''),
      durata_zile: String(r.durata_zile || ''),
      observatii: r.observatii || '',
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      let id;
      if (editing) {
        await api.put(`/reparatii/${editing.id}`, form);
        id = editing.id;
        toast('Reparatie actualizata');
      } else {
        const result = await api.post('/reparatii', form);
        id = result.id;
        toast('Reparatie adaugata');
      }
      if (pendingDoc === '__remove__') {
        await api.delete(`/reparatii/${id}/factura`);
      } else if (pendingDoc) {
        const fd = new FormData();
        fd.append('factura', pendingDoc);
        await api.upload(`/reparatii/${id}/factura`, fd);
      }
      setModalOpen(false);
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Stergi aceasta reparatie?')) return;
    try {
      await api.delete(`/reparatii/${id}`);
      toast('Reparatie stearsa');
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const totalCost = reparatii.reduce((s, r) => s + (r.cost_total || 0), 0);
  const docName = (url) => url ? url.split('/').pop() : '';
  const hasFilters = filterUtilaj || filterStart || filterEnd;

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-48">
            <Select value={filterUtilaj} onChange={setFilterUtilaj} placeholder="Toate utilajele"
              options={[{ value: '', label: 'Toate utilajele' }, ...utilaje.map(u => ({ value: String(u.id), label: u.denumire }))]} />
          </div>
          <input type="date" value={filterStart} onChange={e => setFilterStart(e.target.value)} className="field w-auto" />
          <input type="date" value={filterEnd} onChange={e => setFilterEnd(e.target.value)} className="field w-auto" />
          {hasFilters && (
            <button onClick={() => { setFilterUtilaj(''); setFilterStart(''); setFilterEnd(''); }}
              className="flex items-center gap-1 px-2 py-1 text-sm text-ink-500 hover:text-ink-700 dark:hover:text-ink-300">
              <IconClose size={15} /> Sterge
            </button>
          )}
        </div>
        <button onClick={openNew} className="btn-primary">
          <IconPlus size={17} weight="bold" /> Reparatie noua
        </button>
      </div>

      {/* Total strip */}
      <div className="card flex items-center gap-6 p-4">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
          <IconRepair size={22} weight="fill" />
        </span>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-400">Costuri filtrate</p>
          <p className="text-2xl font-semibold tabular text-ink-900 dark:text-white">{totalCost.toLocaleString('ro-RO')} <span className="text-base font-medium text-ink-400">RON</span></p>
        </div>
        <div className="h-10 w-px bg-ink-200 dark:bg-ink-800" />
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-400">Numar reparatii</p>
          <p className="text-2xl font-semibold tabular text-ink-900 dark:text-white">{reparatii.length}</p>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="card h-64 animate-pulse" />
      ) : (
        <div className="card overflow-hidden">
          <div className="scroll-area overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-200/70 dark:border-ink-800">
                  {['Data', 'Utilaj', 'Furnizor', 'Descriere', 'Cost (RON)', 'Durata', 'Ore contor', ''].map(h => (
                    <th key={h} className="whitespace-nowrap px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                {reparatii.map(r => (
                  <tr key={r.id} className="transition-colors hover:bg-ink-50/70 dark:hover:bg-ink-800/40">
                    <td className="whitespace-nowrap px-4 py-3 tabular text-ink-600 dark:text-ink-300">{r.data_reparatie}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-ink-900 dark:text-white">{r.utilaj_denumire}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-ink-600 dark:text-ink-300">{r.furnizor}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-ink-600 dark:text-ink-300">{r.descriere}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-semibold tabular text-rose-600 dark:text-rose-400">{r.cost_total?.toLocaleString('ro-RO')}</td>
                    <td className="whitespace-nowrap px-4 py-3 tabular text-ink-600 dark:text-ink-300">{r.durata_zile ? r.durata_zile + ' zile' : '—'}</td>
                    <td className="px-4 py-3 tabular text-ink-600 dark:text-ink-300">{r.ore_contor || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(r)} className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-800" aria-label="Editeaza"><IconEdit size={16} /></button>
                        <button onClick={() => handleDelete(r.id)} className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10" aria-label="Sterge"><IconTrash size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {reparatii.length === 0 && <p className="py-12 text-center text-sm text-ink-400">Nicio reparatie</p>}
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editeaza reparatie' : 'Reparatie noua'}>
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Utilaj" required full>
              <Select value={form.utilaj_id} onChange={v => setForm(f => ({ ...f, utilaj_id: v }))} placeholder="Selecteaza utilaj"
                options={utilaje.map(u => ({ value: String(u.id), label: u.denumire }))} />
            </Field>
            <Field label="Data reparatie" required>
              <input type="date" required value={form.data_reparatie} onChange={e => setForm(f => ({ ...f, data_reparatie: e.target.value }))} className="field" />
            </Field>
            <Field label="Furnizor" required>
              <input required value={form.furnizor} onChange={e => setForm(f => ({ ...f, furnizor: e.target.value }))} className="field" />
            </Field>
            <Field label="Descriere" required full>
              <input required value={form.descriere} onChange={e => setForm(f => ({ ...f, descriere: e.target.value }))} className="field" />
            </Field>
            <Field label="Cost total (RON)" required>
              <input type="number" step="0.01" required value={form.cost_total} onChange={e => setForm(f => ({ ...f, cost_total: e.target.value }))} className="field" />
            </Field>
            <Field label="Durata (zile)">
              <input type="number" value={form.durata_zile} onChange={e => setForm(f => ({ ...f, durata_zile: e.target.value }))} className="field" />
            </Field>
            <Field label="Ore contor">
              <input type="number" value={form.ore_contor} onChange={e => setForm(f => ({ ...f, ore_contor: e.target.value }))} className="field" />
            </Field>
            <Field label="Observatii" full>
              <textarea value={form.observatii} onChange={e => setForm(f => ({ ...f, observatii: e.target.value }))} className="field resize-none" rows={2} />
            </Field>
          </div>

          <div>
            <label className="mb-2 block text-[13px] font-medium text-ink-600 dark:text-ink-300">Factura / document</label>
            {editing && editing.factura_url && !pendingDoc && (
              <div className="mb-2 flex items-center gap-2 rounded-lg bg-ink-50 p-2 text-sm dark:bg-ink-800">
                <IconFile size={16} className="text-ink-400" />
                <a href={editing.factura_url} target="_blank" rel="noreferrer" className="flex-1 truncate text-brand-600 hover:underline dark:text-brand-400">{docName(editing.factura_url)}</a>
                <button type="button" onClick={() => setPendingDoc('__remove__')} className="text-ink-400 hover:text-rose-500"><IconClose size={15} /></button>
              </div>
            )}
            {pendingDoc && pendingDoc !== '__remove__' && (
              <div className="mb-2 flex items-center gap-2 rounded-lg bg-brand-50 p-2 text-sm dark:bg-brand-500/10">
                <IconFile size={16} className="text-brand-500" />
                <span className="flex-1 truncate text-brand-700 dark:text-brand-300">{pendingDoc.name}</span>
                <button type="button" onClick={() => setPendingDoc(null)} className="text-ink-400 hover:text-rose-500"><IconClose size={15} /></button>
              </div>
            )}
            <input ref={fileRef} type="file" className="hidden" onChange={e => { if (e.target.files[0]) setPendingDoc(e.target.files[0]); e.target.value = ''; }} />
            <button type="button" onClick={() => fileRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-ink-300 px-4 py-3 text-sm text-ink-500 transition-colors hover:border-brand-400 hover:text-brand-600 dark:border-ink-700 dark:text-ink-400 dark:hover:border-brand-500">
              <IconClip size={16} /> Click pentru a atasa un document
            </button>
          </div>

          <div className="flex gap-3">
            <button type="submit" className="btn-primary flex-1">Salveaza</button>
            <button type="button" onClick={() => setModalOpen(false)} className="btn-ghost flex-1">Anuleaza</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
