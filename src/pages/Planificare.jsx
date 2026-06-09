import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api';
import { useToast } from '../App';
import Modal from '../components/Modal';

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
  const today = toDateStr(new Date());

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

  const inputCls = "w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none";

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={goToday}
          className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
          Azi
        </button>
        <button onClick={navPrev}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300">
          ‹
        </button>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-48 text-center capitalize">
          {windowLabel}
        </span>
        <button onClick={navNext}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300">
          ›
        </button>

        <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden ml-1">
          {[['week', 'Săpt.'], ['2weeks', '2 Săpt.'], ['month', 'Lună'], ['3months', '3 Luni']].map(([mode, label]) => (
            <button key={mode} onClick={() => switchView(mode)}
              className={`px-3 py-2 text-sm transition-colors border-r border-gray-300 dark:border-gray-600 last:border-r-0 ${
                viewMode === mode
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}>
              {label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2 flex-wrap">
          <select value={filterUtilaj} onChange={e => setFilterUtilaj(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">Toate utilajele</option>
            {utilaje.map(u => <option key={u.id} value={u.id}>{u.denumire}</option>)}
          </select>
          <select value={filterCategorie} onChange={e => setFilterCategorie(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">Toate categoriile</option>
            {categorii.map(c => <option key={c.id} value={c.id}>{c.nume}</option>)}
          </select>
          <button onClick={() => { setDecalareForm({ zile: '', data_referinta: today, selectedUtilaje: [] }); setDecalareOpen(true); }}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center gap-1">
            ↕ Decalare
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden select-none">
          <div className="overflow-x-auto">
            <div style={{ minWidth: 200 + days.length * DAY_WIDTH }}>
              {/* Header */}
              <div className="bg-gray-50 dark:bg-gray-700/50 sticky top-0 z-10">
                {/* Banda luni — doar pentru view 3 luni */}
                {viewMode === '3months' && (
                  <div className="flex border-b border-gray-200 dark:border-gray-700">
                    <div style={{ width: 200, minWidth: 200 }} className="border-r border-gray-200 dark:border-gray-600" />
                    <div className="flex">
                      {monthBands.map(band => (
                        <div key={band.key} style={{ width: band.days.length * DAY_WIDTH }}
                          className="text-xs font-semibold text-gray-600 dark:text-gray-300 text-center py-1 border-r border-gray-200 dark:border-gray-600 capitalize truncate px-1">
                          {band.label}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex border-b border-gray-200 dark:border-gray-700">
                  <div style={{ width: 200, minWidth: 200 }}
                    className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 border-r border-gray-200 dark:border-gray-600">
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
                          className={`border-r border-gray-100 dark:border-gray-700 text-center py-1 ${
                            isToday ? 'bg-blue-100 dark:bg-blue-900/40' : isWeekend ? 'bg-gray-100 dark:bg-gray-700/60' : ''
                          }`}>
                          {viewMode === '3months'
                            ? <p className={`font-semibold leading-none ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`} style={{ fontSize: 9 }}>
                                {day.slice(8)}
                              </p>
                            : viewMode !== 'month'
                            ? <>
                                <p className="text-xs text-gray-400 dark:text-gray-500 leading-none">{dayName}</p>
                                <p className={`text-xs font-semibold mt-0.5 ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                  {day.slice(8)}
                                </p>
                              </>
                            : <>
                                <p className={`text-xs font-semibold leading-none ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                  {day.slice(8)}
                                </p>
                                <p className="text-gray-400 dark:text-gray-500 leading-none mt-0.5" style={{ fontSize: 9 }}>{dayName}</p>
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
                  <div key={utilaj.id} className="flex border-b border-gray-100 dark:border-gray-700" style={{ height: ROW_HEIGHT }}>
                    <div style={{ width: 200, minWidth: 200 }}
                      className="px-4 flex items-center gap-2 border-r border-gray-200 dark:border-gray-600 shrink-0 bg-white dark:bg-gray-800">
                      {utilaj.categorie_culoare && (
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: utilaj.categorie_culoare }} />
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{utilaj.denumire}</p>
                        {utilaj.alias && <p className="text-xs text-gray-400 truncate">{utilaj.denumire}</p>}
                      </div>
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
                            className={`h-full border-r border-gray-100 dark:border-gray-700 cursor-crosshair ${
                              highlighted
                                ? 'bg-blue-100 dark:bg-blue-900/30'
                                : isToday ? 'bg-blue-50/40 dark:bg-blue-900/10'
                                : isWeekend ? 'bg-gray-50 dark:bg-gray-700/30'
                                : 'hover:bg-gray-50/60 dark:hover:bg-gray-700/20'
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
                        const color = plan.categorie_culoare || '#3b82f6';
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
                            backgroundColor: '#3b82f630',
                            border: '2px dashed #3b82f6',
                            borderRadius: 6, zIndex: 3, pointerEvents: 'none',
                          }} />
                        );
                      })()}
                    </div>
                  </div>
                );
              })}
              {filteredUtilaje.length === 0 && (
                <div className="py-8 text-center text-gray-400 text-sm">Niciun utilaj</div>
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Utilaj *</label>
              <select required value={form.utilaj_id} onChange={e => setForm(f => ({ ...f, utilaj_id: e.target.value }))} className={inputCls}>
                <option value="">-- Selecteaza --</option>
                {utilaje.map(u => <option key={u.id} value={u.id}>{u.denumire}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data start *</label>
              <input type="date" required value={form.data_start} onChange={e => setForm(f => ({ ...f, data_start: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data sfarsit *</label>
              <input type="date" required value={form.data_sfarsit} onChange={e => setForm(f => ({ ...f, data_sfarsit: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lucrare</label>
              <select value={form.lucrare_id} onChange={e => setForm(f => ({ ...f, lucrare_id: e.target.value }))} className={inputCls}>
                <option value="">-- Fara lucrare --</option>
                {lucrari.map(l => <option key={l.id} value={l.id}>{l.nume}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Persoana</label>
              <select value={form.persoana_id} onChange={e => setForm(f => ({ ...f, persoana_id: e.target.value }))} className={inputCls}>
                <option value="">-- Selecteaza --</option>
                {persoane.map(p => <option key={p.id} value={p.id}>{p.nume}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observatii</label>
              <input value={form.observatii} onChange={e => setForm(f => ({ ...f, observatii: e.target.value }))} className={inputCls} />
            </div>
          </div>

          {/* Decalaj rapid — doar la editare */}
          {editingPlan && (
            <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Decaleaza planificarea cu</p>
              <div className="flex items-center gap-2 flex-wrap">
                {[-7, -1, 1, 7].map(n => (
                  <button key={n} type="button"
                    onClick={() => setForm(f => ({ ...f, data_start: addDays(f.data_start, n), data_sfarsit: addDays(f.data_sfarsit, n) }))}
                    className="px-2.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-mono transition-colors">
                    {n > 0 ? `+${n}z` : `${n}z`}
                  </button>
                ))}
                <div className="flex items-center gap-1 ml-1">
                  <input type="number" value={shiftDays} onChange={e => setShiftDays(e.target.value)}
                    placeholder="±zile"
                    className="w-16 border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 text-xs bg-white dark:bg-gray-700 dark:text-white outline-none focus:ring-1 focus:ring-blue-500" />
                  <button type="button" onClick={applyShift}
                    className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors">
                    Aplica
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition-colors">
              {editingPlan ? 'Actualizeaza' : 'Adauga'}
            </button>
            {editingPlan && (
              <button type="button" onClick={handleDelete}
                className="px-4 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 text-red-600 dark:text-red-400 py-2 rounded-lg text-sm font-medium transition-colors">
                Sterge
              </button>
            )}
            <button type="button" onClick={() => setModalOpen(false)}
              className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 rounded-lg text-sm font-medium transition-colors">
              Anuleaza
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal decalare in masa */}
      <Modal isOpen={decalareOpen} onClose={() => setDecalareOpen(false)} title="Decalare planificari in masa">
        <form onSubmit={handleDecalare} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Numar de zile <span className="text-gray-400 font-normal">(pozitiv = inainte, negativ = inapoi)</span>
            </label>
            <input type="number" required value={decalareForm.zile}
              onChange={e => setDecalareForm(f => ({ ...f, zile: e.target.value }))}
              className={inputCls} placeholder="ex: 7 sau -3" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Decaleaza planificarile cu data start dupa
            </label>
            <input type="date" required value={decalareForm.data_referinta}
              onChange={e => setDecalareForm(f => ({ ...f, data_referinta: e.target.value }))}
              className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Utilaje <span className="text-gray-400 font-normal">(implicit toate)</span>
            </label>
            <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg divide-y divide-gray-100 dark:divide-gray-700">
              <label className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
                <input type="checkbox"
                  checked={decalareForm.selectedUtilaje.length === 0}
                  onChange={() => setDecalareForm(f => ({ ...f, selectedUtilaje: [] }))}
                  className="rounded accent-blue-600"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Toate utilajele</span>
              </label>
              {utilaje.map(u => (
                <label key={u.id} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
                  <input type="checkbox"
                    checked={decalareForm.selectedUtilaje.includes(u.id)}
                    onChange={(e) => setDecalareForm(f => ({
                      ...f,
                      selectedUtilaje: e.target.checked
                        ? [...f.selectedUtilaje, u.id]
                        : f.selectedUtilaje.filter(id => id !== u.id),
                    }))}
                    className="rounded accent-blue-600"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-300">{u.denumire}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition-colors">
              Aplica decalare
            </button>
            <button type="button" onClick={() => setDecalareOpen(false)}
              className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg text-sm font-medium transition-colors">
              Anuleaza
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
