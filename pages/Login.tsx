import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface LoginProps {
  onLogin?: () => void; // Optional now as we use context mainly
  onGoogleLogin?: (response: any) => void; // Deprecated
}

type AuthMode = 'login' | 'register';

export const Login: React.FC<LoginProps> = () => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === 'login') {
        await login({ username, pin });
      } else if (mode === 'register') {
        if (pin.length !== 4 || isNaN(Number(pin))) {
          throw new Error('El PIN debe ser de 4 números.');
        }
        await register({ username, pin });
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-primary/20 rounded-full blur-[120px] animate-pulse-slow" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-secondary/10 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '1.5s' }} />

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center animate-slide-up">
        {/* Logo / Icon */}
        <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-3xl shadow-2xl shadow-primary/30 flex items-center justify-center mb-6 rotate-3 hover:rotate-6 transition-transform duration-500">
          <span className="material-symbols-outlined text-5xl text-white">kitchen</span>
        </div>

        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 mb-2 text-center">
          PantryPal
        </h1>
        <p className="text-text-muted text-center mb-8 text-sm">
          {mode === 'login' && 'Tu inventario inteligente'}
          {mode === 'register' && 'Crea tu cuenta gratis'}
        </p>

        {/* Auth Card */}
        <div className="w-full glass rounded-3xl p-8 shadow-2xl backdrop-blur-xl border border-white/10">
          <form onSubmit={handleSubmit} className="space-y-4">

            {error && (
              <div className="p-3 rounded-xl bg-danger/20 border border-danger/50 text-danger text-xs text-center">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium text-text-muted ml-1">Nombre de Usuario</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full h-12 px-4 bg-surface-highlight/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="Ej: JuanPerez"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-text-muted ml-1">PIN de Acceso (4 dígitos)</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '');
                  if (val.length <= 4) setPin(val);
                }}
                className="w-full h-12 px-4 bg-surface-highlight/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all tracking-[0.5em] text-center font-bold text-lg placeholder-tracking-normal"
                placeholder="••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-primary hover:bg-primary-dark rounded-xl text-white font-bold shadow-lg shadow-primary/25 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {mode === 'login' && 'Entrar'}
                  {mode === 'register' && 'Crear Cuenta'}
                </>
              )}
            </button>
          </form>

          <div className="mt-6 flex flex-col items-center gap-2 text-sm">
            {mode === 'login' && (
              <p className="text-text-muted">
                ¿No tienes cuenta?{' '}
                <button onClick={() => setMode('register')} className="text-white font-bold hover:underline">
                  Regístrate
                </button>
              </p>
            )}

            {mode === 'register' && (
              <button onClick={() => setMode('login')} className="text-text-muted hover:text-white transition-colors flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                Volver al inicio
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};