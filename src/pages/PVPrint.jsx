import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';
import { IconPrinter } from '../components/icons';

export default function PVPrint() {
  const { id } = useParams();
  const [pv, setPv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get(`/pvp/${id}`)
      .then(data => { setPv(data); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [id]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Arial, sans-serif' }}>
      Se incarca...
    </div>
  );

  if (error || !pv) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Arial, sans-serif', color: 'red' }}>
      Eroare: {error || 'PV negasit'}
    </div>
  );

  const pozeP = (pv.poze || []).filter(p => p.etapa === 'predare');
  const pozeR = (pv.poze || []).filter(p => p.etapa === 'primire');
  const accesorii = pv.accesorii || [];

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
          .page { box-shadow: none !important; margin: 0 !important; border-radius: 0 !important; }
          .pv-scroll { position: static !important; overflow: visible !important; height: auto !important; }
        }
        body { background: #e5e7eb; margin: 0; font-family: Arial, Helvetica, sans-serif; }
        * { box-sizing: border-box; }
      `}</style>

      <div className="pv-scroll scroll-area" style={{ position: 'absolute', inset: 0, overflowY: 'auto', background: '#e5e7eb' }}>

      {/* Toolbar - ascuns la print */}
      <div className="no-print" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: '#264fd0', color: 'white', padding: '10px 20px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>Proces Verbal #{pv.id} — {pv.utilaj_denumire}</span>
        <button
          onClick={() => window.print()}
          style={{
            marginLeft: 'auto', background: 'white', color: '#264fd0',
            border: 'none', borderRadius: 8, padding: '7px 18px',
            fontWeight: 600, fontSize: 14, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 8,
          }}
        >
          <IconPrinter size={16} weight="bold" /> Printeaza / Salveaza PDF
        </button>
        <button
          onClick={() => window.close()}
          style={{
            background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.4)',
            borderRadius: 6, padding: '7px 14px', fontSize: 13, cursor: 'pointer',
          }}
        >
          Inchide
        </button>
      </div>

      {/* Pagina A4 */}
      <div className="page" style={{
        width: '210mm', minHeight: '297mm', margin: '60px auto 40px',
        background: 'white', padding: '20mm 18mm',
        boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
        borderRadius: 4, fontSize: 11,
      }}>

        {/* Header */}
        <div style={{ textAlign: 'center', borderBottom: '2px solid #1e40af', paddingBottom: 12, marginBottom: 18 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#1e40af', letterSpacing: 1 }}>
            PROCES VERBAL DE PREDARE-PRIMIRE
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
            Nr. {pv.id} &nbsp;|&nbsp; Status: <strong style={{ color: pv.status === 'inchis' ? '#16a34a' : '#d97706' }}>
              {pv.status === 'inchis' ? 'INCHIS' : 'DESCHIS'}
            </strong>
          </div>
        </div>

        {/* Date generale */}
        <Section title="DATE GENERALE">
          <Row label="Utilaj" value={pv.utilaj_denumire || '—'} />
          <Row label="Lucrare" value={pv.lucrare_nume || '—'} />
        </Section>

        {/* Predare */}
        <Section title="PREDARE">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 20px' }}>
            <Row label="Data predare" value={pv.data_predare || '—'} />
            <Row label="Responsabil utilaj" value={pv.responsabil_predare || '—'} />
            <Row label="Persoana primire" value={pv.persoana_primire_display || pv.persoana_primire_text || '—'} />
            <Row label="Stare la predare" value={pv.stare_predare || '—'} />
            <Row label="Ore contor predare" value={pv.ore_contor_predare != null ? `${pv.ore_contor_predare} h` : '—'} />
            <Row label="Motorina predare" value={pv.motorina_predare != null ? `${pv.motorina_predare}%` : '—'} />
          </div>
          {pv.observatii_predare && (
            <Row label="Observatii" value={pv.observatii_predare} />
          )}
        </Section>

        {/* Primire */}
        {pv.status === 'inchis' && (
          <Section title="PRIMIRE">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 20px' }}>
              <Row label="Data primire" value={pv.data_primire || '—'} />
              <Row label="Responsabil primire" value={pv.responsabil_primire || '—'} />
              <Row label="Stare la primire" value={pv.stare_primire || '—'} />
              <Row label="Ore contor primire" value={pv.ore_contor_primire != null ? `${pv.ore_contor_primire} h` : '—'} />
              <Row label="Motorina primire" value={pv.motorina_primire != null ? `${pv.motorina_primire}%` : '—'} />
            </div>
            {pv.observatii_primire && (
              <Row label="Observatii" value={pv.observatii_primire} />
            )}
          </Section>
        )}

        {/* Accesorii */}
        {accesorii.length > 0 && (
          <Section title="ACCESORII">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: '#f3f4f6' }}>
                  <th style={thStyle}>Denumire</th>
                  <th style={{ ...thStyle, textAlign: 'center', width: 80 }}>Predat</th>
                  <th style={{ ...thStyle, textAlign: 'center', width: 80 }}>Primit</th>
                </tr>
              </thead>
              <tbody>
                {accesorii.map((acc, i) => (
                  <tr key={acc.id ?? i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={tdStyle}>{acc.denumire}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>{acc.predat ? '✓' : '—'}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>{acc.primit ? '✓' : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        )}

        {/* Semnaturi */}
        {(pv.semnatura_predare || pv.semnatura_primire) && (
          <Section title="SEMNATURI">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 6 }}>Semnatura predare</div>
                {pv.semnatura_predare
                  ? <img src={pv.semnatura_predare} alt="Semnatura predare" style={{ maxWidth: '100%', height: 80, objectFit: 'contain', border: '1px solid #e5e7eb', borderRadius: 4 }} />
                  : <div style={{ height: 80, border: '1px dashed #d1d5db', borderRadius: 4 }} />
                }
                <div style={{ marginTop: 6, fontSize: 10, color: '#374151' }}>{pv.responsabil_predare || ''}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 6 }}>Semnatura primire</div>
                {pv.semnatura_primire
                  ? <img src={pv.semnatura_primire} alt="Semnatura primire" style={{ maxWidth: '100%', height: 80, objectFit: 'contain', border: '1px solid #e5e7eb', borderRadius: 4 }} />
                  : <div style={{ height: 80, border: '1px dashed #d1d5db', borderRadius: 4 }} />
                }
                <div style={{ marginTop: 6, fontSize: 10, color: '#374151' }}>{pv.responsabil_primire || ''}</div>
              </div>
            </div>
          </Section>
        )}

        {/* Poze predare */}
        {pozeP.length > 0 && (
          <Section title="POZE PREDARE">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {pozeP.map(poza => (
                <img key={poza.id} src={poza.url} alt="" style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 4, border: '1px solid #e5e7eb' }} />
              ))}
            </div>
          </Section>
        )}

        {/* Poze primire */}
        {pozeR.length > 0 && (
          <Section title="POZE PRIMIRE">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {pozeR.map(poza => (
                <img key={poza.id} src={poza.url} alt="" style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 4, border: '1px solid #e5e7eb' }} />
              ))}
            </div>
          </Section>
        )}

        {/* Footer */}
        <div style={{ marginTop: 24, paddingTop: 10, borderTop: '1px solid #e5e7eb', textAlign: 'center', color: '#9ca3af', fontSize: 10 }}>
          Document generat de Gestiune Utilaje
        </div>
      </div>
      </div>
    </>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        background: '#1e40af', color: 'white', fontWeight: 700, fontSize: 10,
        padding: '4px 10px', borderRadius: '3px 3px 0 0', letterSpacing: 0.5,
      }}>
        {title}
      </div>
      <div style={{ border: '1px solid #dbeafe', borderTop: 'none', borderRadius: '0 0 3px 3px', padding: '10px 10px 6px' }}>
        {children}
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: 8, padding: '3px 0', borderBottom: '1px solid #f3f4f6' }}>
      <span style={{ color: '#6b7280', minWidth: 130, fontSize: 10, flexShrink: 0 }}>{label}:</span>
      <span style={{ fontWeight: 600, color: '#111827', fontSize: 11 }}>{value}</span>
    </div>
  );
}

const thStyle = {
  padding: '6px 8px', textAlign: 'left', fontWeight: 700,
  fontSize: 10, color: '#374151', borderBottom: '2px solid #e5e7eb',
};
const tdStyle = { padding: '5px 8px', fontSize: 11 };
