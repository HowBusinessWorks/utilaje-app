import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useToast } from '../App';

const statusColors = {
  disponibil: '#22c55e',
  service: '#f59e0b',
  indisponibil: '#ef4444',
  casat: '#9ca3af',
};

const statusLabels = {
  disponibil: 'Disponibil',
  service: 'Service',
  indisponibil: 'Indisponibil',
  casat: 'Casat',
};

function todayLocal() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function Harta() {
  const toast = useToast();
  const [utilaje, setUtilaje] = useState([]);
  const [locatii, setLocatii] = useState([]);
  const [planificari, setPlanificari] = useState([]);
  const [loading, setLoading] = useState(true);
  const [MapComponents, setMapComponents] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/utilaje'),
      api.get('/lucrari/locatii'),
      api.get('/planificari'),
      import('react-leaflet').then(m => {
        import('leaflet').then(L => {
          setMapComponents({ ...m, L: L.default });
        });
        return m;
      })
    ])
      .then(([u, l, p]) => {
        setUtilaje(u);
        setLocatii(l);
        setPlanificari(p);
      })
      .catch(e => toast('Eroare: ' + e.message, 'error'))
      .finally(() => setLoading(false));
  }, []);

  // Determina locatia curenta a utilajului:
  // 1. Daca are planificare activa azi pe o lucrare cu locatie → locatia lucrarii
  // 2. Altfel → locatia de baza
  const getUtilajInfo = (utilaj) => {
    const today = todayLocal();
    const activePlan = planificari.find(p =>
      String(p.utilaj_id) === String(utilaj.id) &&
      p.data_start <= today && p.data_sfarsit >= today
    );

    if (activePlan && activePlan.lucrare_locatie_id) {
      const loc = locatii.find(l => l.id === activePlan.lucrare_locatie_id);
      if (loc && loc.lat && loc.lng) {
        return {
          loc,
          sursa: 'lucrare',
          lucrare: activePlan.lucrare_nume,
          plan: activePlan,
        };
      }
    }

    if (activePlan && !activePlan.lucrare_locatie_id) {
      // Planificare activa dar lucrarea nu are locatie configurata
      const locBaza = utilaj.locatie_baza_id
        ? locatii.find(l => l.id === utilaj.locatie_baza_id)
        : null;
      return {
        loc: locBaza || null,
        sursa: 'baza',
        lucrare: activePlan.lucrare_nume,
        plan: activePlan,
        avertisment: 'Lucrarea nu are locatie configurata',
      };
    }

    const locBaza = utilaj.locatie_baza_id
      ? locatii.find(l => l.id === utilaj.locatie_baza_id)
      : null;
    return { loc: locBaza || null, sursa: 'baza', lucrare: null, plan: null };
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
    </div>
  );

  if (!MapComponents) return <div className="text-gray-500 p-4">Se incarca harta...</div>;

  const { MapContainer, TileLayer, Marker, Popup } = MapComponents;
  const L = MapComponents.L;

  const markers = utilaje.map(u => {
    const info = getUtilajInfo(u);
    if (!info.loc || !info.loc.lat || !info.loc.lng) return null;
    return { utilaj: u, ...info };
  }).filter(Boolean);

  const center = markers.length > 0
    ? [markers[0].loc.lat, markers[0].loc.lng]
    : [46.7712, 23.6236];

  const nrPeLucrare = markers.filter(m => m.sursa === 'lucrare').length;
  const nrLaBaza = markers.filter(m => m.sursa === 'baza').length;

  return (
    <div className="space-y-4 h-full">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {markers.length} utilaje pozitionate
          </h3>
          {nrPeLucrare > 0 && (
            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
              {nrPeLucrare} pe lucrare
            </span>
          )}
          {nrLaBaza > 0 && (
            <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
              {nrLaBaza} la baza
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 ml-auto flex-wrap">
          {Object.entries(statusLabels).map(([status, label]) => (
            <div key={status} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: statusColors[status] }}></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">{label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-gray-200 dark:border-gray-600">
            <div className="w-3 h-3 rounded-full bg-indigo-500 opacity-70 border border-white"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Locatie/santier</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700" style={{ height: 'calc(100vh - 220px)' }}>
        <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Markeri utilaje */}
          {markers.map(({ utilaj, loc, sursa, lucrare, avertisment }) => {
            const color = statusColors[utilaj.status] || '#9ca3af';
            // Utilajele pe lucrare au contur albastru, cele la baza au contur alb
            const borderColor = sursa === 'lucrare' ? '#3b82f6' : 'white';
            const icon = L.divIcon({
              html: `<div style="width:28px;height:28px;background:${color};border:3px solid ${borderColor};border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:2px 2px 6px rgba(0,0,0,0.3)"></div>`,
              className: '',
              iconSize: [28, 28],
              iconAnchor: [14, 28],
            });
            return (
              <Marker key={utilaj.id} position={[loc.lat, loc.lng]} icon={icon}>
                <Popup>
                  <div className="min-w-44">
                    <p className="font-semibold text-sm">{utilaj.alias || utilaj.denumire}</p>
                    {utilaj.alias && <p className="text-xs text-gray-500">{utilaj.denumire}</p>}
                    <div className="mt-2 space-y-1">
                      <p className="text-xs">
                        <span className="font-medium">Status:</span>{' '}
                        <span style={{ color: statusColors[utilaj.status] }} className="font-medium capitalize">
                          {statusLabels[utilaj.status] || utilaj.status}
                        </span>
                      </p>
                      <p className="text-xs">
                        <span className="font-medium">Locatie:</span> {loc.nume}
                        {sursa === 'lucrare' && (
                          <span className="ml-1 text-blue-600 font-medium">(activ pe lucrare)</span>
                        )}
                      </p>
                      {lucrare && (
                        <p className="text-xs"><span className="font-medium">Lucrare:</span> {lucrare}</p>
                      )}
                      {utilaj.responsabil_nume && (
                        <p className="text-xs"><span className="font-medium">Responsabil:</span> {utilaj.responsabil_nume}</p>
                      )}
                      {avertisment && (
                        <p className="text-xs text-amber-600 mt-1">⚠ {avertisment}</p>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Markeri locatii/santiere */}
          {locatii.filter(l => l.lat && l.lng).map(loc => {
            const icon = L.divIcon({
              html: `<div style="width:10px;height:10px;background:#6366f1;border:2px solid white;border-radius:50%;box-shadow:1px 1px 4px rgba(0,0,0,0.3)"></div>`,
              className: '',
              iconSize: [10, 10],
              iconAnchor: [5, 5],
            });
            return (
              <Marker key={`loc-${loc.id}`} position={[loc.lat, loc.lng]} icon={icon}>
                <Popup>
                  <div>
                    <p className="font-semibold text-sm">{loc.nume}</p>
                    {loc.adresa && <p className="text-xs text-gray-500">{loc.adresa}</p>}
                    <p className="text-xs text-indigo-600 capitalize mt-1">{loc.tip}</p>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {markers.length === 0 && (
        <div className="text-center text-gray-400 text-sm py-4">
          Niciun utilaj nu are locatie configurata. Adauga locatie baza pentru fiecare utilaj.
        </div>
      )}
    </div>
  );
}
