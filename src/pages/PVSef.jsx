import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useToast } from '../App';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { IconClipboard, IconDownload, IconUtilaj, IconCalendar, IconOpen } from '../components/icons';

function fmtDate(d) {
  if (!d) return '—';
  const [y, m, day] = String(d).split('-');
  return y && m && day ? `${day}.${m}.${y}` : d;
}

function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-ink-100 py-2 text-sm last:border-0 dark:border-ink-800">
      <span className="text-ink-500">{label}</span>
      <span className="text-right font-medium text-ink-800 dark:text-ink-200">{value ?? '—'}</span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-400">{title}</p>
      <div className="rounded-xl border border-ink-200/80 px-3 dark:border-ink-800">{children}</div>
    </div>
  );
}

export default function PVSef() {
  const toast = useToast();
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try { setLista(await api.get('/pvp')); }
      catch (e) { toast('Eroare la incarcare: ' + e.message, 'error'); }
      finally { setLoading(false); }
    })();
  }, []); // eslint-disable-line

  const openDetail = async (pv) => {
    setSelected(pv);
    setDetail(null);
    setDetailLoading(true);
    try { setDetail(await api.get(`/pvp/${pv.id}`)); }
    catch (e) { toast('Eroare: ' + e.message, 'error'); }
    finally { setDetailLoading(false); }
  };

  const closeDetail = () => { setSelected(null); setDetail(null); };

  return (
    <div className="mx-auto max-w-3xl space-y-3 lg:space-y-6">
      {/* Antet */}
      <div className="hidden items-center gap-3 lg:flex">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-600 text-white shadow-sm">
          <IconClipboard size={22} weight="fill" />
        </span>
        <div>
          <h1 className="text-xl font-semibold text-ink-900 dark:text-white">Procese verbale</h1>
          <p className="text-sm text-ink-500">Procesele verbale in care ai fost mentionat ca sef de santier.</p>
        </div>
      </div>
      <h1 className="text-lg font-semibold text-ink-900 dark:text-white lg:hidden">Procesele mele verbale</h1>

      {/* Lista */}
      {loading ? (
        <div className="space-y-2.5">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="card h-24 animate-pulse" />)}
        </div>
      ) : lista.length === 0 ? (
        <div className="card py-14 text-center text-sm text-ink-500">
          <IconClipboard size={28} className="mx-auto mb-2 text-ink-300" />
          Nu esti mentionat inca in niciun proces verbal.
        </div>
      ) : (
        <div className="space-y-2.5">
          {lista.map(pv => (
            <button
              key={pv.id}
              onClick={() => openDetail(pv)}
              className="card flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-ink-50/70 active:scale-[0.99] dark:hover:bg-ink-800/40"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                <IconUtilaj size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="mb-1 flex items-center gap-2">
                  <span className="truncate font-semibold text-ink-900 dark:text-white">{pv.utilaj_denumire}</span>
                  <StatusBadge status={pv.status} />
                </span>
                <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-ink-500">
                  {pv.lucrare_nume && <span className="truncate">{pv.lucrare_nume}</span>}
                  <span className="flex items-center gap-1">
                    <IconCalendar size={13} /> {fmtDate(pv.data_predare)}
                    {pv.status === 'inchis' && ` – ${fmtDate(pv.data_primire)}`}
                  </span>
                </span>
              </span>
              <IconOpen size={16} className="shrink-0 text-ink-300" />
            </button>
          ))}
        </div>
      )}

      {/* Detaliu */}
      <Modal isOpen={!!selected} onClose={closeDetail} title={selected ? `PV #${selected.id} — ${selected.utilaj_denumire}` : ''} size="lg">
        {detailLoading || !detail ? (
          <div className="space-y-3">
            <div className="h-6 w-1/3 animate-pulse rounded bg-ink-100 dark:bg-ink-800" />
            <div className="h-32 animate-pulse rounded-xl bg-ink-100 dark:bg-ink-800" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <StatusBadge status={detail.status} size="md" />
              {detail.lucrare_nume && <span className="text-sm text-ink-500">{detail.lucrare_nume}</span>}
            </div>

            <Section title="Predare">
              <Row label="Data predare" value={fmtDate(detail.data_predare)} />
              <Row label="Responsabil" value={detail.responsabil_predare} />
              <Row label="Persoana primire" value={detail.persoana_primire_display} />
              <Row label="Subcontractant" value={detail.subcontractant_nume} />
              <Row label="Stare la predare" value={detail.stare_predare && detail.stare_predare.charAt(0).toUpperCase() + detail.stare_predare.slice(1)} />
              <Row label="Ore contor" value={detail.ore_contor_predare != null ? `${detail.ore_contor_predare} h` : null} />
              <Row label="Motorina" value={detail.motorina_predare != null ? `${detail.motorina_predare}%` : null} />
              {detail.observatii_predare && <Row label="Observatii" value={detail.observatii_predare} />}
            </Section>

            {detail.status === 'inchis' && (
              <Section title="Primire">
                <Row label="Data primire" value={fmtDate(detail.data_primire)} />
                <Row label="Responsabil" value={detail.responsabil_primire} />
                <Row label="Stare la primire" value={detail.stare_primire && detail.stare_primire.charAt(0).toUpperCase() + detail.stare_primire.slice(1)} />
                <Row label="Ore contor" value={detail.ore_contor_primire != null ? `${detail.ore_contor_primire} h` : null} />
                <Row label="Motorina" value={detail.motorina_primire != null ? `${detail.motorina_primire}%` : null} />
                {detail.observatii_primire && <Row label="Observatii" value={detail.observatii_primire} />}
                {detail.probleme_constatate && <Row label="Probleme constatate" value={detail.probleme_constatate} />}
              </Section>
            )}

            {detail.accesorii?.length > 0 && (
              <Section title="Accesorii">
                {detail.accesorii.map(acc => (
                  <Row key={acc.id} label={acc.denumire} value={`Predat: ${acc.predat ? 'da' : 'nu'} · Primit: ${acc.primit ? 'da' : 'nu'}`} />
                ))}
              </Section>
            )}

            {detail.poze?.length > 0 && (
              <Section title="Poze">
                <div className="grid grid-cols-3 gap-2 py-3 sm:grid-cols-4">
                  {detail.poze.map(p => (
                    <a key={p.id} href={p.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-ink-200 dark:border-ink-700">
                      <img src={p.url} alt="" className="h-20 w-full object-cover" />
                    </a>
                  ))}
                </div>
              </Section>
            )}

            <div className="flex gap-2.5 border-t border-ink-100 pt-4 dark:border-ink-800">
              <a
                href={`/procese-verbale/${detail.id}/print`}
                target="_blank"
                rel="noreferrer"
                className="btn-primary h-11 flex-1"
              >
                <IconDownload size={17} weight="bold" /> Descarca PDF
              </a>
              <button type="button" onClick={closeDetail} className="btn-ghost h-11 px-5">Inchide</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
