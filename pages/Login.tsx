
import React from 'react';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  
  const handleForgotPassword = () => {
    alert("Se ha enviado un enlace de recuperación a tu correo.");
  };

  const handleCreateAccount = () => {
    alert("Funcionalidad de registro: Aquí iría el formulario de registro.");
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

        {/* Divider */}
        <div className="flex w-full items-center gap-4">
          <hr className="flex-1 border-slate-200 dark:border-slate-700" />
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-normal">o continúa con</p>
          <hr className="flex-1 border-slate-200 dark:border-slate-700" />
        </div>

        {/* Social Login */}
        <div className="flex w-full flex-col gap-4">
          <button 
            onClick={onLogin}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-surface-dark h-12 px-5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
          >
            <img alt="Google logo" className="h-6 w-6" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAYwHqIf15zB6IQcC-IzgVSWJQfaG6b09znkiirN1UlwfspCcjJ2VF6woSKSY0ZejPAx9ZGWnC7dA9-0PQ-NFPC50gZk5nefBt7KV2JsfQhp69voblCThp-DVJyVpwIHzNPLLgy5YzD6WZFqm6wbzu0UnmXcZjMZKMGLCudHd-FYuqTx3ZiXnu-HMLPganXTdJ_VYwqqCb8gHx119Mn11qMSg6Z2NL12-JidN7Nyn5_fgKuCBftSzF2DwUbrylHcPJ9WIqSJFYxPc0" />
            <span className="text-slate-800 dark:text-white text-base font-medium">Continuar con Google</span>
          </button>
          <button 
            onClick={onLogin}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-surface-dark h-12 px-5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
          >
             <svg className="h-6 w-6 text-slate-900 dark:text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M14.509 0c-2.834 0-4.333.155-5.946.471-1.42.28-2.693 1.01-3.693 2.131-.96 1.077-1.528 2.3-1.848 3.65-2.613 11.235 5.51 17.748 5.51 17.748.006-.005 1.503 1.48 3.515 1.48s2.72-.85 3.99-2.071c1.23-1.18 1.95-2.901 1.95-2.901s-2.016-1.18-2.016-3.417c0-2.348 2.28-3.321 2.28-3.321s-3.264-1.25-3.264-4.885c0-2.81 1.74-4.444 3.93-4.5.3-1.528.1-3.056-1.1-4.223-1.21-1.17-2.73-1.84-4.38-1.84zM12.01 5.925c.01 2.375 1.77 4.39 3.98 4.41.13 0 .26-.01.38-.02-2.12-.13-3.79-2.05-4.36-4.39z"></path></svg>
            <span className="text-slate-800 dark:text-white text-base font-medium">Continuar con Apple</span>
          </button>
        </div>

        <p className="text-slate-600 dark:text-slate-400 text-sm text-center">
          ¿No tienes cuenta? <button onClick={handleCreateAccount} className="font-bold text-slate-900 dark:text-white underline">Crear Cuenta</button>
        </p>
      </div>
    </div>
  );
};
