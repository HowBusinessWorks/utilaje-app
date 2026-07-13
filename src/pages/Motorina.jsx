import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { useToast } from '../App';
import Modal from '../components/Modal';
import Select from '../components/Select';
import { IconPlus, IconClose, IconFuel, IconClip, IconFile, IconEdit, IconTrash } from '../components/icons';

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

export default function Motorina() {
  const toast = useToast();
  const [fise, setFise] = useState([]);
  const [utilaje, setUtilaje] = useState([]);
  const [lucrari, setLucrari] = useState([]);
  const [persoane, setPersoane] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterUtilaj, setFilterUtilaj] = useState('');
  const [filterLucrare, setFilterLucrare] = useState('');
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [pendingDoc, setPendingDoc] = useState(null);
  const fileRef = useRef(null);
  const [form, setForm] = useState({
    utilaj_id: '', lucrare_id: '', persoana_id: '',
    data_consum: new Date().toISOString().slice(0, 10),
    nr_litri: '', furnizor: '', ore_contor: '', observatii: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterUtilaj) params.set('utilaj_id', filterUtilaj);
      if (filterLucrare) params.set('lucrare_id', filterLucrare);
      if (filterStart) params.set('data_start', filterStart);
      if (filterEnd) params.set('data_sfarsit', filterEnd);
      const [f, u, l, p] = await Promise.all([
        api.get('/motorina' + (params.toString() ? '?' + params : '')),
        api.get('/utilaje'),
        api.get('/lucrari'),
        api.get('/persoane'),
      ]);
      setFise(f); setUtilaje(u); setLucrari(l); setPersoane(p);
    } catch (e) {
      toast('Eroare: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filterUtilaj, filterLucrare, filterStart, filterEnd]);

  const openNew = () => {
    setEditing(null);
    setPendingDoc(null);
    setForm({ utilaj_id: '', lucrare_id: '', persoana_id: '', data_consum: new Date().toISOString().slice(0, 10), nr_litri: '', furnizor: 'MOL', ore_contor: '', observatii: '' });
    setModalOpen(true);
  };

  const openEdit = (fisa) => {
    setEditing(fisa);
    setPendingDoc(null);
    setForm({
      utilaj_id: String(fisa.utilaj_id),
      lucrare_id: String(fisa.lucrare_id || ''),
      persoana_id: String(fisa.persoana_id || ''),
      data_consum: fisa.data_consum,
      nr_litri: String(fisa.nr_litri),
      furnizor: fisa.furnizor || '',
      ore_contor: String(fisa.ore_contor || ''),
      observatii: fisa.observatii || '',
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      let id;
      if (editing) {
        await api.put(`/motorina/${editing.id}`, form);
        id = editing.id;
        toast('Fisa actualizata');
      } else {
        const result = await api.post('/motorina', form);
        id = result.id;
        toast('Fisa adaugata');
      }
      if (pendingDoc === '__remove__') {
        await api.delete(`/motorina/${id}/document`);
      } else if (pendingDoc) {
        const fd = new FormData();
        fd.append('document', pendingDoc);
        await api.upload(`/motorina/${id}/document`, fd);
      }
      setModalOpen(false);
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const handleDeleteDoc = async (fisaId) => {
    try {
      await api.delete(`/motorina/${fisaId}/document`);
      toast('Document sters');
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Stergi aceasta fisa?')) return;
    try {
      await api.delete(`/motorina/${id}`);
      toast('Fisa stearsa');
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const totalLitri = fise.reduce((s, f) => s + (f.nr_litri || 0), 0);
  const docName = (url) => url ? url.split('/').pop() : '';
  const hasFilters = filterUtilaj || filterLucrare || filterStart || filterEnd;

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-48">
            <Select value={filterUtilaj} onChange={setFilterUtilaj} placeholder="Toate utilajele"
              options={[{ value: '', label: 'Toate utilajele' }, ...utilaje.map(u => ({ value: String(u.id), label: u.denumire }))]} />
          </div>
          <div className="w-48">
            <Select value={filterLucrare} onChange={setFilterLucrare} placeholder="Toate lucrarile"
              options={[{ value: '', label: 'Toate lucrarile' }, ...lucrari.map(l => ({ value: String(l.id), label: l.nume }))]} />
          </div>
          <input type="date" value={filterStart} onChange={e => setFilterStart(e.target.value)} className="field w-auto" />
          <input type="date" value={filterEnd} onChange={e => setFilterEnd(e.target.value)} className="field w-auto" />
          {hasFilters && (
            <button onClick={() => { setFilterUtilaj(''); setFilterLucrare(''); setFilterStart(''); setFilterEnd(''); }}
              className="flex items-center gap-1 px-2 py-1 text-sm text-ink-500 hover:text-ink-700 dark:hover:text-ink-300">
              <IconClose size={15} /> Sterge filtre
            </button>
          )}
        </div>
        <button onClick={openNew} className="btn-primary">
          <IconPlus size={17} weight="bold" /> Fisa noua
        </button>
      </div>

      {/* Total strip */}
      <div className="card flex items-center gap-6 p-4">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
          <IconFuel size={22} weight="fill" />
        </span>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-400">Consum filtrat</p>
          <p className="text-2xl font-semibold tabular text-ink-900 dark:text-white">{totalLitri.toLocaleString('ro-RO')} <span className="text-base font-medium text-ink-400">L</span></p>
        </div>
        <div className="h-10 w-px bg-ink-200 dark:bg-ink-800" />
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-400">Numar fise</p>
          <p className="text-2xl font-semibold tabular text-ink-900 dark:text-white">{fise.length}</p>
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
                  {['Data', 'Utilaj', 'Litri', 'Furnizor', 'Lucrare', 'Operator', 'Ore contor', 'Document', ''].map(h => (
                    <th key={h} className="whitespace-nowrap px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                {fise.map(f => (
                  <tr key={f.id} className="transition-colors hover:bg-ink-50/70 dark:hover:bg-ink-800/40">
                    <td className="whitespace-nowrap px-4 py-3 tabular text-ink-600 dark:text-ink-300">{f.data_consum}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-ink-900 dark:text-white">{f.utilaj_denumire}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-semibold tabular text-brand-600 dark:text-brand-400">{f.nr_litri} L</td>
                    <td className="px-4 py-3 text-ink-600 dark:text-ink-300">{f.furnizor || '—'}</td>
                    <td className="px-4 py-3 text-ink-600 dark:text-ink-300">{f.lucrare_nume || '—'}</td>
                    <td className="px-4 py-3 text-ink-600 dark:text-ink-300">{f.persoana_nume || '—'}</td>
                    <td className="px-4 py-3 tabular text-ink-600 dark:text-ink-300">{f.ore_contor || '—'}</td>
                    <td className="px-4 py-3">
                      {f.document_url ? (
                        <div className="flex items-center gap-1">
                          <a href={f.document_url} target="_blank" rel="noreferrer"
                            className="block max-w-[120px] truncate text-xs text-brand-600 hover:underline dark:text-brand-400">
                            {docName(f.document_url)}
                          </a>
                          <button onClick={() => handleDeleteDoc(f.id)} className="text-ink-400 hover:text-rose-500" aria-label="Sterge document"><IconClose size={14} /></button>
                        </div>
                      ) : <span className="text-ink-400">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(f)} className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-800" aria-label="Editeaza"><IconEdit size={16} /></button>
                        <button onClick={() => handleDelete(f.id)} className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10" aria-label="Sterge"><IconTrash size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {fise.length === 0 && <p className="py-12 text-center text-sm text-ink-400">Nicio fisa motorina</p>}
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editeaza fisa motorina' : 'Fisa motorina noua'}>
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Utilaj" required full>
              <Select value={form.utilaj_id} onChange={v => setForm(f => ({ ...f, utilaj_id: v }))} placeholder="Selecteaza utilaj"
                options={utilaje.map(u => ({ value: String(u.id), label: u.denumire }))} />
            </Field>
            <Field label="Data consum" required>
              <input type="date" required value={form.data_consum} onChange={e => setForm(f => ({ ...f, data_consum: e.target.value }))} className="field" />
            </Field>
            <Field label="Nr. litri" required>
              <input type="number" step="0.1" required value={form.nr_litri} onChange={e => setForm(f => ({ ...f, nr_litri: e.target.value }))} className="field" placeholder="0" />
            </Field>
            <Field label="Furnizor">
              <input value={form.furnizor} onChange={e => setForm(f => ({ ...f, furnizor: e.target.value }))} className="field" placeholder="ex: Rompetrol" />
            </Field>
            <Field label="Ore contor">
              <input type="number" value={form.ore_contor} onChange={e => setForm(f => ({ ...f, ore_contor: e.target.value }))} className="field" />
            </Field>
            <Field label="Lucrare">
              <Select value={form.lucrare_id} onChange={v => setForm(f => ({ ...f, lucrare_id: v }))} placeholder="Selecteaza lucrare"
                options={lucrari.map(l => ({ value: String(l.id), label: l.nume }))} />
            </Field>
            <Field label="Operator">
              <Select value={form.persoana_id} onChange={v => setForm(f => ({ ...f, persoana_id: v }))} placeholder="Selecteaza operator"
                options={persoane.map(p => ({ value: String(p.id), label: p.nume }))} />
            </Field>
            <Field label="Observatii" full>
              <input value={form.observatii} onChange={e => setForm(f => ({ ...f, observatii: e.target.value }))} className="field" />
            </Field>
          </div>

          {editing && (
            <div>
              <label className="mb-2 block text-[13px] font-medium text-ink-600 dark:text-ink-300">Document (factura, bon etc.)</label>
              {editing.document_url && !pendingDoc && (
                <div className="mb-2 flex items-center gap-2 rounded-lg bg-ink-50 p-2 text-sm dark:bg-ink-800">
                  <IconFile size={16} className="text-ink-400" />
                  <a href={editing.document_url} target="_blank" rel="noreferrer" className="flex-1 truncate text-brand-600 hover:underline dark:text-brand-400">{docName(editing.document_url)}</a>
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
          )}

          <div className="flex gap-3">
            <button type="submit" className="btn-primary flex-1">Salveaza</button>
            <button type="button" onClick={() => setModalOpen(false)} className="btn-ghost flex-1">Anuleaza</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
