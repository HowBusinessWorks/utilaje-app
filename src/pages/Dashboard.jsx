import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

function StatCard({ label, value, icon, color }) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 flex items-center gap-4`}>
      <div className={`text-3xl p-3 rounded-lg ${color}`}>{icon}</div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/rapoarte/dashboard')
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
    </div>
  );
  if (error) return <div className="text-red-500 p-4">Eroare: {error}</div>;
  if (!data) return null;

  const lunaNames = { '01':'Ian','02':'Feb','03':'Mar','04':'Apr','05':'Mai','06':'Iun','07':'Iul','08':'Aug','09':'Sep','10':'Oct','11':'Nov','12':'Dec' };
  const motorinaCuNume = (data.activitateMotorina || []).map(r => ({
    ...r,
    numeluna: r.luna ? (lunaNames[r.luna.split('-')[1]] || r.luna) : r.luna
  }));

  return (
    <div className="space-y-6">
      {/* Statistici principale */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard label="Total Utilaje" value={data.utilaje.total} icon="🚜" color="bg-blue-50 dark:bg-blue-900/20" />
        <StatCard label="Disponibile" value={data.utilaje.disponibile} icon="✅" color="bg-green-50 dark:bg-green-900/20" />
        <StatCard label="In Service" value={data.utilaje.inService} icon="🔧" color="bg-yellow-50 dark:bg-yellow-900/20" />
        <StatCard label="Indisponibile" value={data.utilaje.indisponibile} icon="❌" color="bg-red-50 dark:bg-red-900/20" />
        <StatCard label="Lucrari Active" value={data.lucrari.active} icon="🏗️" color="bg-purple-50 dark:bg-purple-900/20" />
        <StatCard label="PV Deschise" value={data.pvDeschise} icon="📋" color="bg-orange-50 dark:bg-orange-900/20" />
      </div>

      {/* Consum luna curenta */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Consum motorina luna curenta</p>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">{data.consumLuna} L</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Costuri reparatii luna curenta</p>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">{data.costuriReparatiiLuna?.toLocaleString('ro-RO')} RON</p>
        </div>
      </div>

      {/* Grafice */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Grafic motorina */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Consum Motorina (litri/luna)</h3>
          {motorinaCuNume.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={motorinaCuNume}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="numeluna" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => [`${v} L`, 'Litri']} />
                <Bar dataKey="litri" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-sm text-center py-10">Nu exista date</p>
          )}
        </div>

        {/* Distribuie categorii */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Distributie pe Categorii</h3>
          {data.byCategorie.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={data.byCategorie} dataKey="total" nameKey="nume" cx="50%" cy="50%" outerRadius={80} label={({ nume, total }) => `${nume}: ${total}`}>
                  {data.byCategorie.map((entry, idx) => (
                    <Cell key={idx} fill={entry.culoare || '#5b8af0'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-sm text-center py-10">Nu exista date</p>
          )}
        </div>
      </div>

      {/* Planificari active */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="p-5 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Planificari urmatoarele 14 zile</h3>
        </div>
        {data.planificariActive.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">Nu exista planificari in aceasta perioada</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600 dark:text-gray-300 font-medium">Utilaj</th>
                  <th className="text-left px-4 py-3 text-gray-600 dark:text-gray-300 font-medium">Lucrare</th>
                  <th className="text-left px-4 py-3 text-gray-600 dark:text-gray-300 font-medium">Inceput</th>
                  <th className="text-left px-4 py-3 text-gray-600 dark:text-gray-300 font-medium">Sfarsit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {data.planificariActive.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {p.utilaj_alias || p.utilaj_denumire}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{p.lucrare_nume || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{p.data_start}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{p.data_sfarsit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
