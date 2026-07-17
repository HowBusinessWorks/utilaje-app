import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useToast } from '../App';
import Modal from '../components/Modal';
import Select from '../components/Select';
import { IconPlus, IconSearch, IconPeople, IconEdit, IconTrash, IconLock, IconEye, IconEyeSlash } from '../components/icons';

const categoriaLabel = { angajat: 'Angajat', sef_santier: 'Sef santier', subcontractant: 'Subcontractant' };
const categoriaTone = {
  angajat: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  sef_santier: 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300',
  subcontractant: 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300',
};

export default function Persoane() {
  const toast = useToast();
  const [persoane, setPersoane] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('angajat');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nume: '', telefon: '', categorie: 'angajat', parola: '' });
  const [showPass, setShowPass] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setPersoane(await api.get('/persoane'));
    } catch (e) {
      toast('Eroare: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = persoane.filter(p =>
    p.categorie === activeTab &&
    (p.nume.toLowerCase().includes(search.toLowerCase()) || (p.telefon || '').includes(search))
  );

  const openNew = () => {
    setEditing(null);
    setShowPass(false);
    setForm({ nume: '', telefon: '', categorie: activeTab, parola: '' });
    setModalOpen(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setShowPass(false);
    setForm({ nume: p.nume, telefon: p.telefon || '', categorie: p.categorie, parola: '' });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/persoane/${editing.id}`, form);
        toast('Persoana actualizata');
      } else {
        await api.post('/persoane', form);
        toast('Persoana adaugata');
      }
      setModalOpen(false);
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Stergi aceasta persoana?')) return;
    try {
      await api.delete(`/persoane/${id}`);
      toast('Persoana stearsa');
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const counts = {
    angajat: persoane.filter(p => p.categorie === 'angajat').length,
    sef_santier: persoane.filter(p => p.categorie === 'sef_santier').length,
    subcontractant: persoane.filter(p => p.categorie === 'subcontractant').length,
  };

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="border-b border-ink-200 dark:border-ink-800">
        <div className="flex gap-1">
          {[
            { key: 'angajat', label: `Angajati (${counts.angajat})` },
            { key: 'sef_santier', label: `Sefi santier (${counts.sef_santier})` },
            { key: 'subcontractant', label: `Subcontractanti (${counts.subcontractant})` },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-ink-500 hover:text-ink-800 dark:text-ink-400 dark:hover:text-ink-200'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <IconSearch size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input type="text" placeholder="Cauta dupa nume sau telefon..." value={search}
            onChange={e => setSearch(e.target.value)} className="field pl-9" />
        </div>
        <button onClick={openNew} className="btn-primary">
          <IconPlus size={17} weight="bold" /> Persoana noua
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="card h-[76px] animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center gap-3 py-16 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-ink-100 text-ink-400 dark:bg-ink-800"><IconPeople size={28} /></span>
          <p className="text-sm text-ink-500">Nicio persoana gasita</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(p => (
            <div key={p.id} className="card group flex items-center gap-4 p-4 transition-shadow hover:shadow-pop">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-lg font-semibold text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                {p.nume.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-ink-900 dark:text-white">{p.nume}</p>
                {p.telefon && <p className="text-sm tabular text-ink-500 dark:text-ink-400">{p.telefon}</p>}
                <span className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${categoriaTone[p.categorie]}`}>
                    {categoriaLabel[p.categorie]}
                  </span>
                  {p.are_cont && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-ink-100 px-1.5 py-0.5 text-xs font-medium text-ink-500 dark:bg-ink-800 dark:text-ink-400">
                      <IconLock size={11} /> Cont
                    </span>
                  )}
                </span>
              </div>
              <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button onClick={() => openEdit(p)} className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-800" aria-label="Editeaza"><IconEdit size={16} /></button>
                <button onClick={() => handleDelete(p.id)} className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10" aria-label="Sterge"><IconTrash size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editeaza persoana' : 'Persoana noua'} size="sm">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-ink-600 dark:text-ink-300">Nume <span className="text-brand-500">*</span></label>
            <input required value={form.nume} onChange={e => setForm(f => ({ ...f, nume: e.target.value }))} className="field" placeholder="ex: Ion Popescu" />
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-ink-600 dark:text-ink-300">Telefon</label>
            <input value={form.telefon} onChange={e => setForm(f => ({ ...f, telefon: e.target.value }))} className="field" placeholder="ex: 0740 123 456" />
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-ink-600 dark:text-ink-300">Categorie <span className="text-brand-500">*</span></label>
            <Select value={form.categorie} onChange={v => setForm(f => ({ ...f, categorie: v }))}
              options={[{ value: 'angajat', label: 'Angajat' }, { value: 'sef_santier', label: 'Sef santier' }, { value: 'subcontractant', label: 'Subcontractant' }]} />
          </div>

          {form.categorie === 'sef_santier' && (
            <div className="rounded-xl border border-ink-200/80 bg-ink-50/60 p-3 dark:border-ink-800 dark:bg-ink-950/40">
              <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                <IconLock size={13} /> Cont de autentificare
              </div>
              <p className="mb-2.5 text-[12px] text-ink-500">
                Seful de santier se logheaza cu <span className="font-medium">numarul de telefon</span> de mai sus si parola setata aici.
              </p>
              <label className="mb-1.5 block text-[13px] font-medium text-ink-600 dark:text-ink-300">
                {editing?.are_cont ? 'Parola noua' : 'Parola'}
                {editing?.are_cont && <span className="ml-1 font-normal text-ink-400">(lasa gol pentru a pastra)</span>}
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.parola}
                  onChange={e => setForm(f => ({ ...f, parola: e.target.value }))}
                  className="field pr-9"
                  placeholder={editing?.are_cont ? '••••••••' : 'Seteaza o parola'}
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-ink-400 hover:text-ink-600 dark:hover:text-ink-200"
                  aria-label={showPass ? 'Ascunde parola' : 'Arata parola'}>
                  {showPass ? <IconEyeSlash size={16} /> : <IconEye size={16} />}
                </button>
              </div>
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
