import React, { useEffect } from 'react';

interface LoginProps {
  onLogin: () => void;
  onGoogleLogin: (response: any) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin, onGoogleLogin }) => {

  useEffect(() => {
    // Initialize Google Button
    if ((window as any).google) {
      (window as any).google.accounts.id.initialize({
        client_id: "YOUR_GOOGLE_CLIENT_ID", // Replace with env var if available
        callback: onGoogleLogin
      });
      (window as any).google.accounts.id.renderButton(
        document.getElementById("googleBtn"),
        { theme: "filled_black", size: "large", width: "100%", shape: "pill" }
      );
    }
  }, [onGoogleLogin]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-primary/20 rounded-full blur-[120px] animate-pulse-slow" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-secondary/10 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '1.5s' }} />

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center animate-slide-up">
        {/* Logo / Icon */}
        <div className="w-24 h-24 bg-gradient-to-br from-primary to-secondary rounded-3xl shadow-2xl shadow-primary/30 flex items-center justify-center mb-8 rotate-3 hover:rotate-6 transition-transform duration-500">
          <span className="material-symbols-outlined text-6xl text-white">kitchen</span>
        </div>

        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 mb-2 text-center">
          PantryPal
        </h1>
        <p className="text-text-muted text-center mb-12 text-lg">
          Tu inventario inteligente
        </p>

        {/* Login Card */}
        <div className="w-full glass rounded-3xl p-8 shadow-2xl backdrop-blur-xl border border-white/10">
          <div className="space-y-4">
            <div id="googleBtn" className="w-full h-12 flex justify-center"></div>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-white/10"></div>
              <span className="flex-shrink-0 mx-4 text-text-muted text-xs uppercase tracking-wider">O continúa con</span>
              <div className="flex-grow border-t border-white/10"></div>
            </div>

            <button
              onClick={onLogin}
              className="w-full h-12 bg-surface-highlight hover:bg-surface border border-white/5 rounded-full text-white font-semibold transition-all active:scale-95 flex items-center justify-center gap-2 group"
            >
              <span className="material-symbols-outlined text-text-muted group-hover:text-white transition-colors">person</span>
              <span>Acceso Invitado</span>
            </button>
          </div>
        </div>

        <p className="mt-8 text-text-muted text-xs text-center px-8">
          Al continuar, aceptas nuestros términos y condiciones.
        </p>
      </div>
    </div>
  );
};