import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useToast } from '../App';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import UploadZone from '../components/UploadZone';
import SignaturePad from '../components/SignaturePad';

const TABS = ['Detalii', 'Accesorii', 'Motorina', 'Reparatii', 'Planificari', 'Procese Verbale', 'Poze'];

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{value || '—'}</p>
    </div>
  );
}

export default function UtilajDetaliu() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [utilaj, setUtilaj] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Detalii');
  const [motorina, setMotorina] = useState([]);
  const [reparatii, setReparatii] = useState([]);
  const [planificari, setPlanificari] = useState([]);
  const [pvp, setPvp] = useState([]);
  const [editOpen, setEditOpen] = useState(false);
  const [categorii, setCategorii] = useState([]);
  const [persoane, setPersoane] = useState([]);
  const [locatii, setLocatii] = useState([]);
  const [lucrari, setLucrari] = useState([]);
  const [addMotorinaOpen, setAddMotorinaOpen] = useState(false);
  const [addReparatieOpen, setAddReparatieOpen] = useState(false);
  const [addPlanificare, setAddPlanificare] = useState(false);
  const [pvModalOpen, setPvModalOpen] = useState(false);
  const [pvTab, setPvTab] = useState('predare');
  const [pvEditing, setPvEditing] = useState(null);
  const [pvPoze, setPvPoze] = useState([]);
  const [pvPendingPoze, setPvPendingPoze] = useState([]);
  const [pvAccesorii, setPvAccesorii] = useState([]);
  const [semnaturaPredare, setSemnaturaPredare] = useState('');
  const [semnaturaPrimire, setSemnaturaPrimire] = useState('');
  const [pvFormPredare, setPvFormPredare] = useState({ lucrare_id: '', data_predare: new Date().toISOString().slice(0,10), persoana_primire_text: '', responsabil_predare: '', ore_contor_predare: '', motorina_predare: '', stare_predare: 'buna', observatii_predare: '' });
  const [pvFormPrimire, setPvFormPrimire] = useState({ data_primire: new Date().toISOString().slice(0,10), responsabil_primire: '', ore_contor_primire: '', motorina_primire: '', stare_primire: 'buna', observatii_primire: '', probleme_constatate: '' });
  const [accesorii, setAccesorii] = useState([]);
  const [accesorieText, setAccesorieText] = useState('');
  const [motPendingDoc, setMotPendingDoc] = useState(null);
  const motFileRef = useRef(null);
  const [motForm, setMotForm] = useState({ data_consum: new Date().toISOString().slice(0,10), nr_litri: '', furnizor: '', lucrare_id: '', persoana_id: '', ore_contor: '', observatii: '' });
  const [repForm, setRepForm] = useState({ data_reparatie: new Date().toISOString().slice(0,10), furnizor: '', descriere: '', cost_total: '', ore_contor: '', durata_zile: '', observatii: '' });
  const [planForm, setPlanForm] = useState({ data_start: new Date().toISOString().slice(0,10), data_sfarsit: new Date().toISOString().slice(0,10), lucrare_id: '', persoana_id: '', observatii: '' });

  const load = async () => {
    setLoading(true);
    try {
      const u = await api.get(`/utilaje/${id}`);
      setUtilaj(u);
      const [m, r, p, pv, c, per, l, luc, acc] = await Promise.all([
        api.get(`/motorina?utilaj_id=${id}`),
        api.get(`/reparatii?utilaj_id=${id}`),
        api.get(`/planificari?utilaj_id=${id}`),
        api.get(`/pvp?utilaj_id=${id}`),
        api.get('/lucrari/categorii'),
        api.get('/persoane'),
        api.get('/lucrari/locatii'),
        api.get('/lucrari'),
        api.get(`/utilaje/${id}/accesorii`),
      ]);
      setMotorina(m); setReparatii(r); setPlanificari(p); setPvp(pv);
      setCategorii(c); setPersoane(per); setLocatii(l); setLucrari(luc);
      setAccesorii(acc);
    } catch (e) {
      toast('Eroare: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleEditSave = async (form) => {
    try {
      await api.put(`/utilaje/${id}`, form);
      toast('Utilaj actualizat!');
      setEditOpen(false);
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const handleAddMotorina = async (e) => {
    e.preventDefault();
    try {
      const result = await api.post('/motorina', { ...motForm, utilaj_id: id });
      if (motPendingDoc) {
        const fd = new FormData();
        fd.append('document', motPendingDoc);
        await api.upload(`/motorina/${result.id}/document`, fd);
      }
      toast('Fisa motorina adaugata!');
      setAddMotorinaOpen(false);
      setMotPendingDoc(null);
      setMotForm({ data_consum: new Date().toISOString().slice(0,10), nr_litri: '', furnizor: '', lucrare_id: '', persoana_id: '', ore_contor: '', observatii: '' });
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const handleAddReparatie = async (e) => {
    e.preventDefault();
    try {
      await api.post('/reparatii', { ...repForm, utilaj_id: id });
      toast('Reparatie adaugata!');
      setAddReparatieOpen(false);
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const handleAddPlanificare = async (e) => {
    e.preventDefault();
    try {
      await api.post('/planificari', { ...planForm, utilaj_id: id });
      toast('Planificare adaugata!');
      setAddPlanificare(false);
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const openNewPv = () => {
    setPvEditing(null);
    setPvTab('predare');
    setPvPoze([]);
    setPvPendingPoze([]);
    setPvAccesorii(accesorii.map(a => ({ id: null, denumire: a.denumire, predat: false, primit: false })));
    setSemnaturaPredare('');
    setSemnaturaPrimire('');
    setPvFormPredare({ lucrare_id: '', data_predare: new Date().toISOString().slice(0,10), persoana_primire_text: '', responsabil_predare: '', ore_contor_predare: '', motorina_predare: '', stare_predare: 'buna', observatii_predare: '' });
    setPvFormPrimire({ data_primire: new Date().toISOString().slice(0,10), responsabil_primire: '', ore_contor_primire: '', motorina_primire: '', stare_primire: 'buna', observatii_primire: '', probleme_constatate: '' });
    setPvModalOpen(true);
  };

  const openEditPv = (pv) => {
    setPvEditing(pv);
    setPvTab(pv.status === 'deschis' ? 'primire' : 'predare');
    setPvPoze([]);
    setPvPendingPoze([]);
    setPvAccesorii([]);
    setSemnaturaPredare('');
    setSemnaturaPrimire('');
    api.get(`/pvp/${pv.id}`).then(detail => {
      setPvPoze(detail.poze || []);
      setPvAccesorii(detail.accesorii || []);
      setSemnaturaPredare(detail.semnatura_predare || '');
      setSemnaturaPrimire(detail.semnatura_primire || '');
    }).catch(() => {});
    setPvFormPredare({
      lucrare_id: String(pv.lucrare_id || ''),
      data_predare: pv.data_predare || '',
      persoana_primire_text: pv.persoana_primire_display || pv.persoana_primire_text || '',
      responsabil_predare: pv.responsabil_predare || '',
      ore_contor_predare: String(pv.ore_contor_predare || ''),
      motorina_predare: String(pv.motorina_predare || ''),
      stare_predare: pv.stare_predare || 'buna',
      observatii_predare: pv.observatii_predare || ''
    });
    setPvFormPrimire({
      data_primire: pv.data_primire || new Date().toISOString().slice(0,10),
      responsabil_primire: pv.responsabil_primire || '',
      ore_contor_primire: String(pv.ore_contor_primire || ''),
      motorina_primire: String(pv.motorina_primire || ''),
      stare_primire: pv.stare_primire || 'buna',
      observatii_primire: pv.observatii_primire || '',
      probleme_constatate: pv.probleme_constatate || ''
    });
    setPvModalOpen(true);
  };

  const handleSavePvPredare = async (e) => {
    e.preventDefault();
    try {
      const result = await api.post('/pvp', {
        ...pvFormPredare,
        utilaj_id: id,
        accesorii: pvAccesorii,
        semnatura_predare: semnaturaPredare
      });
      for (const { file, etapa } of pvPendingPoze) {
        const fd = new FormData();
        fd.append('poza', file);
        fd.append('etapa', etapa);
        await api.upload(`/pvp/${result.id}/poze`, fd);
      }
      toast('Proces verbal creat!');
      setPvModalOpen(false);
      setPvPendingPoze([]);
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const handleSavePvPrimire = async (e) => {
    e.preventDefault();
    if (!pvEditing) return;
    try {
      await api.patch(`/pvp/${pvEditing.id}/primire`, {
        ...pvFormPrimire,
        accesorii_primire: pvAccesorii,
        semnatura_primire: semnaturaPrimire
      });
      toast('PV inchis cu succes!');
      setPvModalOpen(false);
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const handleAddAccesorie = async (e) => {
    e.preventDefault();
    if (!accesorieText.trim()) return;
    try {
      const result = await api.post(`/utilaje/${id}/accesorii`, { denumire: accesorieText.trim() });
      setAccesorii(prev => [...prev, result]);
      setAccesorieText('');
    } catch (e) { toast(e.message, 'error'); }
  };

  const handleDeleteAccesorie = async (accId) => {
    try {
      await api.delete(`/utilaje/${id}/accesorii/${accId}`);
      setAccesorii(prev => prev.filter(a => a.id !== accId));
    } catch (e) { toast(e.message, 'error'); }
  };

  const handleDeletePv = async (pvId) => {
    if (!confirm('Stergi procesul verbal?')) return;
    try {
      await api.delete(`/pvp/${pvId}`);
      toast('PV sters!');
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const handleUploadPvPoza = async (file, etapa) => {
    if (!pvEditing) return;
    const fd = new FormData();
    fd.append('poza', file);
    fd.append('etapa', etapa);
    try {
      const result = await api.upload(`/pvp/${pvEditing.id}/poze`, fd);
      setPvPoze(prev => [...prev, { id: result.id, url: result.url, etapa }]);
      toast('Poza adaugata!');
    } catch (e) { toast(e.message, 'error'); }
  };

  const handleDeletePvPoza = async (pozaId) => {
    if (!pvEditing) return;
    try {
      await api.delete(`/pvp/${pvEditing.id}/poze/${pozaId}`);
      setPvPoze(prev => prev.filter(p => p.id !== pozaId));
      toast('Poza stearsa!');
    } catch (e) { toast(e.message, 'error'); }
  };

  const handleUploadPoza = async (file) => {
    const fd = new FormData();
    fd.append('poza', file);
    try {
      await api.upload(`/utilaje/${id}/poze`, fd);
      toast('Poza incarcata!');
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const handleDeletePoza = async (pozaId) => {
    if (!confirm('Stergi poza?')) return;
    try {
      await api.delete(`/utilaje/${id}/poze/${pozaId}`);
      toast('Poza stearsa!');
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
    </div>
  );
  if (!utilaj) return <div className="text-red-500 p-4">Utilaj negasit</div>;

  const inputCls = "w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none";
  const selCls = inputCls;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start gap-3">
        <button onClick={() => navigate('/utilaje')} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 shrink-0">
          ← Inapoi
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white truncate">{utilaj.denumire}</h2>
            {utilaj.alias && <span className="text-gray-500 dark:text-gray-400 text-sm shrink-0">({utilaj.alias})</span>}
            <StatusBadge status={utilaj.status} size="md" />
          </div>
          {utilaj.categorie_nume && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block"
              style={{ backgroundColor: (utilaj.categorie_culoare || '#5b8af0') + '20', color: utilaj.categorie_culoare || '#5b8af0' }}>
              {utilaj.categorie_nume}
            </span>
          )}
        </div>
        <button onClick={() => setEditOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0">
          Editeaza
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'Detalii' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            <Field label="Denumire" value={utilaj.denumire} />
            <Field label="Alias" value={utilaj.alias} />
            <Field label="Serie" value={utilaj.serie} />
            <Field label="Nr. Inventar" value={utilaj.nr_inventar} />
            <Field label="Producator" value={utilaj.producator} />
            <Field label="Proprietate" value={utilaj.proprietate} />
            <Field label="Status" value={utilaj.status} />
            <Field label="Categorie" value={utilaj.categorie_nume} />
            <Field label="Responsabil" value={utilaj.responsabil_nume} />
            <Field label="Locatie baza" value={utilaj.locatie_baza_nume} />
            <Field label="Data achizitie" value={utilaj.data_achizitie} />
            <Field label="Garantie expira" value={utilaj.garantie_exp} />
            <Field label="Ore contor" value={utilaj.ore_contor?.toLocaleString('ro-RO') + ' ore'} />
            <Field label="Chirie/zi" value={utilaj.chirie_zi ? utilaj.chirie_zi + ' RON' : null} />
            {utilaj.observatii && (
              <div className="col-span-2 md:col-span-3 lg:col-span-4">
                <Field label="Observatii" value={utilaj.observatii} />
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'Accesorii' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
          <p className="font-medium text-gray-900 dark:text-white">Accesorii utilaj</p>
          <form onSubmit={handleAddAccesorie} className="flex gap-2">
            <input
              value={accesorieText}
              onChange={e => setAccesorieText(e.target.value)}
              placeholder="ex: Cupa 1m, Scarificator, Lampa…"
              className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">+ Adauga</button>
          </form>
          {accesorii.length === 0 ? (
            <p className="text-sm text-gray-400 italic">Niciun accesoriu adaugat. Accesoriile definite aici vor aparea ca checklist pe procesele verbale.</p>
          ) : (
            <ul className="space-y-2">
              {accesorii.map(a => (
                <li key={a.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm">
                  <span className="text-gray-800 dark:text-gray-200">{a.denumire}</span>
                  <button onClick={() => handleDeleteAccesorie(a.id)} className="text-red-400 hover:text-red-600 text-xs ml-3">✕ Sterge</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {activeTab === 'Motorina' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <p className="font-medium text-gray-900 dark:text-white">Fise motorina ({motorina.length})</p>
            <button onClick={() => setAddMotorinaOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium">
              + Adauga
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  {['Data', 'Litri', 'Furnizor', 'Lucrare', 'Ore contor', 'Observatii'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-gray-600 dark:text-gray-300 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {motorina.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3">{m.data_consum}</td>
                    <td className="px-4 py-3 font-medium text-blue-600 dark:text-blue-400">{m.nr_litri} L</td>
                    <td className="px-4 py-3">{m.furnizor || '—'}</td>
                    <td className="px-4 py-3">{m.lucrare_nume || '—'}</td>
                    <td className="px-4 py-3">{m.ore_contor || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{m.observatii || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {motorina.length === 0 && <p className="text-center py-8 text-gray-400 text-sm">Nicio fisa motorina</p>}
          </div>
        </div>
      )}

      {activeTab === 'Reparatii' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <p className="font-medium text-gray-900 dark:text-white">Reparatii ({reparatii.length})</p>
            <button onClick={() => setAddReparatieOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium">
              + Adauga
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  {['Data', 'Furnizor', 'Descriere', 'Cost', 'Durata', 'Ore contor'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-gray-600 dark:text-gray-300 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {reparatii.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3">{r.data_reparatie}</td>
                    <td className="px-4 py-3">{r.furnizor}</td>
                    <td className="px-4 py-3 max-w-xs truncate">{r.descriere}</td>
                    <td className="px-4 py-3 font-medium text-red-600 dark:text-red-400">{r.cost_total?.toLocaleString('ro-RO')} RON</td>
                    <td className="px-4 py-3">{r.durata_zile ? r.durata_zile + ' zile' : '—'}</td>
                    <td className="px-4 py-3">{r.ore_contor || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {reparatii.length === 0 && <p className="text-center py-8 text-gray-400 text-sm">Nicio reparatie</p>}
          </div>
        </div>
      )}

      {activeTab === 'Planificari' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <p className="font-medium text-gray-900 dark:text-white">Planificari ({planificari.length})</p>
            <button onClick={() => setAddPlanificare(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium">
              + Adauga
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  {['Lucrare', 'Persoana', 'Data start', 'Data sfarsit', 'Observatii'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-gray-600 dark:text-gray-300 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {planificari.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3">{p.lucrare_nume || '—'}</td>
                    <td className="px-4 py-3">{p.persoana_nume || '—'}</td>
                    <td className="px-4 py-3">{p.data_start}</td>
                    <td className="px-4 py-3">{p.data_sfarsit}</td>
                    <td className="px-4 py-3 text-gray-500">{p.observatii || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {planificari.length === 0 && <p className="text-center py-8 text-gray-400 text-sm">Nicio planificare</p>}
          </div>
        </div>
      )}

      {activeTab === 'Procese Verbale' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <p className="font-medium text-gray-900 dark:text-white">Procese Verbale ({pvp.length})</p>
            <button onClick={openNewPv} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium">
              + Adauga PV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  {['Lucrare', 'Data predare', 'Responsabil predare', 'Status', 'Data primire', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-gray-600 dark:text-gray-300 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {pvp.map(pv => (
                  <tr key={pv.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 ${pv.status === 'deschis' ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}`}>
                    <td className="px-4 py-3">{pv.lucrare_nume || '—'}</td>
                    <td className="px-4 py-3">{pv.data_predare || '—'}</td>
                    <td className="px-4 py-3">{pv.responsabil_predare || '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={pv.status} /></td>
                    <td className="px-4 py-3">{pv.data_primire || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEditPv(pv)} className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-600 dark:text-gray-300 whitespace-nowrap">
                          {pv.status === 'deschis' ? 'Inchide' : 'Detalii'}
                        </button>
                        <button onClick={() => handleDeletePv(pv.id)} className="text-xs px-2 py-1 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 rounded text-red-600 dark:text-red-400">✕</button>
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

      {activeTab === 'Poze' && (
        <div className="space-y-4">
          <UploadZone onUpload={handleUploadPoza} label="Adauga poze utilaj" />
          {utilaj.poze && utilaj.poze.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {utilaj.poze.map(poza => (
                <div key={poza.id} className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                  <img src={poza.url} alt="Poza utilaj" className="w-full h-32 object-cover" />
                  {poza.is_primary === 1 && (
                    <span className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded">Principal</span>
                  )}
                  <button onClick={() => handleDeletePoza(poza.id)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    ✕
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-gray-400 text-sm">Nicio poza</p>
          )}
        </div>
      )}

      {/* Modal editare */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Editeaza utilaj" size="lg">
        <form onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const obj = Object.fromEntries(fd);
          await handleEditSave(obj);
        }} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { name: 'denumire', label: 'Denumire *', required: true, defaultValue: utilaj.denumire },
              { name: 'alias', label: 'Alias', defaultValue: utilaj.alias },
              { name: 'serie', label: 'Serie', defaultValue: utilaj.serie },
              { name: 'nr_inventar', label: 'Nr. Inventar', defaultValue: utilaj.nr_inventar },
              { name: 'producator', label: 'Producator', defaultValue: utilaj.producator },
            ].map(f => (
              <div key={f.name} className={f.name === 'denumire' ? 'sm:col-span-2' : ''}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{f.label}</label>
                <input name={f.name} required={f.required} defaultValue={f.defaultValue || ''} className={inputCls} />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select name="status" defaultValue={utilaj.status} className={selCls}>
                {['disponibil','service','indisponibil','casat'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Proprietate</label>
              <select name="proprietate" defaultValue={utilaj.proprietate} className={selCls}>
                {['propriu','inchiriat','leasing'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Responsabil</label>
              <select name="responsabil_id" defaultValue={utilaj.responsabil_id || ''} className={selCls}>
                <option value="">-- Selecteaza --</option>
                {persoane.map(p => <option key={p.id} value={p.id}>{p.nume}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categorie</label>
              <select name="categorie_id" defaultValue={utilaj.categorie_id || ''} className={selCls}>
                <option value="">-- Selecteaza --</option>
                {categorii.map(c => <option key={c.id} value={c.id}>{c.nume}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ore contor</label>
              <input name="ore_contor" type="number" defaultValue={utilaj.ore_contor || 0} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Chirie/zi (RON)</label>
              <input name="chirie_zi" type="number" defaultValue={utilaj.chirie_zi || ''} className={inputCls} />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium">Salveaza</button>
            <button type="button" onClick={() => setEditOpen(false)} className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg text-sm font-medium">Anuleaza</button>
          </div>
        </form>
      </Modal>

      {/* Modal adauga motorina */}
      <Modal isOpen={addMotorinaOpen} onClose={() => setAddMotorinaOpen(false)} title="Adauga fisa motorina">
        <form onSubmit={handleAddMotorina} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data *</label>
              <input type="date" required value={motForm.data_consum} onChange={e => setMotForm(f => ({...f, data_consum: e.target.value}))} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Litri *</label>
              <input type="number" required value={motForm.nr_litri} onChange={e => setMotForm(f => ({...f, nr_litri: e.target.value}))} className={inputCls} placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Furnizor</label>
              <input value={motForm.furnizor} onChange={e => setMotForm(f => ({...f, furnizor: e.target.value}))} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ore contor</label>
              <input type="number" value={motForm.ore_contor} onChange={e => setMotForm(f => ({...f, ore_contor: e.target.value}))} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lucrare</label>
              <select value={motForm.lucrare_id} onChange={e => setMotForm(f => ({...f, lucrare_id: e.target.value}))} className={selCls}>
                <option value="">-- Selecteaza --</option>
                {lucrari.map(l => <option key={l.id} value={l.id}>{l.nume}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Persoana</label>
              <select value={motForm.persoana_id} onChange={e => setMotForm(f => ({...f, persoana_id: e.target.value}))} className={selCls}>
                <option value="">-- Selecteaza --</option>
                {persoane.map(p => <option key={p.id} value={p.id}>{p.nume}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Document (factura, bon etc.)</label>
            {motPendingDoc && (
              <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-2 text-sm">
                <span className="text-blue-500">📄</span>
                <span className="text-blue-700 dark:text-blue-300 truncate flex-1">{motPendingDoc.name}</span>
                <button type="button" onClick={() => setMotPendingDoc(null)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
              </div>
            )}
            <input ref={motFileRef} type="file" className="hidden" onChange={e => { if (e.target.files[0]) setMotPendingDoc(e.target.files[0]); e.target.value = ''; }} />
            <button type="button" onClick={() => motFileRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-sm text-gray-500 dark:text-gray-400 hover:border-blue-400 dark:hover:border-blue-500 transition-colors text-center">
              📎 Click pentru a atasa un document
            </button>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium">Salveaza</button>
            <button type="button" onClick={() => setAddMotorinaOpen(false)} className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg text-sm font-medium">Anuleaza</button>
          </div>
        </form>
      </Modal>

      {/* Modal adauga reparatie */}
      <Modal isOpen={addReparatieOpen} onClose={() => setAddReparatieOpen(false)} title="Adauga reparatie">
        <form onSubmit={handleAddReparatie} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data *</label>
              <input type="date" required value={repForm.data_reparatie} onChange={e => setRepForm(f => ({...f, data_reparatie: e.target.value}))} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Furnizor *</label>
              <input required value={repForm.furnizor} onChange={e => setRepForm(f => ({...f, furnizor: e.target.value}))} className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descriere *</label>
              <input required value={repForm.descriere} onChange={e => setRepForm(f => ({...f, descriere: e.target.value}))} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cost total (RON) *</label>
              <input type="number" required value={repForm.cost_total} onChange={e => setRepForm(f => ({...f, cost_total: e.target.value}))} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Durata (zile)</label>
              <input type="number" value={repForm.durata_zile} onChange={e => setRepForm(f => ({...f, durata_zile: e.target.value}))} className={inputCls} />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium">Salveaza</button>
            <button type="button" onClick={() => setAddReparatieOpen(false)} className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg text-sm font-medium">Anuleaza</button>
          </div>
        </form>
      </Modal>

      {/* Modal proces verbal */}
      <Modal isOpen={pvModalOpen} onClose={() => setPvModalOpen(false)} title={pvEditing ? `PV #${pvEditing.id}` : 'Proces verbal nou'} size="lg">
        <div className="flex gap-1 mb-5 border-b border-gray-200 dark:border-gray-700">
          <button onClick={() => setPvTab('predare')}
            className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 transition-colors ${pvTab === 'predare' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-gray-400'}`}>
            Predare
          </button>
          {pvEditing && pvEditing.status === 'deschis' && (
            <button onClick={() => setPvTab('primire')}
              className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 transition-colors ${pvTab === 'primire' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-gray-400'}`}>
              Primire (Inchidere)
            </button>
          )}
        </div>

        {pvTab === 'predare' && (
          <form onSubmit={handleSavePvPredare} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lucrare</label>
                <select value={pvFormPredare.lucrare_id} onChange={e => setPvFormPredare(f => ({...f, lucrare_id: e.target.value}))} className={inputCls} disabled={!!pvEditing}>
                  <option value="">-- Selecteaza --</option>
                  {lucrari.map(l => <option key={l.id} value={l.id}>{l.nume}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data predare</label>
                <input type="date" value={pvFormPredare.data_predare} onChange={e => setPvFormPredare(f => ({...f, data_predare: e.target.value}))} className={inputCls} disabled={!!pvEditing} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Persoana primire</label>
                <input value={pvFormPredare.persoana_primire_text} onChange={e => setPvFormPredare(f => ({...f, persoana_primire_text: e.target.value}))} className={inputCls} placeholder="Nume persoana" disabled={!!pvEditing} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Responsabil predare</label>
                <select value={pvFormPredare.responsabil_predare} onChange={e => setPvFormPredare(f => ({...f, responsabil_predare: e.target.value}))} className={inputCls} disabled={!!pvEditing}>
                  <option value="">-- Selecteaza --</option>
                  {persoane.map(p => <option key={p.id} value={p.nume}>{p.nume}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ore contor predare</label>
                <input type="number" value={pvFormPredare.ore_contor_predare} onChange={e => setPvFormPredare(f => ({...f, ore_contor_predare: e.target.value}))} className={inputCls} disabled={!!pvEditing} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Motorina predare (%)</label>
                <div className="relative">
                  <input type="number" min="0" max="100" value={pvFormPredare.motorina_predare} onChange={e => setPvFormPredare(f => ({...f, motorina_predare: e.target.value}))} className={inputCls + ' pr-8'} placeholder="0" disabled={!!pvEditing} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">%</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stare la predare</label>
                <select value={pvFormPredare.stare_predare} onChange={e => setPvFormPredare(f => ({...f, stare_predare: e.target.value}))} className={inputCls} disabled={!!pvEditing}>
                  {['buna', 'acceptabila', 'deteriorata'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observatii predare</label>
                <textarea value={pvFormPredare.observatii_predare} onChange={e => setPvFormPredare(f => ({...f, observatii_predare: e.target.value}))} className={inputCls + ' resize-none'} rows={2} disabled={!!pvEditing} />
              </div>
            </div>

            {/* Accesorii predare */}
            {pvAccesorii.length > 0 && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Accesorii predate</p>
                <div className="space-y-2">
                  {pvAccesorii.map((acc, idx) => (
                    <label key={acc.id ?? idx} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={!!acc.predat}
                        onChange={e => setPvAccesorii(prev => prev.map((a, i) => i === idx ? {...a, predat: e.target.checked} : a))}
                        disabled={!!pvEditing}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{acc.denumire}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Poze predare */}
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Poze predare</p>
              {pvEditing ? (
                <>
                  {pvPoze.filter(p => p.etapa === 'predare').length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                      {pvPoze.filter(p => p.etapa === 'predare').map(poza => (
                        <div key={poza.id} className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                          <img src={poza.url} alt="" className="w-full h-20 object-cover" />
                          <button type="button" onClick={() => handleDeletePvPoza(poza.id)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <UploadZone onUpload={(file) => handleUploadPvPoza(file, 'predare')} label="Adauga poze predare" />
                </>
              ) : (
                <>
                  {pvPendingPoze.filter(p => p.etapa === 'predare').length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                      {pvPendingPoze.filter(p => p.etapa === 'predare').map(p => (
                        <div key={p.localId} className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                          <img src={URL.createObjectURL(p.file)} alt="" className="w-full h-20 object-cover" />
                          <button type="button" onClick={() => setPvPendingPoze(prev => prev.filter(x => x.localId !== p.localId))} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <UploadZone onUpload={(file) => setPvPendingPoze(prev => [...prev, { file, etapa: 'predare', localId: Date.now() + Math.random() }])} label="Adauga poze predare" />
                </>
              )}
            </div>

            {/* Semnatura predare */}
            <SignaturePad
              label="Semnatura responsabil predare"
              value={semnaturaPredare}
              onChange={setSemnaturaPredare}
              disabled={!!pvEditing}
            />

            {!pvEditing ? (
              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium">Creeaza PV</button>
                <button type="button" onClick={() => setPvModalOpen(false)} className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg text-sm font-medium">Anuleaza</button>
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center">Datele de predare sunt doar pentru vizualizare. Folositi tab-ul Primire pentru inchidere PV.</p>
            )}
          </form>
        )}

        {pvTab === 'primire' && pvEditing && pvEditing.status === 'deschis' && (
          <form onSubmit={handleSavePvPrimire} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data primire *</label>
                <input type="date" required value={pvFormPrimire.data_primire} onChange={e => setPvFormPrimire(f => ({...f, data_primire: e.target.value}))} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Responsabil primire</label>
                <input value={pvFormPrimire.responsabil_primire} onChange={e => setPvFormPrimire(f => ({...f, responsabil_primire: e.target.value}))} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ore contor primire</label>
                <input type="number" value={pvFormPrimire.ore_contor_primire} onChange={e => setPvFormPrimire(f => ({...f, ore_contor_primire: e.target.value}))} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Motorina primire (%)</label>
                <div className="relative">
                  <input type="number" min="0" max="100" value={pvFormPrimire.motorina_primire} onChange={e => setPvFormPrimire(f => ({...f, motorina_primire: e.target.value}))} className={inputCls + ' pr-8'} placeholder="0" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">%</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stare la primire</label>
                <select value={pvFormPrimire.stare_primire} onChange={e => setPvFormPrimire(f => ({...f, stare_primire: e.target.value}))} className={inputCls}>
                  {['buna', 'acceptabila', 'deteriorata'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Probleme constatate</label>
                <textarea value={pvFormPrimire.probleme_constatate} onChange={e => setPvFormPrimire(f => ({...f, probleme_constatate: e.target.value}))} className={inputCls + ' resize-none'} rows={2} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observatii primire</label>
                <textarea value={pvFormPrimire.observatii_primire} onChange={e => setPvFormPrimire(f => ({...f, observatii_primire: e.target.value}))} className={inputCls + ' resize-none'} rows={2} />
              </div>
            </div>

            {/* Accesorii primire */}
            {pvAccesorii.length > 0 && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Accesorii primite inapoi</p>
                <div className="space-y-2">
                  {pvAccesorii.map((acc, idx) => (
                    <label key={acc.id ?? idx} className={`flex items-center gap-2 ${acc.predat ? 'cursor-pointer' : 'opacity-50 cursor-default'}`}>
                      <input type="checkbox" checked={!!acc.primit}
                        onChange={e => setPvAccesorii(prev => prev.map((a, i) => i === idx ? {...a, primit: e.target.checked} : a))}
                        disabled={!acc.predat}
                        className="w-4 h-4 rounded border-gray-300 text-green-600" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {acc.denumire}
                        {!acc.predat && <span className="ml-1 text-xs text-gray-400">(nepredat)</span>}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Poze primire */}
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Poze primire</p>
              {pvPoze.filter(p => p.etapa === 'primire').length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                  {pvPoze.filter(p => p.etapa === 'primire').map(poza => (
                    <div key={poza.id} className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                      <img src={poza.url} alt="" className="w-full h-20 object-cover" />
                      <button type="button" onClick={() => handleDeletePvPoza(poza.id)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                    </div>
                  ))}
                </div>
              )}
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
              <button type="button" onClick={() => setPvModalOpen(false)} className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg text-sm font-medium">Anuleaza</button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal adauga planificare */}
      <Modal isOpen={addPlanificare} onClose={() => setAddPlanificare(false)} title="Adauga planificare">
        <form onSubmit={handleAddPlanificare} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data start *</label>
              <input type="date" required value={planForm.data_start} onChange={e => setPlanForm(f => ({...f, data_start: e.target.value}))} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data sfarsit *</label>
              <input type="date" required value={planForm.data_sfarsit} onChange={e => setPlanForm(f => ({...f, data_sfarsit: e.target.value}))} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lucrare</label>
              <select value={planForm.lucrare_id} onChange={e => setPlanForm(f => ({...f, lucrare_id: e.target.value}))} className={selCls}>
                <option value="">-- Selecteaza --</option>
                {lucrari.map(l => <option key={l.id} value={l.id}>{l.nume}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Persoana</label>
              <select value={planForm.persoana_id} onChange={e => setPlanForm(f => ({...f, persoana_id: e.target.value}))} className={selCls}>
                <option value="">-- Selecteaza --</option>
                {persoane.map(p => <option key={p.id} value={p.id}>{p.nume}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observatii</label>
              <input value={planForm.observatii} onChange={e => setPlanForm(f => ({...f, observatii: e.target.value}))} className={inputCls} />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium">Salveaza</button>
            <button type="button" onClick={() => setAddPlanificare(false)} className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg text-sm font-medium">Anuleaza</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
