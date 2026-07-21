import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from './api';
import { useAuth } from './auth';

const InboxContext = createContext(null);
export function useInbox() { return useContext(InboxContext); }

// Gestioneaza notificarile pentru butonul de inbox din Topbar:
//   - solicitari (cereri de utilaj de la sefii de santier)
//   - observatii (raportari facute de sefi in timpul folosirii utilajului)
// Tine numarul de notificari necitite (badge) reimprospatat periodic si listele
// complete, incarcate la deschidere / dupa actiuni.
export function InboxProvider({ children }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [items, setItems] = useState([]);          // solicitari
  const [observatii, setObservatii] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);

  const refreshCount = useCallback(async () => {
    if (!user) { setUnread(0); return; }
    try {
      const reqs = [api.get('/solicitari/count')];
      if (isAdmin) reqs.push(api.get('/observatii/count'));
      const res = await Promise.all(reqs);
      setUnread(res.reduce((s, d) => s + (d.count || 0), 0));
    } catch { /* silent */ }
  }, [user, isAdmin]);

  const refresh = useCallback(async () => {
    if (!user) { setItems([]); setObservatii([]); setUnread(0); return; }
    setLoading(true);
    try {
      const [list, c, oc, obs] = await Promise.all([
        api.get('/solicitari'),
        api.get('/solicitari/count'),
        isAdmin ? api.get('/observatii/count') : Promise.resolve({ count: 0 }),
        isAdmin ? api.get('/observatii') : Promise.resolve([]),
      ]);
      setItems(list);
      setObservatii(obs);
      setUnread((c.count || 0) + (oc.count || 0));
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [user, isAdmin]);

  const markSeen = useCallback(async () => {
    if (!user || unread === 0) return;
    try {
      const reqs = [api.post('/solicitari/mark-seen')];
      if (isAdmin) reqs.push(api.post('/observatii/mark-seen'));
      await Promise.all(reqs);
      setUnread(0);
    } catch { /* silent */ }
  }, [user, unread, isAdmin]);

  // Badge la pornire + polling la 25s
  useEffect(() => { refreshCount(); }, [refreshCount]);
  useEffect(() => {
    if (!user) return;
    const t = setInterval(refreshCount, 25000);
    return () => clearInterval(t);
  }, [user, refreshCount]);

  return (
    <InboxContext.Provider value={{ items, observatii, unread, loading, refresh, refreshCount, markSeen }}>
      {children}
    </InboxContext.Provider>
  );
}
