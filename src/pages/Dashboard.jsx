import React, { useState, useEffect } from 'react';
import { api } from '../api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  IconUtilaj, IconCheckCircle, IconRepair, IconXCircle, IconWork, IconClipboard,
  IconFuel, IconMoney, IconArrowRight,
} from '../components/icons';
import { Link } from 'react-router-dom';

function Kpi({ label, value, Icon, tone = 'brand', suffix }) {
  const toneCls = {
    brand:   'text-brand-600 bg-brand-50 dark:bg-brand-500/10 dark:text-brand-400',
    green:   'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400',
    amber:   'text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400',
    red:     'text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400',
    violet:  'text-violet-600 bg-violet-50 dark:bg-violet-500/10 dark:text-violet-400',
    orange:  'text-orange-600 bg-orange-50 dark:bg-orange-500/10 dark:text-orange-400',
  }[tone];
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <span className={`grid h-9 w-9 place-items-center rounded-lg ${toneCls}`}>
          <Icon size={19} weight="fill" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold tabular text-ink-900 dark:text-white">
        {value}{suffix && <span className="ml-1 text-base font-medium text-ink-400">{suffix}</span>}
      </p>
      <p className="mt-0.5 text-[13px] text-ink-500 dark:text-ink-400">{label}</p>
    </div>
  );
}

function ChartCard({ title, children, action }) {
  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink-800 dark:text-ink-100">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function EmptyChart({ label }) {
  return <p className="py-16 text-center text-sm text-ink-400">{label}</p>;
}

function ChartTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-ink-200 bg-white px-3 py-2 shadow-pop dark:border-ink-700 dark:bg-ink-900">
      {label && <p className="mb-0.5 text-xs font-medium text-ink-500">{label}</p>}
      <p className="text-sm font-semibold tabular text-ink-900 dark:text-white">
        {payload[0].value?.toLocaleString('ro-RO')}{unit ? ` ${unit}` : ''}
      </p>
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
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="card h-[116px] animate-pulse p-4">
          <div className="h-9 w-9 rounded-lg bg-ink-100 dark:bg-ink-800" />
          <div className="mt-4 h-6 w-16 rounded bg-ink-100 dark:bg-ink-800" />
          <div className="mt-2 h-3 w-20 rounded bg-ink-100 dark:bg-ink-800" />
        </div>
      ))}
    </div>
  );
  if (error) return (
    <div className="card border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
      Nu am putut incarca datele. {error}
    </div>
  );
  if (!data) return null;

  const lunaNames = { '01':'Ian','02':'Feb','03':'Mar','04':'Apr','05':'Mai','06':'Iun','07':'Iul','08':'Aug','09':'Sep','10':'Oct','11':'Nov','12':'Dec' };
  const motorinaCuNume = (data.activitateMotorina || []).map(r => ({
    ...r,
    numeluna: r.luna ? (lunaNames[r.luna.split('-')[1]] || r.luna) : r.luna,
  }));
  const categoriiTotal = (data.byCategorie || []).reduce((s, c) => s + (c.total || 0), 0);

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Total utilaje" value={data.utilaje.total} Icon={IconUtilaj} tone="brand" />
        <Kpi label="Disponibile" value={data.utilaje.disponibile} Icon={IconCheckCircle} tone="green" />
        <Kpi label="In service" value={data.utilaje.inService} Icon={IconRepair} tone="amber" />
        <Kpi label="Indisponibile" value={data.utilaje.indisponibile} Icon={IconXCircle} tone="red" />
        <Kpi label="Lucrari active" value={data.lucrari.active} Icon={IconWork} tone="violet" />
        <Kpi label="PV deschise" value={data.pvDeschise} Icon={IconClipboard} tone="orange" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <ChartCard title="Consum motorina (litri / luna)" >
          <div className="mb-4 flex items-end gap-2">
            <span className="text-3xl font-semibold tabular text-ink-900 dark:text-white">
              {Number(data.consumLuna || 0).toLocaleString('ro-RO')}
            </span>
            <span className="mb-1 text-sm text-ink-400">L luna curenta</span>
          </div>
          {motorinaCuNume.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={motorinaCuNume} margin={{ top: 4, right: 4, left: -18, bottom: 0 }} barCategoryGap="30%">
                <CartesianGrid vertical={false} stroke="currentColor" className="text-ink-100 dark:text-ink-800" />
                <XAxis dataKey="numeluna" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={44} />
                <Tooltip cursor={{ fill: 'rgba(148,161,179,0.14)' }} content={<ChartTooltip unit="L" />} />
                <Bar dataKey="litri" fill="#2450e8" radius={[6, 6, 0, 0]} maxBarSize={38} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart label="Fara consum inregistrat" />}
        </ChartCard>

        <ChartCard title="Costuri reparatii">
          <div className="mb-4 flex items-end gap-2">
            <span className="text-3xl font-semibold tabular text-ink-900 dark:text-white">
              {Number(data.costuriReparatiiLuna || 0).toLocaleString('ro-RO')}
            </span>
            <span className="mb-1 text-sm text-ink-400">RON luna curenta</span>
          </div>
          <div className="flex h-[200px] flex-col justify-center gap-3">
            <div className="flex items-center gap-3 rounded-xl bg-ink-50 p-4 dark:bg-ink-800/40">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                <IconRepair size={20} weight="fill" />
              </span>
              <div>
                <p className="text-sm font-medium text-ink-800 dark:text-ink-100">Interventii luna curenta</p>
                <p className="text-xs text-ink-400">Cost total reparatii inregistrate</p>
              </div>
            </div>
            <Link to="/reparatii" className="btn-ghost justify-between">
              Vezi toate reparatiile <IconArrowRight size={16} />
            </Link>
          </div>
        </ChartCard>

        <ChartCard title="Distributie pe categorii">
          {(data.byCategorie || []).length > 0 ? (
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <ResponsiveContainer width={150} height={200}>
                  <PieChart>
                    <Pie data={data.byCategorie} dataKey="total" nameKey="nume" cx="50%" cy="50%"
                      innerRadius={52} outerRadius={72} paddingAngle={2} stroke="none">
                      {data.byCategorie.map((entry, idx) => (
                        <Cell key={idx} fill={entry.culoare || '#2450e8'} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip unit="buc" />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-semibold tabular text-ink-900 dark:text-white">{categoriiTotal}</span>
                  <span className="text-[11px] text-ink-400">total</span>
                </div>
              </div>
              <div className="scroll-area max-h-[200px] flex-1 space-y-1.5 overflow-y-auto">
                {data.byCategorie.map((c, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c.culoare || '#2450e8' }} />
                      <span className="truncate text-ink-600 dark:text-ink-300">{c.nume}</span>
                    </span>
                    <span className="tabular font-medium text-ink-900 dark:text-white">{c.total}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <EmptyChart label="Fara categorii" />}
        </ChartCard>
      </div>

      {/* Upcoming schedule */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-ink-200/80 px-5 py-4 dark:border-ink-800">
          <h3 className="text-sm font-semibold text-ink-800 dark:text-ink-100">Planificari · urmatoarele 14 zile</h3>
          <Link to="/planificare" className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
            Toate <IconArrowRight size={15} />
          </Link>
        </div>
        {data.planificariActive.length === 0 ? (
          <p className="py-12 text-center text-sm text-ink-400">Nicio planificare in aceasta perioada</p>
        ) : (
          <div className="scroll-area overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-200/70 dark:border-ink-800">
                  {['Utilaj', 'Lucrare', 'Inceput', 'Sfarsit'].map(h => (
                    <th key={h} className="px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                {data.planificariActive.map(p => (
                  <tr key={p.id} className="transition-colors hover:bg-ink-50/70 dark:hover:bg-ink-800/40">
                    <td className="px-5 py-3 font-medium text-ink-900 dark:text-white">{p.utilaj_denumire}</td>
                    <td className="px-5 py-3 text-ink-600 dark:text-ink-300">{p.lucrare_nume || '—'}</td>
                    <td className="px-5 py-3 tabular text-ink-600 dark:text-ink-300">{p.data_start}</td>
                    <td className="px-5 py-3 tabular text-ink-600 dark:text-ink-300">{p.data_sfarsit}</td>
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
