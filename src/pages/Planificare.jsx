import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../api';
import { useToast } from '../App';
import { useInbox } from '../inbox';
import Modal from '../components/Modal';
import Select from '../components/Select';
import { StatusBadge, SolicitareBody, SolicitareActions } from '../components/solicitari';
import { IconArrowLeft, IconArrowRight, IconSort, IconClipboard, IconInbox, IconClose } from '../components/icons';
import useScrollLock from '../hooks/useScrollLock';

// Formatare dată folosind ora LOCALĂ (nu UTC) — fix pentru timezone UTC+2/+3
function toDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}

function dateRange(start, end) {
  const days = [];
  let cur = new Date(start + 'T00:00:00');
  const last = new Date(end + 'T00:00:00');
  while (cur <= last) {
    days.push(toDateStr(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

function getMonthStart(dateStr) {
  return dateStr.slice(0, 7) + '-01';
}

function getMonthEnd(dateStr) {
  const [year, month] = dateStr.slice(0, 7).split('-').map(Number);
  // Ziua 0 a lunii urmatoare = ultima zi a lunii curente
  const d = new Date(year, month, 0); // month e deja 1-based, deci month = luna urmatoare
  return toDateStr(d);
}

function addMonths(dateStr, n) {
  const [y, m] = dateStr.slice(0, 7).split('-').map(Number);
  const total = (y * 12 + m - 1) + n;
  const newY = Math.floor(total / 12);
  const newM = (total % 12) + 1;
  return `${newY}-${String(newM).padStart(2, '0')}-01`;
}

function getWeekStart(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay(); // 0=dum, 1=lun, ..., 6=sam
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1)); // aliniaza la luni
  return toDateStr(d);
}

const DAY_WIDTHS = { week: 65, '2weeks': 50, month: 34, '3months': 24 };
const ROW_HEIGHT = 52;
const DAY_NAMES = ['Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sa', 'Du'];

export default function Planificare() {
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const inbox = useInbox();
  const today = toDateStr(new Date());

  const [solicitari, setSolicitari] = useState([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [highlightId, setHighlightId] = useState(null);

  useScrollLock(panelOpen);

  const [planificari, setPlanificari] = useState([]);
  const [utilaje, setUtilaje] = useState([]);
  const [categorii, setCategorii] = useState([]);
  const [lucrari, setLucrari] = useState([]);
  const [persoane, setPersoane] = useState([]);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState('2weeks');
  const [windowStart, setWindowStart] = useState(() => getWeekStart(today));

  const [filterCategorie, setFilterCategorie] = useState('');
  const [filterUtilaj, setFilterUtilaj] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [form, setForm] = useState({ utilaj_id: '', lucrare_id: '', persoana_id: '', data_start: '', data_sfarsit: '', observatii: '' });
  const [shiftDays, setShiftDays] = useState('');

  const [decalareOpen, setDecalareOpen] = useState(false);
  const [decalareForm, setDecalareForm] = useState({ zile: '', data_referinta: today, selectedUtilaje: [] });

  const drag = useRef(null);
  const [dragState, setDragState] = useState(null);
  const isDragging = useRef(false);

  const windowEnd = (() => {
    if (viewMode === 'week') return addDays(windowStart, 6);
    if (viewMode === '2weeks') return addDays(windowStart, 13);
    if (viewMode === '3months') return getMonthEnd(addMonths(windowStart, 2));
    return getMonthEnd(windowStart);
  })();
  const days = dateRange(windowStart, windowEnd);
  const DAY_WIDTH = DAY_WIDTHS[viewMode];

  const monthBands = viewMode === '3months' ? (() => {
    const bands = [];
    let cur = null;
    for (const day of days) {
      const key = day.slice(0, 7);
      if (!cur || cur.key !== key) {
        cur = { key, days: [day], label: new Date(day + 'T00:00:00').toLocaleDateString('ro-RO', { month: 'short', year: 'numeric' }) };
        bands.push(cur);
      } else {
        cur.days.push(day);
      }
    }
    return bands;
  })() : [];

  const goToday = () => {
    if (viewMode === 'month' || viewMode === '3months') setWindowStart(getMonthStart(today));
    else setWindowStart(getWeekStart(today));
  };

  const navPrev = () => {
    if (viewMode === 'week') setWindowStart(addDays(windowStart, -7));
    else if (viewMode === '2weeks') setWindowStart(addDays(windowStart, -14));
    else if (viewMode === '3months') setWindowStart(addMonths(windowStart, -3));
    else {
      // Aritmetica directa pe an/luna — evita bug-ul de timezone cu Date.setMonth
      const [y, m] = windowStart.slice(0, 7).split('-').map(Number);
      const newM = m === 1 ? 12 : m - 1;
      const newY = m === 1 ? y - 1 : y;
      setWindowStart(`${newY}-${String(newM).padStart(2, '0')}-01`);
    }
  };

  const navNext = () => {
    if (viewMode === 'week') setWindowStart(addDays(windowStart, 7));
    else if (viewMode === '2weeks') setWindowStart(addDays(windowStart, 14));
    else if (viewMode === '3months') setWindowStart(addMonths(windowStart, 3));
    else {
      const [y, m] = windowStart.slice(0, 7).split('-').map(Number);
      const newM = m === 12 ? 1 : m + 1;
      const newY = m === 12 ? y + 1 : y;
      setWindowStart(`${newY}-${String(newM).padStart(2, '0')}-01`);
    }
  };

  const switchView = (mode) => {
    setViewMode(mode);
    if (mode === 'month' || mode === '3months') setWindowStart(getMonthStart(windowStart));
    else setWindowStart(getWeekStart(windowStart));
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, u, c, l, per] = await Promise.all([
        api.get(`/planificari?data_start=${windowStart}&data_sfarsit=${windowEnd}`),
        api.get('/utilaje'),
        api.get('/lucrari/categorii'),
        api.get('/lucrari'),
        api.get('/persoane'),
      ]);
      setPlanificari(p); setUtilaje(u); setCategorii(c); setLucrari(l); setPersoane(per);
    } catch (e) {
      toast('Eroare la incarcare: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [windowStart, windowEnd]);

  useEffect(() => { load(); }, [load]);

  const loadSolicitari = useCallback(async () => {
    try {
      const all = await api.get('/solicitari');
      setSolicitari(all.filter(s => s.status === 'noua'));
    } catch (e) { /* silent */ }
  }, []);

  useEffect(() => { loadSolicitari(); }, [loadSolicitari]);

  // Deschidere din butonul "Vezi in planificare" al inbox-ului
  useEffect(() => {
    const id = location.state?.solicitareId;
    if (id) {
      setPanelOpen(true);
      setHighlightId(id);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, []); // eslint-disable-line

  const onSolicitareDone = () => {
    loadSolicitari();
    load();
    inbox?.refreshCount();
  };

  useEffect(() => {
    const onMouseUp = () => {
      if (isDragging.current && drag.current) {
        const { utilajId, startDay, endDay } = drag.current;
        const start = startDay <= endDay ? startDay : endDay;
        const end = startDay <= endDay ? endDay : startDay;
        setEditingPlan(null);
        setShiftDays('');
        setForm({ utilaj_id: String(utilajId), lucrare_id: '', persoana_id: '', data_start: start, data_sfarsit: end, observatii: '' });
        setModalOpen(true);
      }
      isDragging.current = false;
      drag.current = null;
      setDragState(null);
    };
    document.addEventListener('mouseup', onMouseUp);
    return () => document.removeEventListener('mouseup', onMouseUp);
  }, []);

  const filteredUtilaje = utilaje.filter(u => {
    if (filterCategorie && String(u.categorie_id) !== String(filterCategorie)) return false;
    if (filterUtilaj && String(u.id) !== String(filterUtilaj)) return false;
    return true;
  });

  const openEdit = (plan, e) => {
    e.stopPropagation();
    setEditingPlan(plan);
    setShiftDays('');
    setForm({
      utilaj_id: String(plan.utilaj_id),
      lucrare_id: String(plan.lucrare_id || ''),
      persoana_id: String(plan.persoana_id || ''),
      data_start: plan.data_start,
      data_sfarsit: plan.data_sfarsit,
      observatii: plan.observatii || '',
    });
    setModalOpen(true);
  };

  const applyShift = () => {
    const n = parseInt(shiftDays);
    if (!n || isNaN(n)) return;
    setForm(f => ({ ...f, data_start: addDays(f.data_start, n), data_sfarsit: addDays(f.data_sfarsit, n) }));
    setShiftDays('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingPlan) {
        await api.put(`/planificari/${editingPlan.id}`, form);
        toast('Planificare actualizata!');
      } else {
        await api.post('/planificari', form);
        toast('Planificare adaugata!');
      }
      setModalOpen(false);
      load();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const handleDelete = async () => {
    if (!editingPlan || !confirm('Stergi aceasta planificare?')) return;
    try {
      await api.delete(`/planificari/${editingPlan.id}`);
      toast('Planificare stearsa!');
      setModalOpen(false);
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const handleDecalare = async (e) => {
    e.preventDefault();
    const zile = parseInt(decalareForm.zile);
    if (!zile || isNaN(zile)) { toast('Introdu numarul de zile', 'error'); return; }
    try {
      const payload = { zile, data_referinta: decalareForm.data_referinta };
      if (decalareForm.selectedUtilaje.length > 0) payload.utilaj_ids = decalareForm.selectedUtilaje;
      const res = await api.post('/planificari/decalare', payload);
      toast(`Decalare aplicata: ${zile > 0 ? '+' : ''}${zile} zile (${res.afectate} planificari)`);
      setDecalareOpen(false);
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const getBarStyle = (plan) => {
    const start = plan.data_start < windowStart ? windowStart : plan.data_start;
    const end = plan.data_sfarsit > windowEnd ? windowEnd : plan.data_sfarsit;
    const startIdx = days.indexOf(start);
    const endIdx = days.indexOf(end);
    if (startIdx < 0 || endIdx < 0) return null;
    return { left: startIdx * DAY_WIDTH, width: Math.max((endIdx - startIdx + 1) * DAY_WIDTH - 4, 16) };
  };

  const isDragHighlighted = (utilajId, day) => {
    if (!dragState || String(dragState.utilajId) !== String(utilajId)) return false;
    const s = dragState.startDay <= dragState.endDay ? dragState.startDay : dragState.endDay;
    const e = dragState.startDay <= dragState.endDay ? dragState.endDay : dragState.startDay;
    return day >= s && day <= e;
  };

  const windowLabel = viewMode === 'month'
    ? new Date(windowStart + 'T00:00:00').toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' })
    : viewMode === '3months'
    ? `${new Date(windowStart + 'T00:00:00').toLocaleDateString('ro-RO', { month: 'short', year: 'numeric' })} — ${new Date(addMonths(windowStart, 2) + 'T00:00:00').toLocaleDateString('ro-RO', { month: 'short', year: 'numeric' })}`
    : `${windowStart} — ${windowEnd}`;

  const inputCls = "field";

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={goToday} className="btn-primary h-[38px]">Azi</button>
        <div className="flex items-center gap-1">
          <button onClick={navPrev} className="grid h-[38px] w-[38px] place-items-center rounded-lg border border-ink-200 text-ink-600 transition-colors hover:bg-ink-100 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800" aria-label="Anterior">
            <IconArrowLeft size={16} weight="bold" />
          </button>
          <button onClick={navNext} className="grid h-[38px] w-[38px] place-items-center rounded-lg border border-ink-200 text-ink-600 transition-colors hover:bg-ink-100 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800" aria-label="Urmator">
            <IconArrowRight size={16} weight="bold" />
          </button>
        </div>
        <span className="min-w-48 text-center text-sm font-medium capitalize text-ink-700 dark:text-ink-300">
          {windowLabel}
        </span>

        <div className="ml-1 flex overflow-hidden rounded-lg border border-ink-200 p-0.5 dark:border-ink-700">
          {[['week', 'Săpt.'], ['2weeks', '2 Săpt.'], ['month', 'Lună'], ['3months', '3 Luni']].map(([mode, label]) => (
            <button key={mode} onClick={() => switchView(mode)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === mode
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800'
              }`}>
              {label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="w-44">
            <Select value={filterUtilaj} onChange={setFilterUtilaj} placeholder="Toate utilajele"
              options={[{ value: '', label: 'Toate utilajele' }, ...utilaje.map(u => ({ value: String(u.id), label: u.denumire }))]} />
          </div>
          <div className="w-44">
            <Select value={filterCategorie} onChange={setFilterCategorie} placeholder="Toate categoriile"
              options={[{ value: '', label: 'Toate categoriile' }, ...categorii.map(c => ({ value: String(c.id), label: c.nume }))]} />
          </div>
          <button onClick={() => { setDecalareForm({ zile: '', data_referinta: today, selectedUtilaje: [] }); setDecalareOpen(true); }}
            className="btn-ghost">
            <IconSort size={16} /> Decalare
          </button>
          <button onClick={() => { setHighlightId(null); setPanelOpen(true); }}
            className="btn-ghost relative">
            <IconInbox size={16} /> Solicitari
            {solicitari.length > 0 && (
              <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-amber-500 px-1 text-[11px] font-bold text-white">
                {solicitari.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card h-96 animate-pulse" />
      ) : (
        <div className="card select-none overflow-hidden">
          <div className="scroll-area overflow-x-auto">
            <div style={{ minWidth: 200 + days.length * DAY_WIDTH }}>
              {/* Header */}
              <div className="bg-ink-50 dark:bg-ink-700/50 sticky top-0 z-10">
                {/* Banda luni — doar pentru view 3 luni */}
                {viewMode === '3months' && (
                  <div className="flex border-b border-ink-200 dark:border-ink-700">
                    <div style={{ width: 200, minWidth: 200 }} className="border-r border-ink-200 dark:border-ink-600" />
                    <div className="flex">
                      {monthBands.map(band => (
                        <div key={band.key} style={{ width: band.days.length * DAY_WIDTH }}
                          className="text-xs font-semibold text-ink-600 dark:text-ink-300 text-center py-1 border-r border-ink-200 dark:border-ink-600 capitalize truncate px-1">
                          {band.label}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex border-b border-ink-200 dark:border-ink-700">
                  <div style={{ width: 200, minWidth: 200 }}
                    className="px-4 py-2 text-xs font-medium text-ink-600 dark:text-ink-300 border-r border-ink-200 dark:border-ink-600">
                    Utilaj
                  </div>
                  <div className="flex">
                    {days.map(day => {
                      const d = new Date(day + 'T00:00:00');
                      const dayName = DAY_NAMES[d.getDay() === 0 ? 6 : d.getDay() - 1];
                      const isToday = day === today;
                      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                      return (
                        <div key={day} style={{ width: DAY_WIDTH }}
                          className={`border-r border-ink-100 dark:border-ink-700 text-center py-1 ${
                            isToday ? 'bg-brand-100 dark:bg-brand-900/40' : isWeekend ? 'bg-ink-100 dark:bg-ink-700/60' : ''
                          }`}>
                          {viewMode === '3months'
                            ? <p className={`font-semibold leading-none ${isToday ? 'text-brand-600 dark:text-brand-400' : 'text-ink-600 dark:text-ink-400'}`} style={{ fontSize: 9 }}>
                                {day.slice(8)}
                              </p>
                            : viewMode !== 'month'
                            ? <>
                                <p className="text-xs text-ink-400 dark:text-ink-500 leading-none">{dayName}</p>
                                <p className={`text-xs font-semibold mt-0.5 ${isToday ? 'text-brand-600 dark:text-brand-400' : 'text-ink-700 dark:text-ink-300'}`}>
                                  {day.slice(8)}
                                </p>
                              </>
                            : <>
                                <p className={`text-xs font-semibold leading-none ${isToday ? 'text-brand-600 dark:text-brand-400' : 'text-ink-700 dark:text-ink-300'}`}>
                                  {day.slice(8)}
                                </p>
                                <p className="text-ink-400 dark:text-ink-500 leading-none mt-0.5" style={{ fontSize: 9 }}>{dayName}</p>
                              </>
                          }
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Rows */}
              {filteredUtilaje.map(utilaj => {
                const myPlans = planificari.filter(p =>
                  String(p.utilaj_id) === String(utilaj.id) &&
                  p.data_start <= windowEnd && p.data_sfarsit >= windowStart
                );
                return (
                  <div key={utilaj.id} className="flex border-b border-ink-100 dark:border-ink-700" style={{ height: ROW_HEIGHT }}>
                    <div style={{ width: 200, minWidth: 200 }}
                      className="px-4 flex items-center gap-2 border-r border-ink-200 dark:border-ink-600 shrink-0 bg-white dark:bg-ink-800">
                      {utilaj.categorie_culoare && (
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: utilaj.categorie_culoare }} />
                      )}
                      <p className="text-xs font-medium text-ink-900 dark:text-white leading-tight break-words min-w-0">{utilaj.denumire}</p>
                    </div>
                    {/* Gantt area */}
                    <div className="relative flex" style={{ width: days.length * DAY_WIDTH }}>
                      {days.map(day => {
                        const d = new Date(day + 'T00:00:00');
                        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                        const isToday = day === today;
                        const highlighted = isDragHighlighted(utilaj.id, day);
                        return (
                          <div key={day} style={{ width: DAY_WIDTH }}
                            className={`h-full border-r border-ink-100 dark:border-ink-700 cursor-crosshair ${
                              highlighted
                                ? 'bg-brand-100 dark:bg-brand-900/30'
                                : isToday ? 'bg-brand-50/40 dark:bg-brand-900/10'
                                : isWeekend ? 'bg-ink-50 dark:bg-ink-700/30'
                                : 'hover:bg-ink-50/60 dark:hover:bg-ink-700/20'
                            }`}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              isDragging.current = true;
                              drag.current = { utilajId: utilaj.id, startDay: day, endDay: day };
                              setDragState({ utilajId: utilaj.id, startDay: day, endDay: day });
                            }}
                            onMouseEnter={() => {
                              if (isDragging.current && drag.current && String(drag.current.utilajId) === String(utilaj.id)) {
                                drag.current = { ...drag.current, endDay: day };
                                setDragState({ ...drag.current });
                              }
                            }}
                          />
                        );
                      })}

                      {/* Plan bars */}
                      {myPlans.map(plan => {
                        const style = getBarStyle(plan);
                        if (!style) return null;
                        const color = plan.categorie_culoare || '#2450e8';
                        return (
                          <div key={plan.id}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => openEdit(plan, e)}
                            style={{
                              position: 'absolute', left: style.left, width: style.width,
                              top: 8, height: ROW_HEIGHT - 16,
                              backgroundColor: color + 'e0', borderRadius: 6,
                              cursor: 'pointer', padding: '2px 6px', zIndex: 2,
                            }}
                            className="flex items-center overflow-hidden hover:brightness-110 transition-all"
                            title={`${plan.lucrare_nume || 'Fara lucrare'} | ${plan.data_start} – ${plan.data_sfarsit}`}
                          >
                            <p className="text-white text-xs font-medium truncate select-none">
                              {plan.lucrare_nume || 'Planificat'}
                            </p>
                          </div>
                        );
                      })}

                      {/* Weekend hatching overlay — acoperă coloanele de weekend cu dungi diagonale,
                          pointer-events:none permite click-urile să ajungă la barele de sub overlay */}
                      {days.map((day, idx) => {
                        const d = new Date(day + 'T00:00:00');
                        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                        if (!isWeekend) return null;
                        return (
                          <div
                            key={`wk-${day}`}
                            style={{
                              position: 'absolute',
                              left: idx * DAY_WIDTH,
                              top: 0,
                              width: DAY_WIDTH,
                              height: '100%',
                              pointerEvents: 'none',
                              zIndex: 3,
                              backgroundImage: 'repeating-linear-gradient(45deg, transparent 0px, transparent 4px, rgba(0,0,0,0.11) 4px, rgba(0,0,0,0.11) 6px)',
                            }}
                          />
                        );
                      })}

                      {/* Drag preview */}
                      {dragState && String(dragState.utilajId) === String(utilaj.id) && (() => {
                        const s = dragState.startDay <= dragState.endDay ? dragState.startDay : dragState.endDay;
                        const e = dragState.startDay <= dragState.endDay ? dragState.endDay : dragState.startDay;
                        const sIdx = days.indexOf(s);
                        const eIdx = days.indexOf(e);
                        if (sIdx < 0 || eIdx < 0) return null;
                        return (
                          <div style={{
                            position: 'absolute',
                            left: sIdx * DAY_WIDTH + 1,
                            width: (eIdx - sIdx + 1) * DAY_WIDTH - 6,
                            top: 7, height: ROW_HEIGHT - 14,
                            backgroundColor: '#2450e830',
                            border: '2px dashed #2450e8',
                            borderRadius: 6, zIndex: 3, pointerEvents: 'none',
                          }} />
                        );
                      })()}
                    </div>
                  </div>
                );
              })}
              {filteredUtilaje.length === 0 && (
                <div className="py-8 text-center text-ink-400 text-sm">Niciun utilaj</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal planificare noua / editare */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingPlan ? 'Editeaza planificare' : 'Planificare noua'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1">Utilaj *</label>
              <Select value={form.utilaj_id} onChange={v => setForm(f => ({ ...f, utilaj_id: v }))} placeholder="Selecteaza utilaj"
                options={utilaje.map(u => ({ value: String(u.id), label: u.denumire }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1">Data start *</label>
              <input type="date" required value={form.data_start} onChange={e => setForm(f => ({ ...f, data_start: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1">Data sfarsit *</label>
              <input type="date" required value={form.data_sfarsit} onChange={e => setForm(f => ({ ...f, data_sfarsit: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1">Lucrare</label>
              <Select value={form.lucrare_id} onChange={v => setForm(f => ({ ...f, lucrare_id: v }))} placeholder="Fara lucrare"
                options={[{ value: '', label: 'Fara lucrare' }, ...lucrari.map(l => ({ value: String(l.id), label: l.nume }))]} />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1">Persoana</label>
              <Select value={form.persoana_id} onChange={v => setForm(f => ({ ...f, persoana_id: v }))} placeholder="Selecteaza persoana"
                options={persoane.map(p => ({ value: String(p.id), label: p.nume }))} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1">Observatii</label>
              <input value={form.observatii} onChange={e => setForm(f => ({ ...f, observatii: e.target.value }))} className={inputCls} />
            </div>
          </div>

          {/* Decalaj rapid — doar la editare */}
          {editingPlan && (
            <div className="border-t border-ink-100 dark:border-ink-700 pt-3">
              <p className="text-xs font-medium text-ink-500 dark:text-ink-400 mb-2">Decaleaza planificarea cu</p>
              <div className="flex items-center gap-2 flex-wrap">
                {[-7, -1, 1, 7].map(n => (
                  <button key={n} type="button"
                    onClick={() => setForm(f => ({ ...f, data_start: addDays(f.data_start, n), data_sfarsit: addDays(f.data_sfarsit, n) }))}
                    className="px-2.5 py-1 text-xs border border-ink-300 dark:border-ink-600 rounded-md hover:bg-ink-100 dark:hover:bg-ink-700 text-ink-700 dark:text-ink-300 font-mono transition-colors">
                    {n > 0 ? `+${n}z` : `${n}z`}
                  </button>
                ))}
                <div className="flex items-center gap-1 ml-1">
                  <input type="number" value={shiftDays} onChange={e => setShiftDays(e.target.value)}
                    placeholder="±zile"
                    className="w-16 border border-ink-300 dark:border-ink-600 rounded-md px-2 py-1 text-xs bg-white dark:bg-ink-700 dark:text-white outline-none focus:ring-1 focus:ring-brand-500" />
                  <button type="button" onClick={applyShift}
                    className="px-2 py-1 text-xs bg-ink-100 dark:bg-ink-700 rounded-md hover:bg-ink-200 dark:hover:bg-ink-600 text-ink-700 dark:text-ink-300 transition-colors">
                    Aplica
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="submit" className="flex-1 bg-brand-600 hover:bg-brand-700 text-white py-2 rounded-lg text-sm font-medium transition-colors">
              {editingPlan ? 'Actualizeaza' : 'Adauga'}
            </button>
            {editingPlan && (
              <button type="button" onClick={handleDelete}
                className="px-4 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 text-red-600 dark:text-red-400 py-2 rounded-lg text-sm font-medium transition-colors">
                Sterge
              </button>
            )}
            <button type="button" onClick={() => setModalOpen(false)}
              className="flex-1 bg-ink-100 dark:bg-ink-700 hover:bg-ink-200 dark:hover:bg-ink-600 text-ink-700 dark:text-ink-300 py-2 rounded-lg text-sm font-medium transition-colors">
              Anuleaza
            </button>
          </div>

          {editingPlan && (
            <div className="border-t border-ink-100 dark:border-ink-700 pt-3">
              <button
                type="button"
                onClick={() => {
                  const persoana = persoane.find(p => String(p.id) === String(form.persoana_id));
                  navigate('/procese-verbale', {
                    state: {
                      fromPlan: {
                        utilaj_id: form.utilaj_id,
                        lucrare_id: form.lucrare_id,
                        data_predare: form.data_start,
                        responsabil_predare: persoana?.nume || '',
                      }
                    }
                  });
                }}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-brand-300 py-2 text-sm font-medium text-brand-600 transition-colors hover:bg-brand-50 dark:border-brand-700 dark:text-brand-400 dark:hover:bg-brand-900/20"
              >
                <IconClipboard size={16} /> Creeaza proces verbal pentru aceasta planificare
              </button>
            </div>
          )}
        </form>
      </Modal>

      {/* Modal decalare in masa */}
      <Modal isOpen={decalareOpen} onClose={() => setDecalareOpen(false)} title="Decalare planificari in masa">
        <form onSubmit={handleDecalare} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1">
              Numar de zile <span className="text-ink-400 font-normal">(pozitiv = inainte, negativ = inapoi)</span>
            </label>
            <input type="number" required value={decalareForm.zile}
              onChange={e => setDecalareForm(f => ({ ...f, zile: e.target.value }))}
              className={inputCls} placeholder="ex: 7 sau -3" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1">
              Decaleaza planificarile cu data start dupa
            </label>
            <input type="date" required value={decalareForm.data_referinta}
              onChange={e => setDecalareForm(f => ({ ...f, data_referinta: e.target.value }))}
              className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-2">
              Utilaje <span className="text-ink-400 font-normal">(implicit toate)</span>
            </label>
            <div className="max-h-48 overflow-y-auto border border-ink-200 dark:border-ink-600 rounded-lg divide-y divide-ink-100 dark:divide-ink-700">
              <label className="flex items-center gap-2 px-3 py-2 hover:bg-ink-50 dark:hover:bg-ink-700/50 cursor-pointer">
                <input type="checkbox"
                  checked={decalareForm.selectedUtilaje.length === 0}
                  onChange={() => setDecalareForm(f => ({ ...f, selectedUtilaje: [] }))}
                  className="rounded accent-brand-600"
                />
                <span className="text-sm font-medium text-ink-700 dark:text-ink-300">Toate utilajele</span>
              </label>
              {utilaje.map(u => (
                <label key={u.id} className="flex items-center gap-2 px-3 py-2 hover:bg-ink-50 dark:hover:bg-ink-700/50 cursor-pointer">
                  <input type="checkbox"
                    checked={decalareForm.selectedUtilaje.includes(u.id)}
                    onChange={(e) => setDecalareForm(f => ({
                      ...f,
                      selectedUtilaje: e.target.checked
                        ? [...f.selectedUtilaje, u.id]
                        : f.selectedUtilaje.filter(id => id !== u.id),
                    }))}
                    className="rounded accent-brand-600"
                  />
                  <span className="text-sm text-ink-600 dark:text-ink-300">{u.denumire}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="flex-1 bg-brand-600 hover:bg-brand-700 text-white py-2 rounded-lg text-sm font-medium transition-colors">
              Aplica decalare
            </button>
            <button type="button" onClick={() => setDecalareOpen(false)}
              className="flex-1 bg-ink-100 dark:bg-ink-700 text-ink-700 dark:text-ink-300 py-2 rounded-lg text-sm font-medium transition-colors">
              Anuleaza
            </button>
          </div>
        </form>
      </Modal>

      {/* Panou lateral: solicitari in asteptare */}
      {panelOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-ink-950/40 backdrop-blur-sm" onClick={() => setPanelOpen(false)} />
          <div className="fixed inset-y-0 right-0 z-50 flex w-[calc(100vw-2rem)] max-w-[420px] flex-col border-l border-ink-200 bg-white shadow-2xl dark:border-ink-800 dark:bg-ink-900"
            style={{ touchAction: 'pan-y', overscrollBehavior: 'none' }}>
            <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3.5 dark:border-ink-800">
              <div>
                <p className="text-sm font-semibold text-ink-900 dark:text-white">Solicitari in asteptare</p>
                <p className="text-[11px] text-ink-400">Accepta pentru a crea planificarea automat</p>
              </div>
              <button onClick={() => setPanelOpen(false)}
                className="grid h-7 w-7 place-items-center rounded-lg text-ink-400 hover:bg-ink-100 hover:text-ink-600 dark:hover:bg-ink-800"
                aria-label="Inchide">
                <IconClose size={16} />
              </button>
            </div>
            <div className="scroll-area flex-1 overflow-y-auto p-3">
              {solicitari.length === 0 ? (
                <div className="grid place-items-center gap-2 py-12 text-center">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-ink-100 text-ink-400 dark:bg-ink-800">
                    <IconInbox size={24} />
                  </span>
                  <p className="text-sm text-ink-500">Nicio solicitare in asteptare</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {solicitari.map(sol => (
                    <div key={sol.id}
                      className={`rounded-xl border p-3 transition-colors ${
                        String(highlightId) === String(sol.id)
                          ? 'border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/20 dark:border-brand-500 dark:bg-brand-500/10'
                          : 'border-ink-200/70 dark:border-ink-800'
                      }`}>
                      <div className="mb-2"><StatusBadge status={sol.status} /></div>
                      <SolicitareBody sol={sol} showSolicitant />
                      <div className="mt-3">
                        <SolicitareActions sol={sol} onDone={onSolicitareDone} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
