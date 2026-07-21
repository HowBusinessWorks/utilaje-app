// Config partajat pentru navigatie (folosit de Sidebar si BottomNav).
import {
  IconDashboard, IconUtilaj, IconFuel, IconRepair, IconCalendar,
  IconClipboard, IconWork, IconMap, IconPeople, IconReports, IconRequest,
  IconObservatie,
} from './components/icons';

export const adminNav = [
  {
    label: null,
    items: [
      { to: '/dashboard', label: 'Dashboard', Icon: IconDashboard },
    ],
  },
  {
    label: 'Utilaje',
    items: [
      { to: '/utilaje', label: 'Utilaje', Icon: IconUtilaj },
      { to: '/motorina', label: 'Motorina', Icon: IconFuel },
      { to: '/reparatii', label: 'Reparatii', Icon: IconRepair },
      { to: '/planificare', label: 'Planificari', Icon: IconCalendar },
      { to: '/procese-verbale', label: 'Procese verbale', Icon: IconClipboard },
      { to: '/observatii', label: 'Observatii', Icon: IconObservatie },
    ],
  },
  {
    label: 'Operatiuni',
    items: [
      { to: '/lucrari', label: 'Lucrari', Icon: IconWork },
      { to: '/harta', label: 'Harta', Icon: IconMap },
    ],
  },
  {
    label: 'Resurse',
    items: [
      { to: '/persoane', label: 'Persoane', Icon: IconPeople },
      { to: '/rapoarte', label: 'Rapoarte', Icon: IconReports },
    ],
  },
];

export const sefNav = [
  {
    label: null,
    items: [
      { to: '/solicitari', label: 'Solicitari', Icon: IconRequest },
      { to: '/pv-mele', label: 'Procese verbale', Icon: IconClipboard },
      { to: '/motorina-mea', label: 'Motorina', Icon: IconFuel },
      { to: '/observatii', label: 'Observatii', Icon: IconObservatie },
    ],
  },
];
