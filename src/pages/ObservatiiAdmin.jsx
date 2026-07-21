import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { useToast } from '../App';
import { useInbox } from '../inbox';
import Select from '../components/Select';
import { IconObservatie } from '../components/icons';
import { ObservatieBody, ObservatieActions, ObservatieStatusBadge } from '../components/observatii';

const FILTRE = [
  { value: '',          label: 'Toate' },
  { value: 'noua',      label: 'Noi' },
  { value: 'vazuta',    label: 'Vazute' },
  { value: 'rezolvata', label: 'Rezolvate' },
];

export default function ObservatiiAdmin() {
  const toast = useToast();
  const { refresh: refreshInbox } = useInbox();
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtru, setFiltru] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setLista(await api.get('/observatii' + (filtru ? `?status=${filtru}` : '')));
    } catch (e) {
      toast('Eroare la incarcare: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [filtru]); // eslint-disable-line

  useEffect(() => { load(); }, [load]);

  const onDone = () => { load(); refreshInbox?.(); };

  const noi = lista.filter(o => o.status === 'noua');
  const restul = lista.filter(o => o.status !== 'noua');

  const Card = ({ o, highlight }) => (
    <div className={`card p-4 ${highlight ? 'border-amber-200 bg-amber-50/30 dark:border-amber-500/30 dark:bg-amber-500/5' : ''}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <ObservatieStatusBadge status={o.status} />
      </div>
      <ObservatieBody obs={o} showSef />
      <div className="mt-3 border-t border-ink-100 pt-3 dark:border-ink-800">
        <ObservatieActions obs={o} onDone={onDone} />
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-4 lg:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="w-44">
          <Select value={filtru} onChange={setFiltru} options={FILTRE} placeholder="Toate" />
        </div>
        {!loading && <span className="text-sm text-ink-400">{lista.length} observatii</span>}
      </div>

      {loading ? (
        <div className="space-y-2.5">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="card h-40 animate-pulse" />)}
        </div>
      ) : lista.length === 0 ? (
        <div className="card py-14 text-center text-sm text-ink-500">
          <IconObservatie size={28} className="mx-auto mb-2 text-ink-300" />
          Nicio observatie{filtru ? ' cu acest status' : ''}.
        </div>
      ) : (
        <div className="space-y-2.5">
          {noi.map(o => <Card key={o.id} o={o} highlight />)}
          {noi.length > 0 && restul.length > 0 && (
            <div className="px-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-ink-400">Istoric</div>
          )}
          {restul.map(o => <Card key={o.id} o={o} />)}
        </div>
      )}
    </div>
  );
}
