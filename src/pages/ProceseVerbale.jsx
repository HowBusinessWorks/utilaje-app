import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useToast } from '../App';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import UploadZone from '../components/UploadZone';
import SignaturePad from '../components/SignaturePad';
import Select from '../components/Select';
import { IconPlus, IconPrinter, IconTrash, IconClose } from '../components/icons';

const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

export default function ProceseVerbale() {
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();
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
    persoana_primire_text: '', responsabil_predare: '', subcontractant_id: '', sef_santier_id: '',
    ore_contor_predare: '', motorina_predare: '', stare_predare: 'buna', observatii_predare: ''
  });
  const [formPrimire, setFormPrimire] = useState({
    data_primire: new Date().toISOString().slice(0, 10),
    responsabil_primire: '', ore_contor_primire: '', motorina_primire: '',
    stare_primire: 'buna', observatii_primire: ''
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

  useEffect(() => {
    const fromPlan = location.state?.fromPlan;
    if (!fromPlan || loading) return;
    setEditing(null);
    setTab('predare');
    setPvPoze([]);
    setPendingPoze([]);
    setPvAccesorii([]);
    setSemnaturaPredare('');
    setSemnaturaPrimire('');
    setFormPredare(f => ({
      ...f,
      utilaj_id: String(fromPlan.utilaj_id || ''),
      lucrare_id: String(fromPlan.lucrare_id || ''),
      data_predare: fromPlan.data_predare || new Date().toISOString().slice(0, 10),
      responsabil_predare: fromPlan.responsabil_predare || '',
    }));
    setModalOpen(true);
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.state, loading]);

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
    setFormPredare({ utilaj_id: '', lucrare_id: '', data_predare: new Date().toISOString().slice(0, 10), persoana_primire_text: '', responsabil_predare: '', subcontractant_id: '', sef_santier_id: '', ore_contor_predare: '', motorina_predare: '', stare_predare: 'buna', observatii_predare: '' });
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
      subcontractant_id: String(pv.subcontractant_id || ''),
      sef_santier_id: String(pv.sef_santier_id || ''),
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
      observatii_primire: pv.observatii_primire || ''
    });
    setModalOpen(true);
  };

  const handleSavePredare = async (e) => {
    e.preventDefault();
    try {
      if (editing) { toast('Datele de predare nu pot fi editate', 'warning'); return; }
      if (!formPredare.sef_santier_id && !formPredare.subcontractant_id) {
        toast('Trebuie selectat cel putin un Sef de santier sau un Subcontractant', 'error');
        return;
      }
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
    if (editing.data_predare && formPrimire.data_primire < editing.data_predare) {
      toast(`Data primirii nu poate fi anterioara datei de predare (${editing.data_predare})`, 'error');
      return;
    }
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

  const inputCls = "field";
  const stariOptions = ['buna', 'acceptabila', 'deteriorata'];
  const stariSelectOptions = stariOptions.map(s => ({ value: s, label: cap(s) }));
  const isReadOnly = !!(editing && editing.status === 'inchis');

  const PozaGrid = ({ poze, onDelete }) => poze.length > 0 ? (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
      {poze.map((item) => (
        <div key={item.id} className="relative group rounded-lg overflow-hidden border border-ink-200 dark:border-ink-700">
          <img src={item.url ?? URL.createObjectURL(item.file)} alt="" className="w-full h-20 object-cover" />
          {onDelete && <button type="button" onClick={() => onDelete(item.id)}
            className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-rose-500 text-white opacity-0 transition-opacity group-hover:opacity-100"><IconClose size={12} weight="bold" /></button>}
        </div>
      ))}
    </div>
  ) : null;

  const AccesoriiChecklist = ({ etapa }) => {
    if (pvAccesorii.length === 0) return (
      <p className="text-xs text-ink-400 italic">Niciun accesoriu definit pe acest utilaj</p>
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
              disabled={isReadOnly || (etapa === 'primire' && !acc.predat)}
              className="w-4 h-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
            />
            <span className={`text-sm ${etapa === 'primire' && !acc.predat ? 'text-ink-400' : 'text-ink-700 dark:text-ink-300'}`}>
              {acc.denumire}
              {etapa === 'primire' && !acc.predat && <span className="ml-1 text-xs text-ink-400">(nepredat)</span>}
            </span>
          </label>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <div className="w-44">
            <Select value={filterStatus} onChange={setFilterStatus} placeholder="Toate statusurile"
              options={[{ value: '', label: 'Toate statusurile' }, { value: 'deschis', label: 'Deschis' }, { value: 'inchis', label: 'Inchis' }]} />
          </div>
          <div className="w-48">
            <Select value={filterUtilaj} onChange={setFilterUtilaj} placeholder="Toate utilajele"
              options={[{ value: '', label: 'Toate utilajele' }, ...utilaje.map(u => ({ value: String(u.id), label: u.denumire }))]} />
          </div>
        </div>
        <button onClick={openNew} className="btn-primary">
          <IconPlus size={17} weight="bold" /> Proces verbal nou
        </button>
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
                  {['Utilaj', 'Lucrare', 'Data predare', 'Responsabil predare', 'Stare', 'Status', 'Data primire', ''].map(h => (
                    <th key={h} className="whitespace-nowrap px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                {pvp.map(pv => (
                  <tr key={pv.id} className={`transition-colors hover:bg-ink-50/70 dark:hover:bg-ink-800/40 ${pv.status === 'deschis' ? 'bg-amber-50/40 dark:bg-amber-500/[0.04]' : ''}`}>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-ink-900 dark:text-white">{pv.utilaj_denumire}</td>
                    <td className="px-4 py-3 text-ink-600 dark:text-ink-300">{pv.lucrare_nume || '—'}</td>
                    <td className="whitespace-nowrap px-4 py-3 tabular text-ink-600 dark:text-ink-300">{pv.data_predare || '—'}</td>
                    <td className="px-4 py-3 text-ink-600 dark:text-ink-300">{pv.responsabil_predare || '—'}</td>
                    <td className="px-4 py-3 capitalize text-ink-600 dark:text-ink-300">{pv.stare_predare || '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={pv.status} /></td>
                    <td className="whitespace-nowrap px-4 py-3 tabular text-ink-600 dark:text-ink-300">{pv.data_primire || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(pv)} className="whitespace-nowrap rounded-lg border border-ink-200 px-2.5 py-1 text-xs font-medium text-ink-600 transition-colors hover:bg-ink-100 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800">
                          {pv.status === 'deschis' ? 'Inchide' : 'Detalii'}
                        </button>
                        <button onClick={() => window.open(`/procese-verbale/${pv.id}/print`, '_blank')}
                          className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/10" title="Printeaza / vizualizeaza A4">
                          <IconPrinter size={16} />
                        </button>
                        <button onClick={() => handleDelete(pv.id)} className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10" aria-label="Sterge"><IconTrash size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pvp.length === 0 && <p className="py-12 text-center text-sm text-ink-400">Niciun proces verbal</p>}
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? `PV #${editing.id} — ${editing.utilaj_denumire}` : 'Proces verbal nou'}
        size="lg">
        {/* Tabs */}
        <div className="flex gap-1 mb-5 border-b border-ink-200 dark:border-ink-700">
          <button onClick={() => setTab('predare')}
            className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 transition-colors ${tab === 'predare' ? 'border-brand-500 text-brand-600 dark:text-brand-400' : 'border-transparent text-ink-500 dark:text-ink-400'}`}>
            Predare
          </button>
          {editing && (
            <button onClick={() => setTab('primire')}
              className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 transition-colors ${tab === 'primire' ? 'border-brand-500 text-brand-600 dark:text-brand-400' : 'border-transparent text-ink-500 dark:text-ink-400'}`}>
              {editing.status === 'deschis' ? 'Primire (Inchidere)' : 'Primire'}
            </button>
          )}
        </div>

        {/* Tab Predare */}
        {tab === 'predare' && (
          <form onSubmit={handleSavePredare} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1">Utilaj *</label>
                <Select value={formPredare.utilaj_id} onChange={v => setFormPredare(f => ({...f, utilaj_id: v}))} placeholder="Selecteaza utilaj" disabled={!!editing}
                  options={utilaje.map(u => ({ value: String(u.id), label: u.denumire }))} />
                {!editing && formPredare.utilaj_id && (() => {
                  const openForThisUtilaj = pvp.find(p => String(p.utilaj_id) === String(formPredare.utilaj_id) && p.status === 'deschis');
                  if (!openForThisUtilaj) return null;
                  return (
                    <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 font-medium">
                      Acest utilaj are deja un PV deschis (predat pe {openForThisUtilaj.data_predare}). Inchide-l inainte de a crea unul nou.{' '}
                      <button type="button" onClick={() => openEdit(openForThisUtilaj)}
                        className="underline underline-offset-2 hover:text-red-700 dark:hover:text-red-300">
                        Deschide PV-ul existent
                      </button>
                    </p>
                  );
                })()}
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1">Lucrare</label>
                <Select value={formPredare.lucrare_id} onChange={v => setFormPredare(f => ({...f, lucrare_id: v}))} placeholder="Selecteaza lucrare" disabled={!!editing}
                  options={[{ value: '', label: 'Fara lucrare' }, ...lucrari.map(l => ({ value: String(l.id), label: l.nume }))]} />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1">Data predare</label>
                <input type="date" value={formPredare.data_predare} onChange={e => setFormPredare(f => ({...f, data_predare: e.target.value}))} className={inputCls} disabled={!!editing} />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1">Persoana primire</label>
                <input value={formPredare.persoana_primire_text} onChange={e => setFormPredare(f => ({...f, persoana_primire_text: e.target.value}))} className={inputCls} placeholder="Nume persoana" disabled={!!editing} />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1">Responsabil utilaj *</label>
                <Select value={formPredare.responsabil_predare} onChange={v => setFormPredare(f => ({...f, responsabil_predare: v}))} placeholder="Selecteaza persoana" disabled={!!editing}
                  options={persoane.map(p => ({ value: p.nume, label: p.nume }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1">
                  Sef de santier <span className="text-ink-400 font-normal">(cel putin unul)</span>
                </label>
                <Select value={formPredare.sef_santier_id} onChange={v => setFormPredare(f => ({...f, sef_santier_id: v}))} placeholder="Selecteaza sef santier" disabled={!!editing}
                  options={[{ value: '', label: '—' }, ...persoane.filter(p => p.categorie === 'sef_santier').map(p => ({ value: String(p.id), label: p.nume }))]} />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1">
                  Subcontractant <span className="text-ink-400 font-normal">(cel putin unul)</span>
                </label>
                <Select value={formPredare.subcontractant_id} onChange={v => setFormPredare(f => ({...f, subcontractant_id: v}))} placeholder="Selecteaza subcontractant" disabled={!!editing}
                  options={[{ value: '', label: '—' }, ...persoane.filter(p => p.categorie === 'subcontractant').map(p => ({ value: String(p.id), label: p.nume }))]} />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1">Ore contor predare</label>
                <input type="number" value={formPredare.ore_contor_predare} onChange={e => setFormPredare(f => ({...f, ore_contor_predare: e.target.value}))} className={inputCls} disabled={!!editing} />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1">Motorina predare (%)</label>
                <div className="relative">
                  <input type="number" min="0" max="100" value={formPredare.motorina_predare} onChange={e => setFormPredare(f => ({...f, motorina_predare: String(Math.min(100, Math.max(0, Number(e.target.value))))}))} className={inputCls + ' pr-8'} placeholder="0" disabled={!!editing} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink-400">%</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1">Stare la predare</label>
                <Select value={formPredare.stare_predare} onChange={v => setFormPredare(f => ({...f, stare_predare: v}))} disabled={!!editing} options={stariSelectOptions} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1">Observatii predare</label>
                <textarea value={formPredare.observatii_predare} onChange={e => setFormPredare(f => ({...f, observatii_predare: e.target.value}))} className={inputCls + ' resize-none'} rows={2} disabled={!!editing} />
              </div>
            </div>

            {/* Accesorii */}
            {(pvAccesorii.length > 0 || !editing) && (
              <div className="border border-ink-200 dark:border-ink-700 rounded-lg p-4">
                <p className="text-sm font-medium text-ink-700 dark:text-ink-300 mb-3">Accesorii predate</p>
                <AccesoriiChecklist etapa="predare" />
              </div>
            )}

            {/* Poze predare */}
            <div>
              <p className="text-sm font-medium text-ink-700 dark:text-ink-300 mb-2">Poze predare</p>
              {editing ? (
                <>
                  <PozaGrid poze={pvPoze.filter(p => p.etapa === 'predare')} onDelete={isReadOnly ? null : handleDeletePvPoza} />
                  {!isReadOnly && <UploadZone onUpload={(file) => handleUploadPvPoza(file, 'predare')} label="Adauga poze predare" />}
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
                <button type="submit" className="flex-1 bg-brand-600 hover:bg-brand-700 text-white py-2 rounded-lg text-sm font-medium">Creeaza PV</button>
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 bg-ink-100 dark:bg-ink-700 text-ink-700 dark:text-ink-300 py-2 rounded-lg text-sm font-medium">Anuleaza</button>
              </div>
            )}
            {editing && (
              <p className="text-xs text-ink-400 text-center">Datele de predare sunt doar pentru vizualizare. Folositi tab-ul Primire pentru inchidere PV.</p>
            )}
          </form>
        )}

        {/* Tab Primire */}
        {tab === 'primire' && editing && (
          <form onSubmit={handleSavePrimire} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1">Data primire *</label>
                <input type="date" required min={editing?.data_predare || undefined} value={formPrimire.data_primire} onChange={e => setFormPrimire(f => ({...f, data_primire: e.target.value}))} className={inputCls} disabled={isReadOnly} />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1">Responsabil primire</label>
                <input value={formPrimire.responsabil_primire} onChange={e => setFormPrimire(f => ({...f, responsabil_primire: e.target.value}))} className={inputCls} disabled={isReadOnly} />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1">Ore contor primire</label>
                <input type="number" value={formPrimire.ore_contor_primire} onChange={e => setFormPrimire(f => ({...f, ore_contor_primire: e.target.value}))} className={inputCls} disabled={isReadOnly} />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1">Motorina primire (%)</label>
                <div className="relative">
                  <input type="number" min="0" max="100" value={formPrimire.motorina_primire} onChange={e => setFormPrimire(f => ({...f, motorina_primire: String(Math.min(100, Math.max(0, Number(e.target.value))))}))} className={inputCls + ' pr-8'} placeholder="0" disabled={isReadOnly} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink-400">%</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1">Stare la primire</label>
                <Select value={formPrimire.stare_primire} onChange={v => setFormPrimire(f => ({...f, stare_primire: v}))} disabled={isReadOnly} options={stariSelectOptions} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1">Observatii primire</label>
                <textarea value={formPrimire.observatii_primire} onChange={e => setFormPrimire(f => ({...f, observatii_primire: e.target.value}))} className={inputCls + ' resize-none'} rows={2} disabled={isReadOnly} />
              </div>
            </div>

            {/* Accesorii primire */}
            {pvAccesorii.length > 0 && (
              <div className="border border-ink-200 dark:border-ink-700 rounded-lg p-4">
                <p className="text-sm font-medium text-ink-700 dark:text-ink-300 mb-3">Accesorii primite inapoi</p>
                <AccesoriiChecklist etapa="primire" />
              </div>
            )}

            {/* Poze primire */}
            <div>
              <p className="text-sm font-medium text-ink-700 dark:text-ink-300 mb-2">Poze primire</p>
              <PozaGrid poze={pvPoze.filter(p => p.etapa === 'primire')} onDelete={isReadOnly ? null : handleDeletePvPoza} />
              {!isReadOnly && <UploadZone onUpload={(file) => handleUploadPvPoza(file, 'primire')} label="Adauga poze primire" />}
            </div>

            {/* Semnatura primire */}
            <SignaturePad
              label="Semnatura responsabil primire"
              value={semnaturaPrimire}
              onChange={setSemnaturaPrimire}
              disabled={isReadOnly}
            />

            {!isReadOnly && (
              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium">Inchide PV</button>
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 bg-ink-100 dark:bg-ink-700 text-ink-700 dark:text-ink-300 py-2 rounded-lg text-sm font-medium">Anuleaza</button>
              </div>
            )}
          </form>
        )}
      </Modal>
    </div>
  );
}
