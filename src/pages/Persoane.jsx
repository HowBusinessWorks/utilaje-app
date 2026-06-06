import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useToast } from '../App';
import Modal from '../components/Modal';

export default function Persoane() {
  const toast = useToast();
  const [persoane, setPersoane] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('angajat');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nume: '', telefon: '', categorie: 'angajat' });

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
    (p.nume.toLowerCase().includes(search.toLowerCase()) ||
      (p.telefon || '').includes(search))
  );

  const openNew = () => {
    setEditing(null);
    setForm({ nume: '', telefon: '', categorie: activeTab });
    setModalOpen(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({ nume: p.nume, telefon: p.telefon || '', categorie: p.categorie });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/persoane/${editing.id}`, form);
        toast('Persoana actualizata!');
      } else {
        await api.post('/persoane', form);
        toast('Persoana adaugata!');
      }
      setModalOpen(false);
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Stergi aceasta persoana?')) return;
    try {
      await api.delete(`/persoane/${id}`);
      toast('Persoana stearsa!');
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const inputCls = "w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none";

  const angajatiCount = persoane.filter(p => p.categorie === 'angajat').length;
  const subcontractantiCount = persoane.filter(p => p.categorie === 'subcontractant').length;

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-1">
          {[
            { key: 'angajat', label: `Angajati (${angajatiCount})` },
            { key: 'subcontractant', label: `Subcontractanti (${subcontractantiCount})` },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <input
          type="text"
          placeholder="Cauta dupa nume sau telefon..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-64"
        />
        <button onClick={openNew} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          + Persoana noua
        </button>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-3xl mb-2">👥</p>
          <p>Nicio persoana gasita</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map(p => (
            <div key={p.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg shrink-0">
                {p.nume.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white truncate">{p.nume}</p>
                {p.telefon && <p className="text-sm text-gray-500 dark:text-gray-400">{p.telefon}</p>}
                <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium mt-1 ${
                  p.categorie === 'angajat' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                }`}>
                  {p.categorie === 'angajat' ? 'Angajat' : 'Subcontractant'}
                </span>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => openEdit(p)} className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-600 dark:text-gray-300">Edit</button>
                <button onClick={() => handleDelete(p.id)} className="text-xs px-2 py-1 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 rounded text-red-600 dark:text-red-400">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editeaza persoana' : 'Persoana noua'} size="sm">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nume *</label>
            <input required value={form.nume} onChange={e => setForm(f => ({...f, nume: e.target.value}))} className={inputCls} placeholder="ex: Ion Popescu" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telefon</label>
            <input value={form.telefon} onChange={e => setForm(f => ({...f, telefon: e.target.value}))} className={inputCls} placeholder="ex: 0740 123 456" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categorie *</label>
            <select value={form.categorie} onChange={e => setForm(f => ({...f, categorie: e.target.value}))} className={inputCls}>
              <option value="angajat">Angajat</option>
              <option value="subcontractant">Subcontractant</option>
            </select>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium">Salveaza</button>
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg text-sm font-medium">Anuleaza</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
