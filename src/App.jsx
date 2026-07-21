import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { IconCheckCircle, IconXCircle, IconWarningCircle, IconSpinner } from './components/icons';
import { AuthProvider, useAuth } from './auth';
import { InboxProvider } from './inbox';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Utilaje from './pages/Utilaje';
import UtilajDetaliu from './pages/UtilajDetaliu';
import Planificare from './pages/Planificare';
import Harta from './pages/Harta';
import Motorina from './pages/Motorina';
import ProceseVerbale from './pages/ProceseVerbale';
import Reparatii from './pages/Reparatii';
import Lucrari from './pages/Lucrari';
import Persoane from './pages/Persoane';
import Rapoarte from './pages/Rapoarte';
import Solicitari from './pages/Solicitari';
import PVSef from './pages/PVSef';
import PVPrint from './pages/PVPrint';
import MotorinaSef from './pages/MotorinaSef';
import Observatii from './pages/Observatii';
import ObservatiiAdmin from './pages/ObservatiiAdmin';

export const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

// Ecran de incarcare cat timp se valideaza sesiunea
function AuthLoading() {
  return (
    <div className="grid h-full place-items-center bg-ink-50 dark:bg-ink-950">
      <IconSpinner size={28} className="animate-spin text-brand-500" />
    </div>
  );
}

// Ruta protejata: necesita autentificare; optional restrictionata pe roluri.
function RequireAuth({ roles, children }) {
  const { user, loading } = useAuth();
  if (loading) return <AuthLoading />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    // Rol fara acces -> pagina de start proprie rolului
    return <Navigate to={user.role === 'admin' ? '/dashboard' : '/solicitari'} replace />;
  }
  return children;
}

// Observatii: admin vede lista completa cu actiuni, seful vede pagina lui.
function ObservatiiByRole() {
  const { user } = useAuth();
  return user?.role === 'admin' ? <ObservatiiAdmin /> : <Observatii />;
}

// Redirect de la radacina catre pagina de start a rolului
function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={user?.role === 'admin' ? '/dashboard' : '/solicitari'} replace />;
}

// Blocheaza pagina de login daca esti deja autentificat
function LoginRoute() {
  const { user, loading } = useAuth();
  if (loading) return <AuthLoading />;
  if (user) return <Navigate to={user.role === 'admin' ? '/dashboard' : '/solicitari'} replace />;
  return <Login />;
}

export default function App() {
  const [toasts, setToasts] = useState([]);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const adminOnly = (el) => <RequireAuth roles={['admin']}>{el}</RequireAuth>;

  return (
    <ToastContext.Provider value={addToast}>
      <AuthProvider>
      <InboxProvider>
      <BrowserRouter>
        <div className={`h-full ${darkMode ? 'dark' : ''}`}>
          <div className="h-full overflow-hidden bg-ink-50 font-sans text-ink-900 antialiased dark:bg-ink-950 dark:text-ink-100">
            <Routes>
              <Route path="/login" element={<LoginRoute />} />
              <Route path="procese-verbale/:id/print" element={<RequireAuth roles={['sef_santier', 'admin']}><PVPrint /></RequireAuth>} />
              <Route path="/" element={<RequireAuth><Layout darkMode={darkMode} setDarkMode={setDarkMode} /></RequireAuth>}>
                <Route index element={<HomeRedirect />} />
                {/* Administrator */}
                <Route path="dashboard" element={adminOnly(<Dashboard />)} />
                <Route path="utilaje" element={adminOnly(<Utilaje />)} />
                <Route path="utilaje/:id" element={adminOnly(<UtilajDetaliu />)} />
                <Route path="planificare" element={adminOnly(<Planificare />)} />
                <Route path="harta" element={adminOnly(<Harta />)} />
                <Route path="motorina" element={adminOnly(<Motorina />)} />
                <Route path="procese-verbale" element={adminOnly(<ProceseVerbale />)} />
                <Route path="reparatii" element={adminOnly(<Reparatii />)} />
                <Route path="lucrari" element={adminOnly(<Lucrari />)} />
                <Route path="persoane" element={adminOnly(<Persoane />)} />
                <Route path="rapoarte" element={adminOnly(<Rapoarte />)} />
                {/* Sef de santier */}
                <Route path="solicitari" element={<RequireAuth roles={['sef_santier', 'admin']}><Solicitari /></RequireAuth>} />
                <Route path="pv-mele" element={<RequireAuth roles={['sef_santier', 'admin']}><PVSef /></RequireAuth>} />
                <Route path="motorina-mea" element={<RequireAuth roles={['sef_santier', 'admin']}><MotorinaSef /></RequireAuth>} />
                <Route path="observatii" element={<RequireAuth roles={['sef_santier', 'admin']}><ObservatiiByRole /></RequireAuth>} />
              </Route>
            </Routes>
            <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5">
              {toasts.map(toast => {
                const cfg = {
                  error:   { Icon: IconXCircle, cls: 'text-rose-500' },
                  warning: { Icon: IconWarningCircle, cls: 'text-amber-500' },
                  success: { Icon: IconCheckCircle, cls: 'text-emerald-500' },
                }[toast.type] || { Icon: IconCheckCircle, cls: 'text-emerald-500' };
                const { Icon } = cfg;
                return (
                  <div key={toast.id} className="flex items-center gap-2.5 rounded-xl border border-ink-200/80 bg-white px-4 py-3 text-sm font-medium text-ink-800 shadow-pop animate-pop-in dark:border-ink-700 dark:bg-ink-900 dark:text-ink-100">
                    <Icon size={20} weight="fill" className={cfg.cls} />
                    <span>{toast.message}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </BrowserRouter>
      </InboxProvider>
      </AuthProvider>
    </ToastContext.Provider>
  );
}
