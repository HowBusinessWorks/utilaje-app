import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useToast } from '../App';
import Modal from '../components/Modal';
import Select from '../components/Select';
import { IconPlus, IconObservatie, IconCalendar, IconWarning, IconUtilaj, IconMessage } from '../components/icons';
import { TIPURI, TipBadge, fmtDateTime } from '../components/observatii';

const emptyForm = { pv_id: '', tip: '', mesaj: '' };

export default function Observatii() {
  const toast = useToast();
  const [pvDeschise, setPvDeschise] = useState([]);
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    try {
      const [pv, obs] = await Promise.all([
        api.get('/pvp?status=deschis'),
        api.get('/observatii'),
      ]);
      setPvDeschise(pv);
      setLista(obs);
    } catch (e) {
      toast('Eroare la incarcare: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const openNew = () => {
    if (pvDeschise.length === 0) return;
    setForm({ ...emptyForm, pv_id: pvDeschise.length === 1 ? String(pvDeschise[0].id) : '' });
    setModalOpen(true);
  };

  const canSubmit = form.pv_id && form.mesaj.trim().length > 0;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await api.post('/observatii', form);
      toast('Observatie trimisa');
      setModalOpen(false);
      load();
    } catch (e) { toast(e.message, 'error'); }
    finally { setSubmitting(false); }
  };

  const pvOptions = pvDeschise.map(pv => ({
    value: String(pv.id),
    label: pv.utilaj_denumire + (pv.lucrare_nume ? ` — ${pv.lucrare_nume}` : ''),
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-3 lg:space-y-6">
      {/* Antet - mobil, doar butonul + (titlul e in bara de sus) */}
      <div className="flex items-center justify-end gap-3 lg:hidden">
        <button
          onClick={openNew}
          disabled={loading || pvDeschise.length === 0}
          className="btn-primary h-10 w-10 shrink-0 rounded-full p-0 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Observatie noua"
          title="Observatie noua"
        >
          <IconPlus size={19} weight="bold" />
        </button>
      </div>
      <button onClick={openNew} disabled={loading || pvDeschise.length === 0}
        className="btn-primary hidden h-11 w-full disabled:cursor-not-allowed disabled:opacity-40 lg:flex">
        <IconPlus size={17} weight="bold" /> Observatie noua
      </button>

      {/* Avertisment fara PV deschis */}
      {!loading && pvDeschise.length === 0 && (
        <div className="card flex items-start gap-3 p-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
            <IconWarning size={18} weight="fill" />
          </span>
          <p className="text-sm text-ink-600 dark:text-ink-300">
            Nu ai niciun proces verbal deschis, deci nu poti lasa o observatie. O observatie se face pentru un utilaj predat tie printr-un proces verbal deschis.
          </p>
        </div>
      )}

      {/* Lista observatii */}
      {loading ? (
        <div className="space-y-2.5">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="card h-24 animate-pulse" />)}
        </div>
      ) : lista.length === 0 ? (
        <div className="card py-14 text-center text-sm text-ink-500">
          <IconObservatie size={28} className="mx-auto mb-2 text-ink-300" />
          Nu ai raportat inca nicio observatie.
        </div>
      ) : (
        <div className="space-y-2.5">
          {lista.map(o => (
            <div key={o.id} className="card overflow-hidden">
              <div className="flex items-start gap-3 p-3.5">
                <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                  <IconUtilaj size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="min-w-0 truncate font-semibold text-ink-900 dark:text-white">{o.utilaj_denumire}</span>
                    <TipBadge tip={o.tip} />
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-500">
                    <span className="flex items-center gap-1"><IconCalendar size={12} /> {fmtDateTime(o.created_at)}</span>
                    {o.pv_status === 'inchis' && <span className="shrink-0 text-ink-400">· PV inchis</span>}
                  </div>
                </div>
              </div>
              <div className="border-t border-ink-100 px-3.5 py-2.5 dark:border-ink-800">
                <p className="whitespace-pre-line text-sm text-ink-700 dark:text-ink-200">{o.mesaj}</p>
                {o.raspuns_admin && (
                  <p className="mt-2 whitespace-pre-line rounded-lg bg-brand-50 px-2.5 py-2 text-[13px] text-brand-700 dark:bg-brand-500/10 dark:text-brand-200">
                    <span className="mb-0.5 flex items-center gap-1 font-medium"><IconMessage size={13} weight="fill" /> Raspuns birou</span>
                    {o.raspuns_admin}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal formular */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Observatie noua">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-ink-600 dark:text-ink-300">
              Utilaj (proces verbal) <span className="text-brand-500">*</span>
            </label>
            <Select value={form.pv_id} onChange={v => setForm(f => ({ ...f, pv_id: v }))}
              placeholder="Selecteaza utilajul" options={pvOptions} />
            <p className="mt-1 text-xs text-ink-400">Doar utilajele cu proces verbal deschis pe numele tau.</p>
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-ink-600 dark:text-ink-300">Tipul observatiei</label>
            <Select value={form.tip} onChange={v => setForm(f => ({ ...f, tip: v }))}
              placeholder="Fara tip anume" options={TIPURI} />
            <p className="mt-1 text-xs text-ink-400">Optional — alege doar daca se potriveste.</p>
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-ink-600 dark:text-ink-300">
              Mesaj <span className="text-brand-500">*</span>
            </label>
            <textarea required rows={4} value={form.mesaj}
              onChange={e => setForm(f => ({ ...f, mesaj: e.target.value }))}
              className="field resize-none" placeholder="Descrie pe scurt ce s-a intamplat…" />
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={!canSubmit || submitting} className="btn-primary h-11 flex-1 disabled:cursor-not-allowed disabled:opacity-50">
              {submitting ? 'Se trimite…' : 'Trimite'}
            </button>
            <button type="button" onClick={() => setModalOpen(false)} className="btn-ghost-danger h-11 flex-1">Anuleaza</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
