import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { useToast } from '../App';
import Modal from '../components/Modal';

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
    nr_litri: '', furnizor: '', ore_contor: '', observatii: ''
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
    setForm({ utilaj_id: '', lucrare_id: '', persoana_id: '', data_consum: new Date().toISOString().slice(0, 10), nr_litri: '', furnizor: '', ore_contor: '', observatii: '' });
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
      observatii: fisa.observatii || ''
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
        toast('Fisa actualizata!');
      } else {
        const result = await api.post('/motorina', form);
        id = result.id;
        toast('Fisa adaugata!');
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
      toast('Document sters!');
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Stergi aceasta fisa?')) return;
    try {
      await api.delete(`/motorina/${id}`);
      toast('Fisa stearsa!');
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const totalLitri = fise.reduce((s, f) => s + (f.nr_litri || 0), 0);

  const inputCls = "w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none";

  const docName = (url) => url ? url.split('/').pop() : '';

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <select value={filterUtilaj} onChange={e => setFilterUtilaj(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">Toate utilajele</option>
            {utilaje.map(u => <option key={u.id} value={u.id}>{u.alias || u.denumire}</option>)}
          </select>
          <select value={filterLucrare} onChange={e => setFilterLucrare(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">Toate lucrarile</option>
            {lucrari.map(l => <option key={l.id} value={l.id}>{l.nume}</option>)}
          </select>
          <input type="date" value={filterStart} onChange={e => setFilterStart(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Data start" />
          <input type="date" value={filterEnd} onChange={e => setFilterEnd(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Data sfarsit" />
          {(filterUtilaj || filterLucrare || filterStart || filterEnd) && (
            <button onClick={() => { setFilterUtilaj(''); setFilterLucrare(''); setFilterStart(''); setFilterEnd(''); }}
              className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-2 py-1">
              ✕ Sterge filtre
            </button>
          )}
        </div>
        <button onClick={openNew} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          + Fisa noua
        </button>
      </div>

      {/* Total */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 flex items-center gap-3">
        <span className="text-2xl">⛽</span>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Total consum filtrat</p>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{totalLitri.toLocaleString('ro-RO')} L</p>
        </div>
        <div className="ml-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">Numar fise</p>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{fise.length}</p>
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
                  {['Data', 'Utilaj', 'Litri', 'Furnizor', 'Lucrare', 'Operator', 'Ore contor', 'Document', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-gray-600 dark:text-gray-300 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {fise.map(f => (
                  <tr key={f.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3 whitespace-nowrap">{f.data_consum}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                      {f.utilaj_alias || f.utilaj_denumire}
                    </td>
                    <td className="px-4 py-3 font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">{f.nr_litri} L</td>
                    <td className="px-4 py-3">{f.furnizor || '—'}</td>
                    <td className="px-4 py-3">{f.lucrare_nume || '—'}</td>
                    <td className="px-4 py-3">{f.persoana_nume || '—'}</td>
                    <td className="px-4 py-3">{f.ore_contor || '—'}</td>
                    <td className="px-4 py-3">
                      {f.document_url ? (
                        <div className="flex items-center gap-1">
                          <a href={f.document_url} target="_blank" rel="noreferrer"
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline max-w-[120px] truncate block">
                            {docName(f.document_url)}
                          </a>
                          <button onClick={() => handleDeleteDoc(f.id)} className="text-red-400 hover:text-red-600 text-xs ml-1">✕</button>
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(f)} className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-600 dark:text-gray-300">Edit</button>
                        <button onClick={() => handleDelete(f.id)} className="text-xs px-2 py-1 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 rounded text-red-600 dark:text-red-400">✕</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {fise.length === 0 && <p className="text-center py-8 text-gray-400 text-sm">Nicio fisa motorina</p>}
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editeaza fisa motorina' : 'Fisa motorina noua'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Utilaj *</label>
              <select required value={form.utilaj_id} onChange={e => setForm(f => ({...f, utilaj_id: e.target.value}))} className={inputCls}>
                <option value="">-- Selecteaza --</option>
                {utilaje.map(u => <option key={u.id} value={u.id}>{u.alias || u.denumire}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data consum *</label>
              <input type="date" required value={form.data_consum} onChange={e => setForm(f => ({...f, data_consum: e.target.value}))} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nr. litri *</label>
              <input type="number" step="0.1" required value={form.nr_litri} onChange={e => setForm(f => ({...f, nr_litri: e.target.value}))} className={inputCls} placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Furnizor</label>
              <input value={form.furnizor} onChange={e => setForm(f => ({...f, furnizor: e.target.value}))} className={inputCls} placeholder="ex: Rompetrol" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ore contor</label>
              <input type="number" value={form.ore_contor} onChange={e => setForm(f => ({...f, ore_contor: e.target.value}))} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lucrare</label>
              <select value={form.lucrare_id} onChange={e => setForm(f => ({...f, lucrare_id: e.target.value}))} className={inputCls}>
                <option value="">-- Selecteaza --</option>
                {lucrari.map(l => <option key={l.id} value={l.id}>{l.nume}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Operator</label>
              <select value={form.persoana_id} onChange={e => setForm(f => ({...f, persoana_id: e.target.value}))} className={inputCls}>
                <option value="">-- Selecteaza --</option>
                {persoane.map(p => <option key={p.id} value={p.id}>{p.nume}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observatii</label>
              <input value={form.observatii} onChange={e => setForm(f => ({...f, observatii: e.target.value}))} className={inputCls} />
            </div>
          </div>

          {/* Document */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Document (factura, bon etc.)</label>
            {editing && editing.document_url && !pendingDoc && (
              <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg mb-2 text-sm">
                <span className="text-gray-500">📄</span>
                <a href={editing.document_url} target="_blank" rel="noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline truncate flex-1">
                  {docName(editing.document_url)}
                </a>
                <button type="button" onClick={() => setPendingDoc('__remove__')} className="text-red-400 hover:text-red-600 text-xs">✕ Sterge</button>
              </div>
            )}
            {pendingDoc && pendingDoc !== '__remove__' && (
              <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-2 text-sm">
                <span className="text-blue-500">📄</span>
                <span className="text-blue-700 dark:text-blue-300 truncate flex-1">{pendingDoc.name}</span>
                <button type="button" onClick={() => setPendingDoc(null)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
              </div>
            )}
            <input ref={fileRef} type="file" className="hidden" onChange={e => { if (e.target.files[0]) setPendingDoc(e.target.files[0]); e.target.value = ''; }} />
            <button type="button" onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-sm text-gray-500 dark:text-gray-400 hover:border-blue-400 dark:hover:border-blue-500 transition-colors text-center">
              📎 Click pentru a atasa un document
            </button>
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
