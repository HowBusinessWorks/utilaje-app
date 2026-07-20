import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { useToast } from '../App';
import { useInbox } from '../inbox';
import Select from '../components/Select';
import Modal from '../components/Modal';
import { StatusBadge, SolicitareBody, fmtDate } from '../components/solicitari';
import { IconRequest, IconCheck, IconUtilaj, IconSpinner, IconPlus } from '../components/icons';

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const emptyForm = { categorie_id: '', data_start: '', data_sfarsit: '', lucrare_id: '', nota: '', subcontractanti_ids: [] };

// Numaram sectiunile ca sa dam pasi vizuali clari.
function StepHead({ n, title, hint, done }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold transition-colors ${
        done ? 'bg-emerald-500 text-white' : 'bg-brand-600 text-white'
      }`}>
        {done ? <IconCheck size={16} weight="bold" /> : n}
      </span>
      <div>
        <h3 className="text-[15px] font-semibold text-ink-900 dark:text-white">{title}</h3>
        {hint && <p className="text-[13px] text-ink-500">{hint}</p>}
      </div>
    </div>
  );
}

export default function Solicitari() {
  const toast = useToast();
  const inbox = useInbox();
  const [categorii, setCategorii] = useState([]);
  const [lucrari, setLucrari] = useState([]);
  const [subcontractanti, setSubcontractanti] = useState([]);
  const [mine, setMine] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  const [form, setForm] = useState(emptyForm);
  const [dispo, setDispo] = useState(null);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const loadMine = useCallback(async () => {
    try { setMine(await api.get('/solicitari')); } catch (e) { /* silent */ }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [cat, luc, per] = await Promise.all([
          api.get('/lucrari/categorii'),
          api.get('/lucrari'),
          api.get('/persoane'),
        ]);
        setCategorii(cat);
        setLucrari(luc);
        setSubcontractanti(per.filter(p => p.categorie === 'subcontractant'));
        await loadMine();
      } catch (e) {
        toast('Eroare la incarcare: ' + e.message, 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, []); // eslint-disable-line

  const datesValid = form.data_start && form.data_sfarsit && form.data_sfarsit >= form.data_start;

  // Verifica disponibilitatea cand avem categorie + interval valid.
  useEffect(() => {
    if (!form.categorie_id || !datesValid) { setDispo(null); return; }
    let cancelled = false;
    setChecking(true);
    api.get(`/solicitari/disponibilitate?categorie_id=${form.categorie_id}&data_start=${form.data_start}&data_sfarsit=${form.data_sfarsit}`)
      .then(d => { if (!cancelled) setDispo(d); })
      .catch(() => { if (!cancelled) setDispo(null); })
      .finally(() => { if (!cancelled) setChecking(false); });
    return () => { cancelled = true; };
  }, [form.categorie_id, form.data_start, form.data_sfarsit, datesValid]);

  const toggleSub = (id) => setForm(f => ({
    ...f,
    subcontractanti_ids: f.subcontractanti_ids.includes(id)
      ? f.subcontractanti_ids.filter(x => x !== id)
      : [...f.subcontractanti_ids, id],
  }));

  const canSubmit = form.categorie_id && datesValid && form.lucrare_id && form.subcontractanti_ids.length > 0;

  // Are formularul date completate ce s-ar pierde daca inchidem?
  const isDirty = !!(form.categorie_id || form.data_start || form.data_sfarsit || form.lucrare_id || form.nota.trim() || form.subcontractanti_ids.length > 0);

  const requestCloseForm = () => {
    if (isDirty) setConfirmDiscard(true);
    else setFormOpen(false);
  };

  const discardForm = () => {
    setForm(emptyForm);
    setDispo(null);
    setConfirmDiscard(false);
    setFormOpen(false);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await api.post('/solicitari', form);
      toast('Solicitare trimisa! Vei fi anuntat cand primeste raspuns.');
      setForm(emptyForm);
      setDispo(null);
      setFormOpen(false);
      await loadMine();
      inbox?.refreshCount();
    } catch (e) { toast(e.message, 'error'); }
    finally { setSubmitting(false); }
  };

  const selectedCat = categorii.find(c => String(c.id) === String(form.categorie_id));

  const formBody = (
    <>
      {/* FORMULAR */}
      <div className="card space-y-7 p-5 sm:p-6">
        {/* 1. Categorie */}
        <section>
          <StepHead n={1} title="Ce fel de utilaj iti trebuie?" hint="Alege tipul de utilaj." done={!!form.categorie_id} />
          {loading ? (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-ink-100 dark:bg-ink-800" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {categorii.map(c => {
                const sel = String(c.id) === String(form.categorie_id);
                return (
                  <button key={c.id} type="button" onClick={() => set('categorie_id', String(c.id))}
                    className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all ${
                      sel
                        ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/20 dark:border-brand-500 dark:bg-brand-500/10'
                        : 'border-ink-200 hover:border-ink-300 hover:bg-ink-50 dark:border-ink-700 dark:hover:border-ink-600 dark:hover:bg-ink-800/50'
                    }`}>
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: c.culoare || '#5b8af0' }} />
                    <span className={`text-sm font-medium ${sel ? 'text-brand-800 dark:text-brand-200' : 'text-ink-800 dark:text-ink-200'}`}>
                      {c.nume}
                    </span>
                  </button>
                );
              })}
              {categorii.length === 0 && <p className="text-sm text-ink-500">Nu exista categorii.</p>}
            </div>
          )}
        </section>

        {/* 2. Perioada */}
        <section>
          <StepHead n={2} title="Pe ce perioada?" hint="Intervalul in care vei folosi utilajul." done={datesValid} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-ink-600 dark:text-ink-300">De la</label>
              <input type="date" min={todayStr()} value={form.data_start}
                onChange={e => setForm(f => ({ ...f, data_start: e.target.value, data_sfarsit: f.data_sfarsit && f.data_sfarsit < e.target.value ? e.target.value : f.data_sfarsit }))}
                className="field" />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-ink-600 dark:text-ink-300">Pana la</label>
              <input type="date" min={form.data_start || todayStr()} value={form.data_sfarsit}
                onChange={e => set('data_sfarsit', e.target.value)} className="field" />
            </div>
          </div>

          {/* Banner disponibilitate */}
          {form.categorie_id && datesValid && (
            <div className="mt-3">
              {checking ? (
                <div className="flex items-center gap-2 rounded-xl bg-ink-50 px-3 py-2.5 text-sm text-ink-500 dark:bg-ink-800/50">
                  <IconSpinner size={16} className="animate-spin" /> Verific disponibilitatea…
                </div>
              ) : dispo ? (
                dispo.disponibile > 0 ? (
                  <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
                    <IconCheck size={17} weight="bold" className="shrink-0" />
                    <span>{dispo.disponibile} din {dispo.total} {selectedCat?.nume ? '' : 'utilaje'} disponibile in acest interval.</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 rounded-xl bg-amber-50 px-3 py-2.5 text-sm font-medium text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
                    <IconUtilaj size={17} className="shrink-0" />
                    <span>Toate sunt ocupate in acest interval. Poti trimite totusi — biroul va decide.</span>
                  </div>
                )
              ) : null}
            </div>
          )}
        </section>

        {/* 3. Lucrare */}
        <section>
          <StepHead n={3} title="Pentru ce lucrare?" hint="Alege lucrarea si adauga detalii daca vrei." done={!!form.lucrare_id} />
          <Select value={form.lucrare_id} onChange={v => set('lucrare_id', v)} placeholder="Alege lucrarea"
            options={lucrari.map(l => ({ value: String(l.id), label: l.nume }))} />
          <textarea value={form.nota} onChange={e => set('nota', e.target.value)} rows={2}
            className="field mt-2.5 resize-none" placeholder="Detalii (optional): ex. ce ai de facut, unde anume…" />
        </section>

        {/* 4. Subcontractanti */}
        <section>
          <StepHead n={4} title="Cine va lucra cu utilajul?" hint="Bifeaza unul sau mai multi subcontractanti." done={form.subcontractanti_ids.length > 0} />
          {subcontractanti.length === 0 ? (
            <p className="rounded-xl bg-ink-50 px-3 py-2.5 text-sm text-ink-500 dark:bg-ink-800/50">
              Nu exista subcontractanti. Cere biroului sa adauge in pagina Persoane.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {subcontractanti.map(p => {
                const sel = form.subcontractanti_ids.includes(p.id);
                return (
                  <button key={p.id} type="button" onClick={() => toggleSub(p.id)}
                    className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all ${
                      sel
                        ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/20 dark:border-brand-500 dark:bg-brand-500/10'
                        : 'border-ink-200 hover:border-ink-300 hover:bg-ink-50 dark:border-ink-700 dark:hover:border-ink-600 dark:hover:bg-ink-800/50'
                    }`}>
                    <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors ${
                      sel ? 'border-brand-600 bg-brand-600 text-white' : 'border-ink-300 dark:border-ink-600'
                    }`}>
                      {sel && <IconCheck size={13} weight="bold" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-ink-800 dark:text-ink-200">{p.nume}</span>
                      {p.telefon && <span className="block truncate text-xs text-ink-400">{p.telefon}</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Trimite */}
        <div className="border-t border-ink-100 pt-5 dark:border-ink-800">
          <button onClick={handleSubmit} disabled={!canSubmit || submitting}
            className="btn-primary h-12 w-full text-[15px] disabled:cursor-not-allowed disabled:opacity-50">
            {submitting ? <><IconSpinner size={18} className="animate-spin" /> Se trimite…</> : <><IconRequest size={18} weight="fill" /> Trimite solicitarea</>}
          </button>
          {!canSubmit && !submitting && (
            <p className="mt-2 text-center text-xs text-ink-400">
              Completeaza categoria, perioada, lucrarea si cel putin un subcontractant.
            </p>
          )}
        </div>
      </div>
    </>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-3 lg:space-y-6">
      {/* Antet - mobil, doar butonul + pentru solicitare noua (titlul e in bara de sus) */}
      <div className="flex items-center justify-end gap-3 lg:hidden">
        <button
          onClick={() => setFormOpen(true)}
          className="btn-primary h-10 w-10 shrink-0 rounded-full p-0"
          aria-label="Solicita un utilaj"
          title="Solicita un utilaj"
        >
          <IconPlus size={19} weight="bold" />
        </button>
      </div>

      {/* FORMULAR - inline pe laptop */}
      <div className="hidden lg:block">
        {formBody}
      </div>

      {/* FORMULAR - modal pe mobil, deschis din butonul + */}
      <Modal isOpen={formOpen} onClose={requestCloseForm} title="Solicita un utilaj" size="lg">
        {formBody}
        <button
          type="button"
          onClick={requestCloseForm}
          className="mt-3 block w-full text-center text-sm font-medium text-ink-500 hover:text-ink-700 dark:hover:text-ink-300"
        >
          Iesi fara sa trimiti
        </button>
      </Modal>

      {/* Confirmare renuntare - datele completate se pierd */}
      <Modal isOpen={confirmDiscard} onClose={() => setConfirmDiscard(false)} title="Renunti la solicitare?" size="sm">
        <p className="text-sm text-ink-600 dark:text-ink-300">
          Daca iesi acum, tot ce ai completat pana acum se va pierde.
        </p>
        <div className="mt-5 flex gap-2.5">
          <button
            type="button"
            onClick={() => setConfirmDiscard(false)}
            className="btn-ghost h-10 flex-1"
          >
            Continua completarea
          </button>
          <button
            type="button"
            onClick={discardForm}
            className="h-10 flex-1 rounded-xl bg-red-600 text-sm font-semibold text-white transition-colors hover:bg-red-700"
          >
            Iesi si renunta
          </button>
        </div>
      </Modal>

      {/* SOLICITARILE MELE */}
      <div>
        <h2 className="mb-3 hidden text-[15px] font-semibold text-ink-900 dark:text-white lg:block">Solicitarile mele</h2>
        {mine.length === 0 ? (
          <div className="card py-10 text-center text-sm text-ink-500">
            Nu ai trimis inca nicio solicitare.
            <button onClick={() => setFormOpen(true)} className="mt-3 block text-sm font-medium text-brand-600 lg:hidden">
              Trimite prima solicitare
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {mine.map(sol => (
              <div key={sol.id} className="card p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <StatusBadge status={sol.status} />
                  <span className="text-[11px] text-ink-400">{fmtDate((sol.created_at || '').slice(0, 10))}</span>
                </div>
                <SolicitareBody sol={sol} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
