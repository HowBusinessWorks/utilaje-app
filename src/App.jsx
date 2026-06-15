import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
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
import PVPrint from './pages/PVPrint';

export const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
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

  return (
    <ToastContext.Provider value={addToast}>
      <BrowserRouter>
        <div className={darkMode ? 'dark' : ''}>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <Routes>
              <Route path="procese-verbale/:id/print" element={<PVPrint />} />
              <Route path="/" element={<Layout darkMode={darkMode} setDarkMode={setDarkMode} />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="utilaje" element={<Utilaje />} />
                <Route path="utilaje/:id" element={<UtilajDetaliu />} />
                <Route path="planificare" element={<Planificare />} />
                <Route path="harta" element={<Harta />} />
                <Route path="motorina" element={<Motorina />} />
                <Route path="procese-verbale" element={<ProceseVerbale />} />
                <Route path="reparatii" element={<Reparatii />} />
                <Route path="lucrari" element={<Lucrari />} />
                <Route path="persoane" element={<Persoane />} />
                <Route path="rapoarte" element={<Rapoarte />} />
              </Route>
            </Routes>
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
              {toasts.map(toast => (
                <div key={toast.id} className={`px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium transition-all ${
                  toast.type === 'error' ? 'bg-red-500' :
                  toast.type === 'warning' ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}>
                  {toast.message}
                </div>
              ))}
            </div>
          </div>
        </div>
      </BrowserRouter>
    </ToastContext.Provider>
  );
}
