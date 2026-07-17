import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import {
  IconUtilaj, IconPhone, IconLock, IconShield, IconArrowLeft,
  IconSpinner, IconEye, IconEyeSlash,
} from '../components/icons';

export default function Login() {
  const { login, adminLogin } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('sef'); // 'sef' | 'admin'
  const [telefon, setTelefon] = useState('');
  const [parola, setParola] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = mode === 'admin'
        ? await adminLogin(parola)
        : await login(telefon.trim(), parola);
      navigate(user.role === 'admin' ? '/dashboard' : '/solicitari', { replace: true });
    } catch (err) {
      setError(err.message || 'Autentificare esuata');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (m) => {
    setMode(m);
    setError('');
    setParola('');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4 py-10 dark:bg-ink-950">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-600 text-white shadow-pop">
            <IconUtilaj size={28} weight="fill" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-ink-900 dark:text-white">Gestiune Utilaje</h1>
            <p className="text-sm text-ink-400">
              {mode === 'admin' ? 'Autentificare administrator' : 'Autentificare'}
            </p>
          </div>
        </div>

        <div className="card p-6">
          <form onSubmit={submit} className="space-y-4">
            {mode === 'sef' && (
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-ink-600 dark:text-ink-300">
                  Numar de telefon
                </label>
                <div className="relative">
                  <IconPhone size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                  <input
                    type="tel" required autoFocus value={telefon}
                    onChange={e => setTelefon(e.target.value)}
                    className="field pl-9" placeholder="ex: 0740 123 456"
                    autoComplete="username"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-ink-600 dark:text-ink-300">
                Parola
              </label>
              <div className="relative">
                <IconLock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  type={showPass ? 'text' : 'password'} required
                  autoFocus={mode === 'admin'}
                  value={parola}
                  onChange={e => setParola(e.target.value)}
                  className="field px-9" placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button" onClick={() => setShowPass(s => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-ink-400 hover:text-ink-600 dark:hover:text-ink-200"
                  aria-label={showPass ? 'Ascunde parola' : 'Arata parola'}
                >
                  {showPass ? <IconEyeSlash size={16} /> : <IconEye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading
                ? <IconSpinner size={18} className="animate-spin" />
                : mode === 'admin' ? 'Intra ca administrator' : 'Autentificare'}
            </button>
          </form>

          <div className="mt-5 border-t border-ink-200/70 pt-4 text-center dark:border-ink-800">
            {mode === 'sef' ? (
              <button
                onClick={() => switchMode('admin')}
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-400 transition-colors hover:text-brand-600 dark:hover:text-brand-400"
              >
                <IconShield size={14} /> Logheaza-te ca administrator
              </button>
            ) : (
              <button
                onClick={() => switchMode('sef')}
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-400 transition-colors hover:text-brand-600 dark:hover:text-brand-400"
              >
                <IconArrowLeft size={14} /> Inapoi la autentificare normala
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
