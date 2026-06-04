import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useToast } from '../App';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Line, Legend } from 'recharts';

const TABS = ['General', 'Per Utilaj', 'Per Lucrare', 'Sumar'];

const lunaNames = { '01':'Ian','02':'Feb','03':'Mar','04':'Apr','05':'Mai','06':'Iun','07':'Iul','08':'Aug','09':'Sep','10':'Oct','11':'Nov','12':'Dec' };
const fmtLuna = (luna) => {
  if (!luna) return luna;
  const parts = luna.split('-');
  return (lunaNames[parts[1]] || parts[1]) + ' ' + parts[0];
};

function StatCard({ value, label, color = 'text-blue-600 dark:text-blue-400', sub }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function TabGeneral() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/rapoarte/dashboard')
      .then(setData)
      .catch(e => toast('Eroare: ' + e.message, 'error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center h-32"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mt-8"></div></div>;
  if (!data) return null;

  const motorinaCuNume = (data.activitateMotorina || []).map(r => ({ ...r, numeluna: fmtLuna(r.luna) }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total utilaje', value: data.utilaje.total, color: 'text-blue-600 dark:text-blue-400' },
          { label: 'Disponibile', value: data.utilaje.disponibile, color: 'text-green-600 dark:text-green-400' },
          { label: 'In service', value: data.utilaje.inService, color: 'text-yellow-600 dark:text-yellow-400' },
          { label: 'Indisponibile', value: data.utilaje.indisponibile, color: 'text-red-600 dark:text-red-400' },
        ].map(c => (
          <div key={c.label} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 text-center">
            <p className={`text-3xl font-bold ${c.color}`}>{c.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Consum Motorina (litri/luna)</h3>
          {motorinaCuNume.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={motorinaCuNume}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="numeluna" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v} L`, 'Consum']} />
                <Bar dataKey="litri" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Litri" />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-sm text-center py-10">Nu exista date</p>}
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Distributie pe Categorii</h3>
          {data.byCategorie.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={data.byCategorie} dataKey="total" nameKey="nume" cx="50%" cy="50%" outerRadius={90}
                  label={({ nume, total }) => `${nume} (${total})`}>
                  {data.byCategorie.map((entry, idx) => (
                    <Cell key={idx} fill={entry.culoare || '#5b8af0'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-sm text-center py-10">Nu exista date</p>}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Rezumat categorii</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                {['Categorie', 'Total', 'Disponibile', 'Utilization'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-gray-600 dark:text-gray-300 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {data.byCategorie.map(c => (
                <tr key={c.nume} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-4 py-3 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.culoare }}></div>
                    {c.nume}
                  </td>
                  <td className="px-4 py-3 font-medium">{c.total}</td>
                  <td className="px-4 py-3 text-green-600 dark:text-green-400">{c.disponibile || 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: c.total ? `${(c.disponibile / c.total) * 100}%` : '0%' }}></div>
                      </div>
                      <span className="text-xs text-gray-500">{c.total ? Math.round((c.disponibile / c.total) * 100) : 0}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TabPerUtilaj() {
  const toast = useToast();
  const [utilaje, setUtilaje] = useState([]);
  const [selectedUtilaj, setSelectedUtilaj] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/utilaje').then(setUtilaje).catch(e => toast('Eroare: ' + e.message, 'error'));
  }, []);

  useEffect(() => {
    if (!selectedUtilaj) { setData(null); return; }
    setLoading(true);
    api.get(`/rapoarte/utilaj/${selectedUtilaj}`)
      .then(setData)
      .catch(e => toast('Eroare: ' + e.message, 'error'))
      .finally(() => setLoading(false));
  }, [selectedUtilaj]);

  const inputCls = "border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none";

  const activitateCuNume = (data?.activitateLunara || []).map(r => ({
    ...r,
    numeluna: fmtLuna(r.luna),
    ore_lucrate: r.ore_lucrate || 0,
    zile_lucrate: r.zile_lucrate || 0,
  }));

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Selecteaza utilaj</label>
        <select value={selectedUtilaj} onChange={e => setSelectedUtilaj(e.target.value)} className={inputCls + ' w-64'}>
          <option value="">-- Alege un utilaj --</option>
          {utilaje.map(u => <option key={u.id} value={u.id}>{u.alias || u.denumire}</option>)}
        </select>
      </div>

      {loading && <div className="flex justify-center h-32"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mt-8"></div></div>}

      {data && (
        <div className="space-y-5">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard value={`${(data.totalMotorinaLitri || 0).toLocaleString('ro-RO')} L`} label="Total motorina" color="text-blue-600 dark:text-blue-400" />
            <StatCard value={`${(data.totalCosturiReparatii || 0).toLocaleString('ro-RO')} RON`} label="Total reparatii" color="text-red-600 dark:text-red-400" />
            <StatCard
              value={(data.totalOreLucrate || 0) > 0 ? `${data.totalOreLucrate.toLocaleString('ro-RO')} h` : '—'}
              label="Ore lucrate (din PV)"
              color="text-purple-600 dark:text-purple-400"
              sub={(data.activitateLunara || []).length > 0 ? `pe ${(data.activitateLunara || []).length} luni` : 'fara PV inchise'}
            />
            <StatCard
              value={(data.totalZileLucrate || 0) > 0 ? `${data.totalZileLucrate} zile` : '—'}
              label="Zile lucrate (din PV)"
              color="text-orange-600 dark:text-orange-400"
            />
          </div>

          {/* Grafic activitate lunara */}
          {activitateCuNume.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Activitate lunara (ore si zile lucrate din PV)</h4>
              <ResponsiveContainer width="100%" height={240}>
                <ComposedChart data={activitateCuNume}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="numeluna" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="ore" orientation="left" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="zile" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value, name) => name === 'Ore lucrate' ? [`${value} h`, name] : [`${value} zile`, name]}
                  />
                  <Legend />
                  <Bar yAxisId="ore" dataKey="ore_lucrate" name="Ore lucrate" fill="#8b5cf6" radius={[4,4,0,0]} />
                  <Line yAxisId="zile" type="monotone" dataKey="zile_lucrate" name="Zile lucrate" stroke="#f97316" strokeWidth={2} dot={{ r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Tabel activitate lunara */}
          {activitateCuNume.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Activitate lunara (din procese verbale inchise)</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      {['Luna', 'Ore lucrate', 'Zile lucrate', 'Nr. PV'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-gray-600 dark:text-gray-300 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {activitateCuNume.map(r => (
                      <tr key={r.luna} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{r.numeluna}</td>
                        <td className="px-4 py-3">
                          {r.ore_lucrate > 0 ? (
                            <span className="font-medium text-purple-600 dark:text-purple-400">{r.ore_lucrate.toLocaleString('ro-RO')} h</span>
                          ) : <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          {r.zile_lucrate > 0 ? (
                            <span className="font-medium text-orange-600 dark:text-orange-400">{r.zile_lucrate} zile</span>
                          ) : <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-500">{r.nr_pv} PV</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 dark:bg-gray-700/30 font-semibold">
                      <td className="px-4 py-3">Total</td>
                      <td className="px-4 py-3 text-purple-600 dark:text-purple-400">{(data.totalOreLucrate || 0) > 0 ? `${data.totalOreLucrate.toLocaleString('ro-RO')} h` : '—'}</td>
                      <td className="px-4 py-3 text-orange-600 dark:text-orange-400">{(data.totalZileLucrate || 0) > 0 ? `${data.totalZileLucrate} zile` : '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{activitateCuNume.reduce((s, r) => s + r.nr_pv, 0)} PV</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activitateCuNume.length === 0 && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border border-dashed border-gray-300 dark:border-gray-600 text-center">
              <p className="text-gray-400 text-sm">Nu exista procese verbale inchise pentru acest utilaj. Orele si zilele se calculeaza din diferenta dintre ore contor de la predare si primire.</p>
            </div>
          )}

          {/* Motorina si reparatii */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Ultime fise motorina</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="text-gray-500 dark:text-gray-400"><th className="text-left pb-2">Data</th><th className="text-left pb-2">Litri</th><th className="text-left pb-2">Furnizor</th></tr></thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {data.motorina.slice(0, 10).map(m => (
                      <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                        <td className="py-2">{m.data_consum}</td>
                        <td className="py-2 font-medium text-blue-600 dark:text-blue-400">{m.nr_litri} L</td>
                        <td className="py-2">{m.furnizor || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.motorina.length === 0 && <p className="text-gray-400 text-xs text-center py-4">Nu exista fise</p>}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Ultime reparatii</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="text-gray-500 dark:text-gray-400"><th className="text-left pb-2">Data</th><th className="text-left pb-2">Cost</th><th className="text-left pb-2">Furnizor</th></tr></thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {data.reparatii.slice(0, 10).map(r => (
                      <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                        <td className="py-2">{r.data_reparatie}</td>
                        <td className="py-2 font-medium text-red-600 dark:text-red-400">{r.cost_total?.toLocaleString('ro-RO')} RON</td>
                        <td className="py-2">{r.furnizor}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.reparatii.length === 0 && <p className="text-gray-400 text-xs text-center py-4">Nu exista reparatii</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {!selectedUtilaj && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-3xl mb-2">📊</p>
          <p>Selecteaza un utilaj pentru a vedea raportul</p>
        </div>
      )}
    </div>
  );
}

function TabPerLucrare() {
  const toast = useToast();
  const [lucrari, setLucrari] = useState([]);
  const [selectedLucrare, setSelectedLucrare] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/lucrari').then(setLucrari).catch(e => toast('Eroare: ' + e.message, 'error'));
  }, []);

  useEffect(() => {
    if (!selectedLucrare) { setData(null); return; }
    setLoading(true);
    api.get(`/rapoarte/lucrare/${selectedLucrare}`)
      .then(setData)
      .catch(e => toast('Eroare: ' + e.message, 'error'))
      .finally(() => setLoading(false));
  }, [selectedLucrare]);

  const inputCls = "border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none";

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Selecteaza lucrare</label>
        <select value={selectedLucrare} onChange={e => setSelectedLucrare(e.target.value)} className={inputCls + ' w-72'}>
          <option value="">-- Alege o lucrare --</option>
          {lucrari.map(l => <option key={l.id} value={l.id}>{l.nume}</option>)}
        </select>
      </div>

      {loading && <div className="flex justify-center h-32"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mt-8"></div></div>}

      {data && (
        <div className="space-y-5">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard value={`${(data.totalLitri || 0).toLocaleString('ro-RO')} L`} label="Consum motorina" color="text-blue-600 dark:text-blue-400" />
            <StatCard value={`${(data.planificari || []).length}`} label="Planificari" color="text-gray-700 dark:text-gray-300" />
            <StatCard
              value={(data.totalOreLucrare || 0) > 0 ? `${data.totalOreLucrare.toLocaleString('ro-RO')} h` : '—'}
              label="Total ore lucrate (din PV)"
              color="text-purple-600 dark:text-purple-400"
            />
            <StatCard
              value={(data.totalZileLucrare || 0) > 0 ? `${data.totalZileLucrare} zile` : '—'}
              label="Total zile utilaje (din PV)"
              color="text-orange-600 dark:text-orange-400"
            />
          </div>

          {/* Ore per utilaj pe aceasta lucrare */}
          {(data.orePerUtilaj || []).length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Ore si zile lucrate per utilaj (din PV inchise)</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      {['Utilaj', 'Ore lucrate', 'Zile lucrate', 'Nr. PV'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-gray-600 dark:text-gray-300 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {(data.orePerUtilaj || []).map((r, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                          {r.utilaj_alias || r.utilaj_denumire}
                        </td>
                        <td className="px-4 py-3">
                          {r.ore_lucrate > 0 ? (
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-purple-600 dark:text-purple-400">{r.ore_lucrate.toLocaleString('ro-RO')} h</span>
                              {data.totalOreLucrare > 0 && (
                                <div className="flex items-center gap-1">
                                  <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                    <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${(r.ore_lucrate / data.totalOreLucrare) * 100}%` }}></div>
                                  </div>
                                  <span className="text-xs text-gray-400">{Math.round((r.ore_lucrate / data.totalOreLucrare) * 100)}%</span>
                                </div>
                              )}
                            </div>
                          ) : <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          {r.zile_lucrate > 0 ? (
                            <span className="font-medium text-orange-600 dark:text-orange-400">{r.zile_lucrate} zile</span>
                          ) : <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-500">{r.nr_pv} PV</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 dark:bg-gray-700/30 font-semibold">
                      <td className="px-4 py-3">Total</td>
                      <td className="px-4 py-3 text-purple-600 dark:text-purple-400">{(data.totalOreLucrare || 0) > 0 ? `${data.totalOreLucrare.toLocaleString('ro-RO')} h` : '—'}</td>
                      <td className="px-4 py-3 text-orange-600 dark:text-orange-400">{(data.totalZileLucrare || 0) > 0 ? `${data.totalZileLucrare} zile` : '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{(data.orePerUtilaj || []).reduce((s, r) => s + r.nr_pv, 0)} PV</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {(data.orePerUtilaj || []).length === 0 && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-dashed border-gray-300 dark:border-gray-600 text-center">
              <p className="text-gray-400 text-sm">Nu exista procese verbale inchise cu ore contor completate pentru aceasta lucrare.</p>
            </div>
          )}

          {/* Grafic ore per utilaj */}
          {(data.orePerUtilaj || []).length > 1 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Ore lucrate per utilaj</h4>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={(data.orePerUtilaj || []).map(r => ({ ...r, utilaj: r.utilaj_alias || r.utilaj_denumire }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="utilaj" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [`${v} h`, 'Ore lucrate']} />
                  <Bar dataKey="ore_lucrate" name="Ore lucrate" fill="#8b5cf6" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Planificari */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Planificari ({data.planificari.length})</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    {['Utilaj', 'Data start', 'Data sfarsit', 'Durata'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-gray-600 dark:text-gray-300 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {data.planificari.map(p => {
                    const start = new Date(p.data_start);
                    const end = new Date(p.data_sfarsit);
                    const zile = Math.round((end - start) / 86400000) + 1;
                    return (
                      <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                        <td className="px-4 py-3 font-medium">{p.utilaj_alias || p.utilaj_denumire}</td>
                        <td className="px-4 py-3">{p.data_start}</td>
                        <td className="px-4 py-3">{p.data_sfarsit}</td>
                        <td className="px-4 py-3">{zile} zile</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {data.planificari.length === 0 && <p className="text-center py-6 text-gray-400 text-sm">Nicio planificare</p>}
            </div>
          </div>

          {/* Motorina */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Consum motorina ({data.motorina.length} fise)</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    {['Data', 'Utilaj', 'Litri', 'Furnizor'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-gray-600 dark:text-gray-300 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {data.motorina.map(m => (
                    <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="px-4 py-3">{m.data_consum}</td>
                      <td className="px-4 py-3">{m.utilaj_denumire}</td>
                      <td className="px-4 py-3 font-medium text-blue-600 dark:text-blue-400">{m.nr_litri} L</td>
                      <td className="px-4 py-3">{m.furnizor || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.motorina.length === 0 && <p className="text-center py-6 text-gray-400 text-sm">Nicio fisa</p>}
            </div>
          </div>
        </div>
      )}

      {!selectedLucrare && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-3xl mb-2">🏗️</p>
          <p>Selecteaza o lucrare pentru a vedea raportul</p>
        </div>
      )}
    </div>
  );
}

function TabSumar() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/rapoarte/dashboard')
      .then(setData)
      .catch(e => toast('Eroare: ' + e.message, 'error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center h-32"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mt-8"></div></div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'Total utilaje', value: data.utilaje.total, icon: '🚜', sub: `${data.utilaje.disponibile} disponibile` },
          { label: 'Lucrari active', value: data.lucrari.active, icon: '🏗️', sub: '' },
          { label: 'PV deschise', value: data.pvDeschise, icon: '📋', sub: 'necesita atentie' },
          { label: 'Consum motorina', value: data.consumLuna + ' L', icon: '⛽', sub: 'luna curenta' },
          { label: 'Costuri reparatii', value: data.costuriReparatiiLuna?.toLocaleString('ro-RO') + ' RON', icon: '🔧', sub: 'luna curenta' },
          { label: 'Casate', value: data.utilaje.casate, icon: '🗑️', sub: 'scoase din uz' },
        ].map(c => (
          <div key={c.label} className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{c.icon}</span>
              <p className="text-sm text-gray-500 dark:text-gray-400">{c.label}</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{c.value}</p>
            {c.sub && <p className="text-xs text-gray-400 mt-1">{c.sub}</p>}
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="p-5 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Statistici complete pe categorii</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                {['Categorie', 'Total', 'Disponibile', 'Ocupate', '% Disponibil'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-gray-600 dark:text-gray-300 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {data.byCategorie.map(c => {
                const ocupate = c.total - (c.disponibile || 0);
                const pct = c.total ? Math.round((c.disponibile / c.total) * 100) : 0;
                return (
                  <tr key={c.nume} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3 flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.culoare }}></div>
                      {c.nume}
                    </td>
                    <td className="px-4 py-3 font-medium">{c.total}</td>
                    <td className="px-4 py-3 text-green-600 dark:text-green-400">{c.disponibile || 0}</td>
                    <td className="px-4 py-3 text-orange-600 dark:text-orange-400">{ocupate}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                          <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${pct}%` }}></div>
                        </div>
                        <span className="text-xs">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function Rapoarte() {
  const [activeTab, setActiveTab] = useState('General');

  return (
    <div className="space-y-5">
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-1">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}>
              {tab}
            </button>
          ))}
        </div>
      </div>
      {activeTab === 'General' && <TabGeneral />}
      {activeTab === 'Per Utilaj' && <TabPerUtilaj />}
      {activeTab === 'Per Lucrare' && <TabPerLucrare />}
      {activeTab === 'Sumar' && <TabSumar />}
    </div>
  );
}
