import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useToast } from '../App';
import Modal from '../components/Modal';

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
  const [form, setForm] = useState({
    utilaj_id: '', data_reparatie: new Date().toISOString().slice(0, 10),
    furnizor: '', descriere: '', cost_total: '', ore_contor: '', durata_zile: '', observatii: ''
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
    setForm({ utilaj_id: '', data_reparatie: new Date().toISOString().slice(0, 10), furnizor: '', descriere: '', cost_total: '', ore_contor: '', durata_zile: '', observatii: '' });
    setModalOpen(true);
  };

  const openEdit = (r) => {
    setEditing(r);
    setForm({
      utilaj_id: String(r.utilaj_id),
      data_reparatie: r.data_reparatie,
      furnizor: r.furnizor,
      descriere: r.descriere,
      cost_total: String(r.cost_total),
      ore_contor: String(r.ore_contor || ''),
      durata_zile: String(r.durata_zile || ''),
      observatii: r.observatii || ''
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/reparatii/${editing.id}`, form);
        toast('Reparatie actualizata!');
      } else {
        await api.post('/reparatii', form);
        toast('Reparatie adaugata!');
      }
      setModalOpen(false);
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Stergi aceasta reparatie?')) return;
    try {
      await api.delete(`/reparatii/${id}`);
      toast('Reparatie stearsa!');
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const handleUploadFactura = async (reparatieId, file) => {
    const fd = new FormData();
    fd.append('factura', file);
    try {
      await api.upload(`/reparatii/${reparatieId}/factura`, fd);
      toast('Factura incarcata!');
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const totalCost = reparatii.reduce((s, r) => s + (r.cost_total || 0), 0);

  const inputCls = "w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none";

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <select value={filterUtilaj} onChange={e => setFilterUtilaj(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">Toate utilajele</option>
            {utilaje.map(u => <option key={u.id} value={u.id}>{u.alias || u.denumire}</option>)}
          </select>
          <input type="date" value={filterStart} onChange={e => setFilterStart(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
          <input type="date" value={filterEnd} onChange={e => setFilterEnd(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
          {(filterUtilaj || filterStart || filterEnd) && (
            <button onClick={() => { setFilterUtilaj(''); setFilterStart(''); setFilterEnd(''); }}
              className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-2 py-1">
              ✕ Sterge
            </button>
          )}
        </div>
        <button onClick={openNew} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          + Reparatie noua
        </button>
      </div>

      {/* Total */}
      <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 flex items-center gap-6">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Total costuri filtrate</p>
          <p className="text-2xl font-bold text-red-700 dark:text-red-300">{totalCost.toLocaleString('ro-RO')} RON</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Numar reparatii</p>
          <p className="text-2xl font-bold text-red-700 dark:text-red-300">{reparatii.length}</p>
        </div>
      </div>

      {/* Tabel */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  {['Data', 'Utilaj', 'Furnizor', 'Descriere', 'Cost (RON)', 'Durata', 'Ore contor', 'Factura', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-gray-600 dark:text-gray-300 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {reparatii.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3 whitespace-nowrap">{r.data_reparatie}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white whitespace-nowrap">{r.utilaj_alias || r.utilaj_denumire}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{r.furnizor}</td>
                    <td className="px-4 py-3 max-w-xs truncate">{r.descriere}</td>
                    <td className="px-4 py-3 font-bold text-red-600 dark:text-red-400 whitespace-nowrap">{r.cost_total?.toLocaleString('ro-RO')}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{r.durata_zile ? r.durata_zile + ' zile' : '—'}</td>
                    <td className="px-4 py-3">{r.ore_contor || '—'}</td>
                    <td className="px-4 py-3">
                      {r.factura_url ? (
                        <a href={r.factura_url} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 text-xs hover:underline">
                          Descarca
                        </a>
                      ) : (
                        <label className="cursor-pointer text-xs text-gray-500 hover:text-blue-500">
                          📎 Upload
                          <input type="file" className="hidden" onChange={e => e.target.files[0] && handleUploadFactura(r.id, e.target.files[0])} />
                        </label>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(r)} className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-600 dark:text-gray-300">Edit</button>
                        <button onClick={() => handleDelete(r.id)} className="text-xs px-2 py-1 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 rounded text-red-600 dark:text-red-400">✕</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {reparatii.length === 0 && <p className="text-center py-8 text-gray-400 text-sm">Nicio reparatie</p>}
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editeaza reparatie' : 'Reparatie noua'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Utilaj *</label>
              <select required value={form.utilaj_id} onChange={e => setForm(f => ({...f, utilaj_id: e.target.value}))} className={inputCls}>
                <option value="">-- Selecteaza --</option>
                {utilaje.map(u => <option key={u.id} value={u.id}>{u.alias || u.denumire}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data reparatie *</label>
              <input type="date" required value={form.data_reparatie} onChange={e => setForm(f => ({...f, data_reparatie: e.target.value}))} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Furnizor *</label>
              <input required value={form.furnizor} onChange={e => setForm(f => ({...f, furnizor: e.target.value}))} className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descriere *</label>
              <input required value={form.descriere} onChange={e => setForm(f => ({...f, descriere: e.target.value}))} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cost total (RON) *</label>
              <input type="number" step="0.01" required value={form.cost_total} onChange={e => setForm(f => ({...f, cost_total: e.target.value}))} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Durata (zile)</label>
              <input type="number" value={form.durata_zile} onChange={e => setForm(f => ({...f, durata_zile: e.target.value}))} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ore contor</label>
              <input type="number" value={form.ore_contor} onChange={e => setForm(f => ({...f, ore_contor: e.target.value}))} className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observatii</label>
              <textarea value={form.observatii} onChange={e => setForm(f => ({...f, observatii: e.target.value}))} className={inputCls + ' resize-none'} rows={2} />
            </div>
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
