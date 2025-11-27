import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface LoginProps {
  onLogin: () => void;
  onGoogleLogin: (response: any) => void;
}

type AuthMode = 'login' | 'register' | 'forgot';

export const Login: React.FC<LoginProps> = ({ onLogin, onGoogleLogin }) => {
  const { login, register, recoverPassword } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    // Initialize Google Button
    if ((window as any).google && mode === 'login') {
      try {
        (window as any).google.accounts.id.initialize({
          client_id: "YOUR_GOOGLE_CLIENT_ID",
          callback: onGoogleLogin
        });
        (window as any).google.accounts.id.renderButton(
          document.getElementById("googleBtn"),
          { theme: "filled_black", size: "large", width: "100%", shape: "pill" }
        );
      } catch (e) {
        console.error("Google Auth Error", e);
      }
    }
  }, [onGoogleLogin, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      if (mode === 'login') {
        await login({ email, password });
      } else if (mode === 'register') {
        await register({ email, password, name });
      } else if (mode === 'forgot') {
        await recoverPassword(email);
        setSuccess('Si el correo existe, recibirás instrucciones.');
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
          {mode === 'forgot' && 'Recupera tu acceso'}
        </p>

        {/* Auth Card */}
        <div className="w-full glass rounded-3xl p-8 shadow-2xl backdrop-blur-xl border border-white/10">
          <form onSubmit={handleSubmit} className="space-y-4">

            {error && (
              <div className="p-3 rounded-xl bg-danger/20 border border-danger/50 text-danger text-xs text-center">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 rounded-xl bg-success/20 border border-success/50 text-success text-xs text-center">
                {success}
              </div>
            )}

            {mode === 'register' && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-text-muted ml-1">Nombre</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full h-12 px-4 bg-surface-highlight/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="Tu nombre"
                  required
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium text-text-muted ml-1">Correo Electrónico</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full h-12 px-4 bg-surface-highlight/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="ejemplo@correo.com"
                required
              />
            </div>

            {mode !== 'forgot' && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-text-muted ml-1">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full h-12 px-4 bg-surface-highlight/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="••••••••"
                  required
                />
                {mode === 'register' && (
                  <p className="text-[10px] text-text-muted px-1">
                    Mínimo 8 caracteres, letras, números y símbolos.
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-primary hover:bg-primary-dark rounded-xl text-white font-bold shadow-lg shadow-primary/25 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {mode === 'login' && 'Iniciar Sesión'}
                  {mode === 'register' && 'Crear Cuenta'}
                  {mode === 'forgot' && 'Enviar Correo'}
                </>
              )}
            </button>
          </form>

          {mode === 'login' && (
            <>
              <div className="relative flex py-4 items-center">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="flex-shrink-0 mx-4 text-text-muted text-[10px] uppercase tracking-wider">O continúa con</span>
                <div className="flex-grow border-t border-white/10"></div>
              </div>
              <div id="googleBtn" className="w-full h-12 flex justify-center mb-4"></div>

              <button
                onClick={onLogin}
                className="w-full h-12 bg-surface-highlight hover:bg-surface border border-white/5 rounded-xl text-white font-semibold transition-all active:scale-95 flex items-center justify-center gap-2 group"
              >
                <span className="material-symbols-outlined text-text-muted group-hover:text-white transition-colors">person</span>
                <span>Acceso Invitado</span>
              </button>
            </>
          )}

          <div className="mt-6 flex flex-col items-center gap-2 text-sm">
            {mode === 'login' && (
              <>
                <button onClick={() => setMode('forgot')} className="text-primary hover:underline">
                  ¿Olvidaste tu contraseña?
                </button>
                <p className="text-text-muted">
                  ¿No tienes cuenta?{' '}
                  <button onClick={() => setMode('register')} className="text-white font-bold hover:underline">
                    Regístrate
                  </button>
                </p>
              </>
            )}

            {(mode === 'register' || mode === 'forgot') && (
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