import React, { useEffect, useRef } from 'react';

// --- CONFIGURACIÓN DE GOOGLE ---
// 1. Ve a Google Cloud Console > APIs & Services > Credentials
// 2. Crea un OAuth Client ID para Web Application
// 3. Añade http://localhost:5173 a "Authorized JavaScript origins"
// 4. Pega el ID aquí abajo:
const GOOGLE_CLIENT_ID = "1057933709700-rfe5949na0e4j7n63lf01f0tmsmscni4.apps.googleusercontent.com"; 

interface LoginProps {
  onLogin: () => void;
  onGoogleLogin: (credentialResponse: any) => void;
}

declare global {
    interface Window {
        google: any;
    }
}

export const Login: React.FC<LoginProps> = ({ onLogin, onGoogleLogin }) => {
  const btnRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Verificar si el script de Google ya cargó
    const initializeGoogle = () => {
        if (window.google && window.google.accounts && btnRef.current) {
            try {
                // Si el ID sigue siendo el placeholder, avisamos en consola pero no crasheamos
                if (GOOGLE_CLIENT_ID.includes("PON_TU_CLIENT_ID")) {
                    console.warn("Falta configurar el GOOGLE_CLIENT_ID en pages/Login.tsx");
                    return;
                }

                window.google.accounts.id.initialize({
                    client_id: GOOGLE_CLIENT_ID,
                    callback: onGoogleLogin,
                    auto_select: false, // Cambiar a true si quieres login automático
                    cancel_on_tap_outside: true
                });
                
                window.google.accounts.id.renderButton(
                    btnRef.current,
                    { 
                        theme: "outline", 
                        size: "large", 
                        width: "100%", // Se ajustará al contenedor
                        text: "continue_with",
                        shape: "rectangular"
                    } 
                );
                
                // Opcional: Mostrar el One Tap dialog
                // window.google.accounts.id.prompt();
            } catch (e) {
                console.error("Error inicializando Google Sign-In:", e);
            }
        }
    };

    // Si window.google no existe aún, podríamos esperar, pero normalmente el script async ya está en camino.
    // Usamos un pequeño timeout para dar tiempo al script en redes lentas o race conditions en dev
    const timer = setTimeout(initializeGoogle, 500);
    return () => clearTimeout(timer);

  }, [onGoogleLogin]);

  const handleForgotPassword = () => {
    alert("Se ha enviado un enlace de recuperación a tu correo.");
  };

  const handleCreateAccount = () => {
    alert("Funcionalidad de registro: Aquí iría el formulario de registro manual.");
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center p-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 py-8">
        {/* Logo */}
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white dark:bg-surface-dark shadow-sm">
          <span className="material-symbols-outlined text-slate-900 dark:text-white text-5xl">inventory_2</span>
        </div>

        <div className="flex w-full flex-col items-center gap-2">
          <h1 className="text-slate-900 dark:text-white text-[32px] font-bold leading-tight text-center">Bienvenido</h1>
          <p className="text-slate-600 dark:text-slate-400 text-base font-normal leading-normal text-center">Inicia sesión para gestionar tu inventario.</p>
        </div>

        <div className="flex w-full flex-col items-center gap-4">
          
          {/* Google Sign In Container */}
          <div className="w-full h-[44px] flex justify-center">
             <div ref={btnRef} className="w-full flex justify-center"></div>
          </div>
          
          {GOOGLE_CLIENT_ID.includes("PON_TU_CLIENT_ID") && (
             <div className="p-3 bg-amber-100 border border-amber-300 rounded-lg text-xs text-amber-800 text-center w-full">
                 ⚠️ <strong>Configuración requerida:</strong><br/>
                 Abre <code>pages/Login.tsx</code> y pega tu <code>GOOGLE_CLIENT_ID</code>.
             </div>
          )}

          <div className="flex w-full items-center gap-4 my-2">
            <hr className="flex-1 border-slate-200 dark:border-slate-700" />
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-normal">o acceso manual</p>
            <hr className="flex-1 border-slate-200 dark:border-slate-700" />
          </div>

          {/* Email Field */}
          <div className="flex w-full flex-col items-start gap-1.5">
            <label className="text-slate-900 dark:text-white text-sm font-medium leading-normal" htmlFor="email">Correo Electrónico</label>
            <div className="flex w-full items-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-surface-dark focus-within:border-slate-500 focus-within:ring-2 focus-within:ring-slate-500/20">
              <span className="material-symbols-outlined pl-3 text-slate-500">mail</span>
              <input className="flex-1 appearance-none border-0 bg-transparent text-slate-900 dark:text-white focus:outline-none focus:ring-0 h-12 placeholder:text-slate-400 p-3 text-base font-normal" id="email" placeholder="tuemail@ejemplo.com" type="email" />
            </div>
          </div>

          {/* Password Field */}
          <div className="flex w-full flex-col items-start gap-1.5">
            <div className="flex w-full items-center justify-between">
              <label className="text-slate-900 dark:text-white text-sm font-medium leading-normal" htmlFor="password">Contraseña</label>
              <button onClick={handleForgotPassword} className="text-slate-900 dark:text-white text-sm font-medium leading-normal underline">Olvidé mi Contraseña</button>
            </div>
            <div className="flex w-full items-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-surface-dark focus-within:border-slate-500 focus-within:ring-2 focus-within:ring-slate-500/20">
              <span className="material-symbols-outlined pl-3 text-slate-500">lock</span>
              <input className="flex-1 appearance-none border-0 bg-transparent text-slate-900 dark:text-white focus:outline-none focus:ring-0 h-12 placeholder:text-slate-400 p-3 text-base font-normal" id="password" placeholder="••••••••" type="password" />
              <button className="text-slate-500 flex items-center justify-center p-3" onClick={() => alert("Mostrar contraseña")}>
                <span className="material-symbols-outlined">visibility</span>
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button 
            onClick={onLogin}
            className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-slate-900 dark:bg-white text-white dark:text-black text-base font-bold leading-normal mt-2 shadow-sm hover:opacity-90 active:scale-[0.98] transition-all"
          >
            Iniciar Sesión
          </button>
        </div>

        <p className="text-slate-600 dark:text-slate-400 text-sm text-center">
          ¿No tienes cuenta? <button onClick={handleCreateAccount} className="font-bold text-slate-900 dark:text-white underline">Crear Cuenta</button>
        </p>
      </div>
    </div>
  );
};