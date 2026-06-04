import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useToast } from '../App';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';

const statusOptions = ['disponibil', 'service', 'indisponibil', 'casat'];
const proprietateOptions = ['propriu', 'inchiriat', 'leasing'];

function UtilajForm({ initial, categorii, persoane, locatii, onSave, onClose }) {
  const [form, setForm] = useState({
    denumire: '', alias: '', serie: '', nr_inventar: '', producator: '',
    categorie_id: '', status: 'disponibil', proprietate: 'propriu',
    responsabil_id: '', locatie_baza_id: '', data_achizitie: '',
    garantie_exp: '', chirie_zi: '', observatii: '',
    ...initial
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.denumire.trim()) return;
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Denumire *</label>
          <input required value={form.denumire} onChange={e => set('denumire', e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="ex: Excavator CAT 320" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Alias</label>
          <input value={form.alias} onChange={e => set('alias', e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="ex: EXC-01" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Serie</label>
          <input value={form.serie} onChange={e => set('serie', e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nr. Inventar</label>
          <input value={form.nr_inventar} onChange={e => set('nr_inventar', e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Producator</label>
          <input value={form.producator} onChange={e => set('producator', e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categorie</label>
          <select value={form.categorie_id} onChange={e => set('categorie_id', e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">-- Selecteaza --</option>
            {categorii.map(c => <option key={c.id} value={c.id}>{c.nume}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
          <select value={form.status} onChange={e => set('status', e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
            {statusOptions.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Proprietate</label>
          <select value={form.proprietate} onChange={e => set('proprietate', e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
            {proprietateOptions.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Responsabil</label>
          <select value={form.responsabil_id} onChange={e => set('responsabil_id', e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">-- Selecteaza --</option>
            {persoane.map(p => <option key={p.id} value={p.id}>{p.nume}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Locatie baza</label>
          <select value={form.locatie_baza_id} onChange={e => set('locatie_baza_id', e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">-- Selecteaza --</option>
            {locatii.map(l => <option key={l.id} value={l.id}>{l.nume}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data achizitie</label>
          <input type="date" value={form.data_achizitie} onChange={e => set('data_achizitie', e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Garantie expira</label>
          <input type="date" value={form.garantie_exp} onChange={e => set('garantie_exp', e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Chirie/zi (RON)</label>
          <input type="number" value={form.chirie_zi} onChange={e => set('chirie_zi', e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="0" />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observatii</label>
          <textarea value={form.observatii} onChange={e => set('observatii', e.target.value)} rows={2}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition-colors">
          Salveaza
        </button>
        <button type="button" onClick={onClose} className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 rounded-lg text-sm font-medium transition-colors">
          Anuleaza
        </button>
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
      setUtilaje(u);
      setCategorii(c);
      setPersoane(p);
      setLocatii(l);
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
      toast('Utilaj adaugat cu succes!');
      setModalOpen(false);
      loadAll();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const statusColors = { disponibil: 'border-l-green-500', service: 'border-l-yellow-500', indisponibil: 'border-l-red-500', casat: 'border-l-gray-400' };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="text"
            placeholder="Cauta utilaj..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none w-52"
          />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">Toate statusurile</option>
            {statusOptions.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <select value={filterCategorie} onChange={e => setFilterCategorie(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">Toate categoriile</option>
            {categorii.map(c => <option key={c.id} value={c.id}>{c.nume}</option>)}
          </select>
        </div>
        <button onClick={() => setModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
          + Utilaj nou
        </button>
      </div>

      {/* Grid utilaje */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : utilaje.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-2">🚜</p>
          <p>Niciun utilaj gasit</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {utilaje.map(u => (
            <div key={u.id}
              onClick={() => navigate(`/utilaje/${u.id}`)}
              className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 border-l-4 ${statusColors[u.status] || 'border-l-gray-300'} cursor-pointer hover:shadow-md transition-shadow overflow-hidden`}>
              {/* Poza principala */}
              <div className="h-40 bg-gray-100 dark:bg-gray-700 overflow-hidden">
                {u.thumbnail_url ? (
                  <img src={u.thumbnail_url} alt={u.denumire} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">{u.denumire}</h3>
                    {u.alias && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{u.alias}</p>}
                  </div>
                  <StatusBadge status={u.status} />
                </div>
                {u.categorie_nume && (
                  <span className="inline-block text-xs px-2 py-0.5 rounded-full font-medium mb-3"
                    style={{ backgroundColor: (u.categorie_culoare || '#5b8af0') + '20', color: u.categorie_culoare || '#5b8af0' }}>
                    {u.categorie_nume}
                  </span>
                )}
                <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                  {u.responsabil_nume && <p>👤 {u.responsabil_nume}</p>}
                  {u.ore_contor > 0 && <p>⏱ {u.ore_contor?.toLocaleString('ro-RO')} ore contor</p>}
                  {u.chirie_zi && <p>💰 {u.chirie_zi} RON/zi</p>}
                  {u.producator && <p>🏭 {u.producator}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Utilaj nou" size="lg">
        <UtilajForm
          categorii={categorii}
          persoane={persoane}
          locatii={locatii}
          onSave={handleCreate}
          onClose={() => setModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
