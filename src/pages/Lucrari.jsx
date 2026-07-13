import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useToast } from '../App';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import Select from '../components/Select';
import { IconPlus, IconEdit, IconTrash } from '../components/icons';

const TABS = ['Lucrari', 'Locatii', 'Categorii'];
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

function LucrariTab({ toast }) {
  const [lucrari, setLucrari] = useState([]);
  const [locatii, setLocatii] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nume: '', locatie_id: '', data_start: '', data_sfarsit: '', status: 'activa' });

  const load = async () => {
    setLoading(true);
    try {
      const params = filterStatus ? `?status=${filterStatus}` : '';
      const [l, loc] = await Promise.all([api.get('/lucrari' + params), api.get('/lucrari/locatii')]);
      setLucrari(l); setLocatii(loc);
    } catch (e) { toast('Eroare: ' + e.message, 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filterStatus]);

  const openNew = () => { setEditing(null); setForm({ nume: '', locatie_id: '', data_start: '', data_sfarsit: '', status: 'activa' }); setModalOpen(true); };
  const openEdit = (l) => { setEditing(l); setForm({ nume: l.nume, locatie_id: String(l.locatie_id || ''), data_start: l.data_start || '', data_sfarsit: l.data_sfarsit || '', status: l.status }); setModalOpen(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (form.data_start && form.data_sfarsit && form.data_sfarsit < form.data_start) {
      toast(`Data finalizarii nu poate fi anterioara datei de start (${form.data_start})`, 'error');
      return;
    }
    try {
      if (editing) { await api.put(`/lucrari/${editing.id}`, form); toast('Lucrare actualizata!'); }
      else { await api.post('/lucrari', form); toast('Lucrare adaugata!'); }
      setModalOpen(false); load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Stergi aceasta lucrare?')) return;
    try { await api.delete(`/lucrari/${id}`); toast('Lucrare stearsa!'); load(); }
    catch (e) { toast(e.message, 'error'); }
  };

  const inputCls = "field";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="w-44">
          <Select value={filterStatus} onChange={setFilterStatus} placeholder="Toate"
            options={[{ value: '', label: 'Toate' }, { value: 'activa', label: 'Active' }, { value: 'finalizata', label: 'Finalizate' }, { value: 'suspendata', label: 'Suspendate' }]} />
        </div>
        <button onClick={openNew} className="btn-primary"><IconPlus size={17} weight="bold" /> Lucrare noua</button>
      </div>
      {loading ? <div className="card h-64 animate-pulse" /> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-200/70 dark:border-ink-800">
                {['Denumire', 'Locatie', 'Data start', 'Data sfarsit', 'Status', ''].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 dark:divide-ink-700">
              {lucrari.map(l => (
                <tr key={l.id} className="hover:bg-ink-50 dark:hover:bg-ink-700/30">
                  <td className="px-4 py-3 font-medium text-ink-900 dark:text-white">{l.nume}</td>
                  <td className="px-4 py-3">{l.locatie_nume || '—'}</td>
                  <td className="px-4 py-3">{l.data_start || '—'}</td>
                  <td className="px-4 py-3">{l.data_sfarsit || '—'}</td>
                  <td className="px-4 py-3"><StatusBadge status={l.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(l)} className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-800" aria-label="Editeaza"><IconEdit size={16} /></button>
                      <button onClick={() => handleDelete(l.id)} className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10" aria-label="Sterge"><IconTrash size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {lucrari.length === 0 && <p className="text-center py-8 text-ink-400 text-sm">Nicio lucrare</p>}
          </div>
        </div>
      )}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editeaza lucrare' : 'Lucrare noua'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1">Denumire *</label>
            <input required value={form.nume} onChange={e => setForm(f => ({...f, nume: e.target.value}))} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1">Locatie</label>
            <Select value={form.locatie_id} onChange={v => setForm(f => ({...f, locatie_id: v}))} placeholder="Selecteaza locatie"
              options={[{ value: '', label: '—' }, ...locatii.map(l => ({ value: String(l.id), label: l.nume }))]} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1">Data start</label>
              <input type="date" value={form.data_start} onChange={e => setForm(f => ({...f, data_start: e.target.value}))} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1">Data sfarsit</label>
              <input type="date" min={form.data_start || undefined} value={form.data_sfarsit} onChange={e => setForm(f => ({...f, data_sfarsit: e.target.value}))} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1">Status</label>
            <Select value={form.status} onChange={v => setForm(f => ({...f, status: v}))}
              options={['activa','finalizata','suspendata'].map(s => ({ value: s, label: cap(s) }))} />
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

function LocatiiTab({ toast }) {
  const [locatii, setLocatii] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nume: '', adresa: '', lat: '', lng: '', tip: 'lucrare' });

  const load = async () => {
    setLoading(true);
    try { setLocatii(await api.get('/lucrari/locatii')); }
    catch (e) { toast('Eroare: ' + e.message, 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm({ nume: '', adresa: '', lat: '', lng: '', tip: 'lucrare' }); setModalOpen(true); };
  const openEdit = (l) => { setEditing(l); setForm({ nume: l.nume, adresa: l.adresa || '', lat: String(l.lat || ''), lng: String(l.lng || ''), tip: l.tip }); setModalOpen(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await api.put(`/lucrari/locatii/${editing.id}`, form); toast('Locatie actualizata!'); }
      else { await api.post('/lucrari/locatii', form); toast('Locatie adaugata!'); }
      setModalOpen(false); load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Stergi aceasta locatie?')) return;
    try { await api.delete(`/lucrari/locatii/${id}`); toast('Locatie stearsa!'); load(); }
    catch (e) { toast(e.message, 'error'); }
  };

  const inputCls = "field";

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={openNew} className="btn-primary"><IconPlus size={17} weight="bold" /> Locatie noua</button>
      </div>
      {loading ? <div className="card h-64 animate-pulse" /> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-200/70 dark:border-ink-800">
                {['Denumire', 'Adresa', 'Lat', 'Lng', 'Tip', ''].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 dark:divide-ink-700">
              {locatii.map(l => (
                <tr key={l.id} className="hover:bg-ink-50 dark:hover:bg-ink-700/30">
                  <td className="px-4 py-3 font-medium text-ink-900 dark:text-white">{l.nume}</td>
                  <td className="px-4 py-3">{l.adresa || '—'}</td>
                  <td className="px-4 py-3 text-xs text-ink-500">{l.lat || '—'}</td>
                  <td className="px-4 py-3 text-xs text-ink-500">{l.lng || '—'}</td>
                  <td className="px-4 py-3 capitalize">
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${l.tip === 'baza' ? 'bg-brand-100 text-brand-800 dark:bg-brand-900/30 dark:text-brand-300' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'}`}>
                      {l.tip}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(l)} className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-800" aria-label="Editeaza"><IconEdit size={16} /></button>
                      <button onClick={() => handleDelete(l.id)} className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10" aria-label="Sterge"><IconTrash size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {locatii.length === 0 && <p className="text-center py-8 text-ink-400 text-sm">Nicio locatie</p>}
          </div>
        </div>
      )}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editeaza locatie' : 'Locatie noua'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1">Denumire *</label>
            <input required value={form.nume} onChange={e => setForm(f => ({...f, nume: e.target.value}))} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1">Adresa</label>
            <input value={form.adresa} onChange={e => setForm(f => ({...f, adresa: e.target.value}))} className={inputCls} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1">Latitudine</label>
              <input type="number" step="0.0001" value={form.lat} onChange={e => setForm(f => ({...f, lat: e.target.value}))} className={inputCls} placeholder="ex: 46.7712" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1">Longitudine</label>
              <input type="number" step="0.0001" value={form.lng} onChange={e => setForm(f => ({...f, lng: e.target.value}))} className={inputCls} placeholder="ex: 23.6236" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1">Tip</label>
            <Select value={form.tip} onChange={v => setForm(f => ({...f, tip: v}))}
              options={[{ value: 'lucrare', label: 'Lucrare' }, { value: 'baza', label: 'Baza' }]} />
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

function CategoriiTab({ toast }) {
  const [categorii, setCategorii] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nume: '', culoare: '#5b8af0' });

  const load = async () => {
    setLoading(true);
    try { setCategorii(await api.get('/lucrari/categorii')); }
    catch (e) { toast('Eroare: ' + e.message, 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm({ nume: '', culoare: '#5b8af0' }); setModalOpen(true); };
  const openEdit = (c) => { setEditing(c); setForm({ nume: c.nume, culoare: c.culoare }); setModalOpen(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await api.put(`/lucrari/categorii/${editing.id}`, form); toast('Categorie actualizata!'); }
      else { await api.post('/lucrari/categorii', form); toast('Categorie adaugata!'); }
      setModalOpen(false); load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Stergi aceasta categorie?')) return;
    try { await api.delete(`/lucrari/categorii/${id}`); toast('Categorie stearsa!'); load(); }
    catch (e) { toast(e.message, 'error'); }
  };

  const inputCls = "field";

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={openNew} className="btn-primary"><IconPlus size={17} weight="bold" /> Categorie noua</button>
      </div>
      {loading ? <div className="card h-64 animate-pulse" /> : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-200/70 dark:border-ink-800">
                {['Culoare', 'Denumire', ''].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 dark:divide-ink-700">
              {categorii.map(c => (
                <tr key={c.id} className="hover:bg-ink-50 dark:hover:bg-ink-700/30">
                  <td className="px-4 py-3">
                    <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: c.culoare }}></div>
                  </td>
                  <td className="px-4 py-3 font-medium text-ink-900 dark:text-white">{c.nume}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(c)} className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-800" aria-label="Editeaza"><IconEdit size={16} /></button>
                      <button onClick={() => handleDelete(c.id)} className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10" aria-label="Sterge"><IconTrash size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {categorii.length === 0 && <p className="text-center py-8 text-ink-400 text-sm">Nicio categorie</p>}
        </div>
      )}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editeaza categorie' : 'Categorie noua'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1">Denumire *</label>
            <input required value={form.nume} onChange={e => setForm(f => ({...f, nume: e.target.value}))} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1">Culoare</label>
            <div className="flex items-center gap-3">
              <input type="color" value={form.culoare} onChange={e => setForm(f => ({...f, culoare: e.target.value}))}
                className="h-10 w-20 border border-ink-300 dark:border-ink-600 rounded-lg cursor-pointer" />
              <input value={form.culoare} onChange={e => setForm(f => ({...f, culoare: e.target.value}))} className={inputCls + ' flex-1'} placeholder="#5b8af0" />
            </div>
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

export default function Lucrari() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('Lucrari');

  return (
    <div className="space-y-5">
      <div className="border-b border-ink-200 dark:border-ink-700">
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
                activeTab === tab
                  ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-ink-500 dark:text-ink-400 hover:text-ink-700 dark:hover:text-ink-200'
              }`}>
              {tab}
            </button>
          ))}
        </div>
      </div>
      {activeTab === 'Lucrari' && <LucrariTab toast={toast} />}
      {activeTab === 'Locatii' && <LocatiiTab toast={toast} />}
      {activeTab === 'Categorii' && <CategoriiTab toast={toast} />}
    </div>
  );
}
