import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from './api';
import { useAuth } from './auth';

const InboxContext = createContext(null);
export function useInbox() { return useContext(InboxContext); }

// Gestioneaza solicitarile pentru butonul de inbox din Topbar:
//   - numarul de notificari necitite (badge), reimprospatat periodic
//   - lista completa, incarcata la deschidere / dupa actiuni
export function InboxProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);

  const refreshCount = useCallback(async () => {
    if (!user) { setUnread(0); return; }
    try {
      const d = await api.get('/solicitari/count');
      setUnread(d.count || 0);
    } catch { /* silent */ }
  }, [user]);

  const refresh = useCallback(async () => {
    if (!user) { setItems([]); setUnread(0); return; }
    setLoading(true);
    try {
      const [list, c] = await Promise.all([
        api.get('/solicitari'),
        api.get('/solicitari/count'),
      ]);
      setItems(list);
      setUnread(c.count || 0);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [user]);

  const markSeen = useCallback(async () => {
    if (!user || unread === 0) return;
    try {
      await api.post('/solicitari/mark-seen');
      setUnread(0);
    } catch { /* silent */ }
  }, [user, unread]);

  // Badge la pornire + polling la 25s
  useEffect(() => { refreshCount(); }, [refreshCount]);
  useEffect(() => {
    if (!user) return;
    const t = setInterval(refreshCount, 25000);
    return () => clearInterval(t);
  }, [user, refreshCount]);

  return (
    <InboxContext.Provider value={{ items, unread, loading, refresh, refreshCount, markSeen }}>
      {children}
    </InboxContext.Provider>
  );
}
