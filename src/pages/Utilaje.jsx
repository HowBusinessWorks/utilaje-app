import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useToast } from '../App';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import Select from '../components/Select';
import {
  IconPlus, IconSearch, IconUtilaj, IconUser, IconClock, IconMoney, IconFactory,
} from '../components/icons';

const statusOptions = ['disponibil', 'service', 'indisponibil', 'casat'];
const proprietateOptions = ['propriu', 'inchiriat', 'leasing'];
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

function Field({ label, required, children, full }) {
  return (
    <div className={full ? 'sm:col-span-2 lg:col-span-3' : ''}>
      <label className="mb-1 block text-[13px] font-medium text-ink-600 dark:text-ink-300">
        {label}{required && <span className="text-brand-500"> *</span>}
      </label>
      {children}
    </div>
  );
}

function UtilajForm({ initial, categorii, persoane, locatii, onSave, onClose }) {
  const [form, setForm] = useState({
    denumire: '', alias: '', serie: '', nr_inventar: '', nr_matriculare: '', producator: '',
    categorie_id: '', status: 'disponibil', proprietate: 'propriu',
    responsabil_id: '', locatie_baza_id: '', data_achizitie: '',
    garantie_exp: '', chirie_zi: '', observatii: '',
    ...initial,
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.denumire.trim()) return;
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 lg:grid-cols-3">
        <Field label="Denumire" required full>
          <input required value={form.denumire} onChange={e => set('denumire', e.target.value)}
            className="field" placeholder="ex: Excavator CAT 320" />
        </Field>
        <Field label="Alias">
          <input value={form.alias} onChange={e => set('alias', e.target.value)} className="field" placeholder="ex: EXC-01" />
        </Field>
        <Field label="Serie">
          <input value={form.serie} onChange={e => set('serie', e.target.value)} className="field" />
        </Field>
        <Field label="Nr. inventar">
          <input value={form.nr_inventar} onChange={e => set('nr_inventar', e.target.value)} className="field" />
        </Field>
        <Field label="Nr. matriculare">
          <input value={form.nr_matriculare} onChange={e => set('nr_matriculare', e.target.value)} className="field" placeholder="ex: B 123 XYZ" />
        </Field>
        <Field label="Producator">
          <input value={form.producator} onChange={e => set('producator', e.target.value)} className="field" />
        </Field>
        <Field label="Categorie">
          <Select value={form.categorie_id} onChange={v => set('categorie_id', v)} placeholder="Selecteaza categorie"
            options={categorii.map(c => ({ value: String(c.id), label: c.nume }))} />
        </Field>
        <Field label="Status">
          <Select value={form.status} onChange={v => set('status', v)}
            options={statusOptions.map(s => ({ value: s, label: cap(s) }))} />
        </Field>
        <Field label="Proprietate">
          <Select value={form.proprietate} onChange={v => set('proprietate', v)}
            options={proprietateOptions.map(p => ({ value: p, label: cap(p) }))} />
        </Field>
        <Field label="Responsabil">
          <Select value={form.responsabil_id} onChange={v => set('responsabil_id', v)} placeholder="Selecteaza persoana"
            options={persoane.map(p => ({ value: String(p.id), label: p.nume }))} />
        </Field>
        <Field label="Locatie baza">
          <Select value={form.locatie_baza_id} onChange={v => set('locatie_baza_id', v)} placeholder="Selecteaza locatie"
            options={locatii.map(l => ({ value: String(l.id), label: l.nume }))} />
        </Field>
        <Field label="Data achizitie">
          <input type="date" value={form.data_achizitie} onChange={e => set('data_achizitie', e.target.value)} className="field" />
        </Field>
        <Field label="Garantie expira">
          <input type="date" value={form.garantie_exp} onChange={e => set('garantie_exp', e.target.value)} className="field" />
        </Field>
        <Field label="Chirie / zi (RON)">
          <input type="number" value={form.chirie_zi} onChange={e => set('chirie_zi', e.target.value)} className="field" placeholder="0" />
        </Field>
        <Field label="Observatii" full>
          <textarea value={form.observatii} onChange={e => set('observatii', e.target.value)} rows={1} className="field resize-none" />
        </Field>
      </div>
      <div className="flex gap-3 pt-1">
        <button type="submit" className="btn-primary flex-1">Salveaza</button>
        <button type="button" onClick={onClose} className="btn-ghost flex-1">Anuleaza</button>
      </div>
    </form>
  );
}

export default function Utilaje() {
  const navigate = useNavigate();
  const toast = useToast();
  const [utilaje, setUtilaje] = useState([]);
  const [categorii, setCategorii] = useState([]);
  const [persoane, setPersoane] = useState([]);
  const [locatii, setLocatii] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategorie, setFilterCategorie] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (filterStatus) params.set('status', filterStatus);
      if (filterCategorie) params.set('categorie_id', filterCategorie);
      const [u, c, p, l] = await Promise.all([
        api.get('/utilaje' + (params.toString() ? '?' + params : '')),
        api.get('/lucrari/categorii'),
        api.get('/persoane'),
        api.get('/lucrari/locatii'),
      ]);
      setUtilaje(u); setCategorii(c); setPersoane(p); setLocatii(l);
    } catch (e) {
      toast('Eroare la incarcarea datelor: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, [search, filterStatus, filterCategorie]);

  const handleCreate = async (form) => {
    try {
      await api.post('/utilaje', form);
      toast('Utilaj adaugat cu succes');
      setModalOpen(false);
      loadAll();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const statusColors = { disponibil: 'before:bg-emerald-500', service: 'before:bg-amber-500', indisponibil: 'before:bg-rose-500', casat: 'before:bg-ink-400' };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-64">
            <IconSearch size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              type="text" placeholder="Cauta utilaj..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="field pl-9"
            />
          </div>
          <div className="w-44">
            <Select value={filterStatus} onChange={setFilterStatus} placeholder="Toate statusurile"
              options={[{ value: '', label: 'Toate statusurile' }, ...statusOptions.map(s => ({ value: s, label: cap(s) }))]} />
          </div>
          <div className="w-44">
            <Select value={filterCategorie} onChange={setFilterCategorie} placeholder="Toate categoriile"
              options={[{ value: '', label: 'Toate categoriile' }, ...categorii.map(c => ({ value: String(c.id), label: c.nume }))]} />
          </div>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary">
          <IconPlus size={17} weight="bold" /> Utilaj nou
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card h-64 animate-pulse" />
          ))}
        </div>
      ) : utilaje.length === 0 ? (
        <div className="card flex flex-col items-center justify-center gap-3 py-20 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-ink-100 text-ink-400 dark:bg-ink-800">
            <IconUtilaj size={28} />
          </span>
          <p className="text-sm text-ink-500">Niciun utilaj gasit</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {utilaje.map(u => (
            <div key={u.id}
              role="button" tabIndex={0}
              onClick={() => navigate(`/utilaje/${u.id}`)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/utilaje/${u.id}`); } }}
              className={`card group relative block w-full cursor-pointer overflow-hidden text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-pop
                before:absolute before:left-0 before:top-0 before:z-10 before:h-full before:w-1 ${statusColors[u.status] || 'before:bg-ink-300'}`}>
              <div className="aspect-[4/3] w-full overflow-hidden bg-ink-100 dark:bg-ink-800">
                {u.thumbnail_url ? (
                  <img src={u.thumbnail_url} alt={u.denumire} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-ink-300 dark:text-ink-600">
                    <IconUtilaj size={40} weight="thin" />
                  </div>
                )}
              </div>
              <div className="p-3">
                <div className="mb-1.5 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-ink-900 dark:text-white">{u.denumire}</h3>
                    {u.alias && <p className="mt-0.5 truncate text-xs text-ink-600 dark:text-ink-300">{u.alias}</p>}
                  </div>
                  <StatusBadge status={u.status} />
                </div>
                <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                  {u.categorie_nume && (
                    <span className="inline-block truncate rounded-md px-2 py-0.5 text-xs font-medium"
                      style={{ backgroundColor: (u.categorie_culoare || '#2450e8') + '18', color: u.categorie_culoare || '#2450e8' }}>
                      {u.categorie_nume}
                    </span>
                  )}
                  {u.producator && <span className="flex items-center gap-1 truncate text-xs font-medium text-ink-600 dark:text-ink-300"><IconFactory size={13} /> {u.producator}</span>}
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-ink-700 dark:text-ink-200">
                  {u.responsabil_nume && <span className="flex items-center gap-1 truncate"><IconUser size={13} /> {u.responsabil_nume}</span>}
                  {u.ore_contor > 0 && <span className="flex items-center gap-1 tabular"><IconClock size={13} /> {u.ore_contor?.toLocaleString('ro-RO')} ore</span>}
                  {u.chirie_zi && <span className="flex items-center gap-1 tabular"><IconMoney size={13} /> {u.chirie_zi} RON/zi</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Utilaj nou" size="xl">
        <UtilajForm categorii={categorii} persoane={persoane} locatii={locatii} onSave={handleCreate} onClose={() => setModalOpen(false)} />
      </Modal>
    </div>
  );
}
