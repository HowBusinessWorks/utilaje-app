import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useToast } from '../App';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import UploadZone from '../components/UploadZone';
import SignaturePad from '../components/SignaturePad';

export default function ProceseVerbale() {
  const toast = useToast();
  const [pvp, setPvp] = useState([]);
  const [utilaje, setUtilaje] = useState([]);
  const [lucrari, setLucrari] = useState([]);
  const [persoane, setPersoane] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterUtilaj, setFilterUtilaj] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [tab, setTab] = useState('predare');
  const [pvPoze, setPvPoze] = useState([]);
  const [pendingPoze, setPendingPoze] = useState([]);
  const [pvAccesorii, setPvAccesorii] = useState([]);
  const [semnaturaPredare, setSemnaturaPredare] = useState('');
  const [semnaturaPrimire, setSemnaturaPrimire] = useState('');

  const [formPredare, setFormPredare] = useState({
    utilaj_id: '', lucrare_id: '', data_predare: new Date().toISOString().slice(0, 10),
    persoana_primire_text: '', responsabil_predare: '',
    ore_contor_predare: '', motorina_predare: '', stare_predare: 'buna', observatii_predare: ''
  });
  const [formPrimire, setFormPrimire] = useState({
    data_primire: new Date().toISOString().slice(0, 10),
    responsabil_primire: '', ore_contor_primire: '', motorina_primire: '',
    stare_primire: 'buna', observatii_primire: '', probleme_constatate: ''
  });

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set('status', filterStatus);
      if (filterUtilaj) params.set('utilaj_id', filterUtilaj);
      const [p, u, l, per] = await Promise.all([
        api.get('/pvp' + (params.toString() ? '?' + params : '')),
        api.get('/utilaje'),
        api.get('/lucrari'),
        api.get('/persoane'),
      ]);
      setPvp(p); setUtilaje(u); setLucrari(l); setPersoane(per);
    } catch (e) {
      toast('Eroare: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filterStatus, filterUtilaj]);

  // Load accesorii when utilaj changes (for new PV)
  useEffect(() => {
    if (!modalOpen || editing || !formPredare.utilaj_id) {
      if (!editing) setPvAccesorii([]);
      return;
    }
    api.get(`/utilaje/${formPredare.utilaj_id}/accesorii`)
      .then(acc => setPvAccesorii(acc.map(a => ({ id: null, denumire: a.denumire, predat: false, primit: false }))))
      .catch(() => setPvAccesorii([]));
  }, [formPredare.utilaj_id, modalOpen, editing]);

  const openNew = () => {
    setEditing(null);
    setTab('predare');
    setPvPoze([]);
    setPendingPoze([]);
    setPvAccesorii([]);
    setSemnaturaPredare('');
    setSemnaturaPrimire('');
    setFormPredare({ utilaj_id: '', lucrare_id: '', data_predare: new Date().toISOString().slice(0, 10), persoana_primire_text: '', responsabil_predare: '', ore_contor_predare: '', motorina_predare: '', stare_predare: 'buna', observatii_predare: '' });
    setModalOpen(true);
  };

  const openEdit = (pv) => {
    setEditing(pv);
    setTab(pv.status === 'deschis' ? 'primire' : 'predare');
    setPvPoze([]);
    setPendingPoze([]);
    setPvAccesorii([]);
    setSemnaturaPredare(pv.semnatura_predare || '');
    setSemnaturaPrimire(pv.semnatura_primire || '');
    api.get(`/pvp/${pv.id}`).then(detail => {
      setPvPoze(detail.poze || []);
      setPvAccesorii(detail.accesorii || []);
      setSemnaturaPredare(detail.semnatura_predare || '');
      setSemnaturaPrimire(detail.semnatura_primire || '');
    }).catch(() => {});
    setFormPredare({
      utilaj_id: String(pv.utilaj_id),
      lucrare_id: String(pv.lucrare_id || ''),
      data_predare: pv.data_predare || '',
      persoana_primire_text: pv.persoana_primire_display || pv.persoana_primire_text || '',
      responsabil_predare: pv.responsabil_predare || '',
      ore_contor_predare: String(pv.ore_contor_predare || ''),
      motorina_predare: String(pv.motorina_predare || ''),
      stare_predare: pv.stare_predare || 'buna',
      observatii_predare: pv.observatii_predare || ''
    });
    setFormPrimire({
      data_primire: pv.data_primire || new Date().toISOString().slice(0, 10),
      responsabil_primire: pv.responsabil_primire || '',
      ore_contor_primire: String(pv.ore_contor_primire || ''),
      motorina_primire: String(pv.motorina_primire || ''),
      stare_primire: pv.stare_primire || 'buna',
      observatii_primire: pv.observatii_primire || '',
      probleme_constatate: pv.probleme_constatate || ''
    });
    setModalOpen(true);
  };

  const handleSavePredare = async (e) => {
    e.preventDefault();
    try {
      if (editing) { toast('Datele de predare nu pot fi editate', 'warning'); return; }
      const result = await api.post('/pvp', {
        ...formPredare,
        accesorii: pvAccesorii,
        semnatura_predare: semnaturaPredare
      });
      for (const { file, etapa } of pendingPoze) {
        const fd = new FormData();
        fd.append('poza', file);
        fd.append('etapa', etapa);
        await api.upload(`/pvp/${result.id}/poze`, fd);
      }
      toast('Proces verbal creat!');
      setModalOpen(false);
      setPendingPoze([]);
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const handleSavePrimire = async (e) => {
    e.preventDefault();
    if (!editing) return;
    try {
      await api.patch(`/pvp/${editing.id}/primire`, {
        ...formPrimire,
        accesorii_primire: pvAccesorii,
        semnatura_primire: semnaturaPrimire
      });
      toast('PV inchis cu succes!');
      setModalOpen(false);
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const handleUploadPvPoza = async (file, etapa) => {
    if (!editing) return;
    const fd = new FormData();
    fd.append('poza', file);
    fd.append('etapa', etapa);
    try {
      const result = await api.upload(`/pvp/${editing.id}/poze`, fd);
      setPvPoze(prev => [...prev, { id: result.id, url: result.url, etapa }]);
      toast('Poza adaugata!');
    } catch (e) { toast(e.message, 'error'); }
  };

  const handleDeletePvPoza = async (pozaId) => {
    if (!editing) return;
    try {
      await api.delete(`/pvp/${editing.id}/poze/${pozaId}`);
      setPvPoze(prev => prev.filter(p => p.id !== pozaId));
    } catch (e) { toast(e.message, 'error'); }
  };

  const addPendingPoza = (file, etapa) => {
    setPendingPoze(prev => [...prev, { file, etapa, localId: Date.now() + Math.random() }]);
  };

  const handleDelete = async (id) => {
    if (!confirm('Stergi procesul verbal?')) return;
    try {
      await api.delete(`/pvp/${id}`);
      toast('PV sters!');
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const inputCls = "w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none";
  const stariOptions = ['buna', 'acceptabila', 'deteriorata'];

  const PozaGrid = ({ poze, onDelete }) => poze.length > 0 ? (
    <div className="grid grid-cols-4 gap-2 mb-3">
      {poze.map((item) => (
        <div key={item.id} className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <img src={item.url ?? URL.createObjectURL(item.file)} alt="" className="w-full h-20 object-cover" />
          <button type="button" onClick={() => onDelete(item.id)}
            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
        </div>
      ))}
    </div>
  ) : null;

  const AccesoriiChecklist = ({ etapa }) => {
    if (pvAccesorii.length === 0) return (
      <p className="text-xs text-gray-400 italic">Niciun accesoriu definit pe acest utilaj</p>
    );
    return (
      <div className="space-y-2">
        {pvAccesorii.map((acc, idx) => (
          <label key={acc.id ?? idx} className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={etapa === 'predare' ? !!acc.predat : !!acc.primit}
              onChange={(e) => {
                setPvAccesorii(prev => prev.map((a, i) => i === idx
                  ? { ...a, [etapa === 'predare' ? 'predat' : 'primit']: e.target.checked }
                  : a
                ));
              }}
              disabled={etapa === 'primire' && !acc.predat}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className={`text-sm ${etapa === 'primire' && !acc.predat ? 'text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
              {acc.denumire}
              {etapa === 'primire' && !acc.predat && <span className="ml-1 text-xs text-gray-400">(nepredat)</span>}
            </span>
          </label>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">Toate statusurile</option>
            <option value="deschis">Deschis</option>
            <option value="inchis">Inchis</option>
          </select>
          <select value={filterUtilaj} onChange={e => setFilterUtilaj(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">Toate utilajele</option>
            {utilaje.map(u => <option key={u.id} value={u.id}>{u.alias || u.denumire}</option>)}
          </select>
        </div>
        <button onClick={openNew} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          + Proces verbal nou
        </button>
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
                  {['Utilaj', 'Lucrare', 'Data predare', 'Responsabil predare', 'Stare', 'Status', 'Data primire', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-gray-600 dark:text-gray-300 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {pvp.map(pv => (
                  <tr key={pv.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 ${pv.status === 'deschis' ? 'bg-yellow-50/50 dark:bg-yellow-900/10' : ''}`}>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white whitespace-nowrap">{pv.utilaj_alias || pv.utilaj_denumire}</td>
                    <td className="px-4 py-3">{pv.lucrare_nume || '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{pv.data_predare || '—'}</td>
                    <td className="px-4 py-3">{pv.responsabil_predare || '—'}</td>
                    <td className="px-4 py-3 capitalize">{pv.stare_predare || '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={pv.status} /></td>
                    <td className="px-4 py-3 whitespace-nowrap">{pv.data_primire || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(pv)} className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-600 dark:text-gray-300 whitespace-nowrap">
                          {pv.status === 'deschis' ? 'Inchide' : 'Detalii'}
                        </button>
                        <button onClick={() => handleDelete(pv.id)} className="text-xs px-2 py-1 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 rounded text-red-600 dark:text-red-400">✕</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pvp.length === 0 && <p className="text-center py-8 text-gray-400 text-sm">Niciun proces verbal</p>}
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? `PV #${editing.id} — ${editing.utilaj_alias || editing.utilaj_denumire}` : 'Proces verbal nou'}
        size="lg">
        {/* Tabs */}
        <div className="flex gap-1 mb-5 border-b border-gray-200 dark:border-gray-700">
          <button onClick={() => setTab('predare')}
            className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 transition-colors ${tab === 'predare' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-gray-400'}`}>
            Predare
          </button>
          {editing && editing.status === 'deschis' && (
            <button onClick={() => setTab('primire')}
              className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 transition-colors ${tab === 'primire' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-gray-400'}`}>
              Primire (Inchidere)
            </button>
          )}
        </div>

        {/* Tab Predare */}
        {tab === 'predare' && (
          <form onSubmit={handleSavePredare} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Utilaj *</label>
                <select required value={formPredare.utilaj_id} onChange={e => setFormPredare(f => ({...f, utilaj_id: e.target.value}))} className={inputCls} disabled={!!editing}>
                  <option value="">-- Selecteaza --</option>
                  {utilaje.map(u => <option key={u.id} value={u.id}>{u.alias || u.denumire}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lucrare</label>
                <select value={formPredare.lucrare_id} onChange={e => setFormPredare(f => ({...f, lucrare_id: e.target.value}))} className={inputCls} disabled={!!editing}>
                  <option value="">-- Selecteaza --</option>
                  {lucrari.map(l => <option key={l.id} value={l.id}>{l.nume}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data predare</label>
                <input type="date" value={formPredare.data_predare} onChange={e => setFormPredare(f => ({...f, data_predare: e.target.value}))} className={inputCls} disabled={!!editing} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Persoana primire</label>
                <input value={formPredare.persoana_primire_text} onChange={e => setFormPredare(f => ({...f, persoana_primire_text: e.target.value}))} className={inputCls} placeholder="Nume persoana" disabled={!!editing} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Responsabil predare</label>
                <select value={formPredare.responsabil_predare} onChange={e => setFormPredare(f => ({...f, responsabil_predare: e.target.value}))} className={inputCls} disabled={!!editing}>
                  <option value="">-- Selecteaza --</option>
                  {persoane.map(p => <option key={p.id} value={p.nume}>{p.nume}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ore contor predare</label>
                <input type="number" value={formPredare.ore_contor_predare} onChange={e => setFormPredare(f => ({...f, ore_contor_predare: e.target.value}))} className={inputCls} disabled={!!editing} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Motorina predare (%)</label>
                <div className="relative">
                  <input type="number" min="0" max="100" value={formPredare.motorina_predare} onChange={e => setFormPredare(f => ({...f, motorina_predare: e.target.value}))} className={inputCls + ' pr-8'} placeholder="0" disabled={!!editing} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">%</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stare la predare</label>
                <select value={formPredare.stare_predare} onChange={e => setFormPredare(f => ({...f, stare_predare: e.target.value}))} className={inputCls} disabled={!!editing}>
                  {stariOptions.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observatii predare</label>
                <textarea value={formPredare.observatii_predare} onChange={e => setFormPredare(f => ({...f, observatii_predare: e.target.value}))} className={inputCls + ' resize-none'} rows={2} disabled={!!editing} />
              </div>
            </div>

            {/* Accesorii */}
            {(pvAccesorii.length > 0 || !editing) && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Accesorii predate</p>
                <AccesoriiChecklist etapa="predare" />
              </div>
            )}

            {/* Poze predare */}
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Poze predare</p>
              {editing ? (
                <>
                  <PozaGrid poze={pvPoze.filter(p => p.etapa === 'predare')} onDelete={handleDeletePvPoza} />
                  <UploadZone onUpload={(file) => handleUploadPvPoza(file, 'predare')} label="Adauga poze predare" />
                </>
              ) : (
                <>
                  <PozaGrid
                    poze={pendingPoze.filter(p => p.etapa === 'predare').map(p => ({ id: p.localId, file: p.file }))}
                    onDelete={(localId) => setPendingPoze(prev => prev.filter(p => p.localId !== localId))}
                  />
                  <UploadZone onUpload={(file) => addPendingPoza(file, 'predare')} label="Adauga poze predare" />
                </>
              )}
            </div>

            {/* Semnatura predare */}
            <SignaturePad
              label="Semnatura responsabil predare"
              value={semnaturaPredare}
              onChange={setSemnaturaPredare}
              disabled={!!editing}
            />

            {!editing && (
              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium">Creeaza PV</button>
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg text-sm font-medium">Anuleaza</button>
              </div>
            )}
            {editing && (
              <p className="text-xs text-gray-400 text-center">Datele de predare sunt doar pentru vizualizare. Folositi tab-ul Primire pentru inchidere PV.</p>
            )}
          </form>
        )}

        {/* Tab Primire */}
        {tab === 'primire' && editing && editing.status === 'deschis' && (
          <form onSubmit={handleSavePrimire} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data primire *</label>
                <input type="date" required value={formPrimire.data_primire} onChange={e => setFormPrimire(f => ({...f, data_primire: e.target.value}))} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Responsabil primire</label>
                <input value={formPrimire.responsabil_primire} onChange={e => setFormPrimire(f => ({...f, responsabil_primire: e.target.value}))} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ore contor primire</label>
                <input type="number" value={formPrimire.ore_contor_primire} onChange={e => setFormPrimire(f => ({...f, ore_contor_primire: e.target.value}))} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Motorina primire (%)</label>
                <div className="relative">
                  <input type="number" min="0" max="100" value={formPrimire.motorina_primire} onChange={e => setFormPrimire(f => ({...f, motorina_primire: e.target.value}))} className={inputCls + ' pr-8'} placeholder="0" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">%</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stare la primire</label>
                <select value={formPrimire.stare_primire} onChange={e => setFormPrimire(f => ({...f, stare_primire: e.target.value}))} className={inputCls}>
                  {stariOptions.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Probleme constatate</label>
                <textarea value={formPrimire.probleme_constatate} onChange={e => setFormPrimire(f => ({...f, probleme_constatate: e.target.value}))} className={inputCls + ' resize-none'} rows={2} />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observatii primire</label>
                <textarea value={formPrimire.observatii_primire} onChange={e => setFormPrimire(f => ({...f, observatii_primire: e.target.value}))} className={inputCls + ' resize-none'} rows={2} />
              </div>
            </div>

            {/* Accesorii primire */}
            {pvAccesorii.length > 0 && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Accesorii primite inapoi</p>
                <AccesoriiChecklist etapa="primire" />
              </div>
            )}

            {/* Poze primire */}
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Poze primire</p>
              <PozaGrid poze={pvPoze.filter(p => p.etapa === 'primire')} onDelete={handleDeletePvPoza} />
              <UploadZone onUpload={(file) => handleUploadPvPoza(file, 'primire')} label="Adauga poze primire" />
            </div>

            {/* Semnatura primire */}
            <SignaturePad
              label="Semnatura responsabil primire"
              value={semnaturaPrimire}
              onChange={setSemnaturaPrimire}
            />

            <div className="flex gap-3">
              <button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium">Inchide PV</button>
              <button type="button" onClick={() => setModalOpen(false)} className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg text-sm font-medium">Anuleaza</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
