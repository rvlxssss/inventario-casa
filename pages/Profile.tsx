
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';

interface ProfileProps {
    onLogout: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ onLogout }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState({
      expiry: true,
      stock: false
  });

  const toggleNotification = (key: 'expiry' | 'stock') => {
      setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleEditProfile = () => {
      alert("Editar Perfil: Aquí se abriría un formulario para cambiar nombre/avatar.");
  };

  const handleChangePassword = () => {
      alert("Cambiar Contraseña: Se ha enviado un email de restablecimiento.");
  };

  const handleSupport = () => {
      alert("Soporte: Enviando a la página de ayuda...");
  };

  return (
    <div className="relative flex h-full min-h-screen w-full flex-col">
        {/* App Bar */}
        <div className="flex items-center bg-background-light dark:bg-background-dark p-4 pb-2 justify-between sticky top-0 z-10">
            <button onClick={() => navigate(-1)} className="text-slate-800 dark:text-white flex size-12 shrink-0 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10">
                <span className="material-symbols-outlined text-2xl">arrow_back</span>
            </button>
            <h1 className="text-slate-800 dark:text-white text-lg font-bold leading-tight flex-1 text-center">Perfil y Ajustes</h1>
            <div className="flex size-12 shrink-0"></div>
        </div>

        <div className="flex-grow px-4 pb-24">
            {/* Profile Info */}
            <div className="flex pt-4 pb-6 flex-col items-center gap-4">
                 <div className="bg-center bg-no-repeat bg-cover rounded-full h-32 w-32 shadow-xl ring-4 ring-white dark:ring-white/10" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBPvFGoPvtrNCKL4PffxiXg_GCTuLG5Y_dAffAAgW1xF2DkTqH7t7SYcZeuVrVODhUbyz2_QpOu2XNlM6Z62hN8rZNrppCrGPtn7gkKNRrvMws5bzowGSVQBLQdgvek1wFCjHhyJyJF4OGXEkWn8pFHgANihPaYVE2nAWCoc10VOTK3gr6EIyA6GN95TJWmjRMOp1RyRTMHJEgoJAceR43NMCxM2AGmjllI6FhUHFBwOX3tRI0xyj2inW3soq0h66rWMAxubYgl47A")' }}></div>
                 <div className="flex flex-col items-center justify-center">
                    <p className="text-slate-900 dark:text-white text-2xl font-bold">Ana García</p>
                    <p className="text-slate-500 dark:text-slate-400 text-base">ana.garcia@email.com</p>
                </div>
                <button 
                    onClick={handleEditProfile}
                    className="flex items-center justify-center rounded-lg h-10 px-6 bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-white text-sm font-bold mt-2 hover:bg-slate-300 dark:hover:bg-white/20 transition-colors"
                >
                    Editar Perfil
                </button>
            </div>

            {/* Account Settings */}
            <div className="mt-4">
                <h2 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider px-2 pb-2">Cuenta</h2>
                <div className="bg-white dark:bg-surface-dark rounded-xl overflow-hidden shadow-sm">
                     <button 
                        onClick={() => navigate('/access')}
                        className="w-full flex items-center gap-4 px-4 min-h-[60px] justify-between border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-left"
                    >
                        <div className="flex items-center gap-4">
                            <div className="text-slate-900 dark:text-white flex items-center justify-center rounded-lg bg-slate-100 dark:bg-white/10 shrink-0 size-10">
                                <span className="material-symbols-outlined">group</span>
                            </div>
                            <p className="text-slate-800 dark:text-white text-base font-medium flex-1">Inventarios Compartidos</p>
                        </div>
                         <span className="material-symbols-outlined text-slate-400">chevron_right</span>
                    </button>

                     <button 
                        onClick={handleChangePassword}
                        className="w-full flex items-center gap-4 px-4 min-h-[60px] justify-between hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-left"
                    >
                        <div className="flex items-center gap-4">
                            <div className="text-slate-900 dark:text-white flex items-center justify-center rounded-lg bg-slate-100 dark:bg-white/10 shrink-0 size-10">
                                <span className="material-symbols-outlined">lock</span>
                            </div>
                            <p className="text-slate-800 dark:text-white text-base font-medium flex-1">Cambiar Contraseña</p>
                        </div>
                         <span className="material-symbols-outlined text-slate-400">chevron_right</span>
                    </button>
                </div>
            </div>

             {/* Notifications */}
            <div className="mt-6">
                <h2 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider px-2 pb-2">Notificaciones</h2>
                <div className="bg-white dark:bg-surface-dark rounded-xl overflow-hidden shadow-sm">
                     <div className="flex items-center gap-4 px-4 min-h-[60px] justify-between border-b border-slate-100 dark:border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="text-slate-900 dark:text-white flex items-center justify-center rounded-lg bg-slate-100 dark:bg-white/10 shrink-0 size-10">
                                <span className="material-symbols-outlined">notifications</span>
                            </div>
                            <p className="text-slate-800 dark:text-white text-base font-medium flex-1">Alertas de Vencimiento</p>
                        </div>
                         <div 
                            onClick={() => toggleNotification('expiry')}
                            className="relative inline-flex cursor-pointer items-center"
                         >
                            <input type="checkbox" className="peer sr-only" checked={notifications.expiry} readOnly />
                            <div className="peer h-6 w-11 rounded-full bg-slate-200 dark:bg-slate-600 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-slate-900 dark:peer-checked:bg-white peer-checked:after:translate-x-full peer-checked:after:border-white peer-checked:after:bg-white dark:peer-checked:after:bg-slate-900"></div>
                        </div>
                    </div>

                     <div className="flex items-center gap-4 px-4 min-h-[60px] justify-between">
                        <div className="flex items-center gap-4">
                            <div className="text-slate-900 dark:text-white flex items-center justify-center rounded-lg bg-slate-100 dark:bg-white/10 shrink-0 size-10">
                                <span className="material-symbols-outlined">inventory_2</span>
                            </div>
                            <p className="text-slate-800 dark:text-white text-base font-medium flex-1">Stock Bajo</p>
                        </div>
                         <div 
                            onClick={() => toggleNotification('stock')}
                            className="relative inline-flex cursor-pointer items-center"
                         >
                            <input type="checkbox" className="peer sr-only" checked={notifications.stock} readOnly />
                            <div className="peer h-6 w-11 rounded-full bg-slate-200 dark:bg-slate-600 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-slate-900 dark:peer-checked:bg-white peer-checked:after:translate-x-full peer-checked:after:border-white peer-checked:after:bg-white dark:peer-checked:after:bg-slate-900"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* General */}
            <div className="mt-6">
                <h2 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider px-2 pb-2">Soporte</h2>
                <div className="bg-white dark:bg-surface-dark rounded-xl overflow-hidden shadow-sm">
                     <button 
                        onClick={handleSupport}
                        className="w-full flex items-center gap-4 px-4 min-h-[60px] justify-between border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-left"
                    >
                        <div className="flex items-center gap-4">
                            <div className="text-slate-900 dark:text-white flex items-center justify-center rounded-lg bg-slate-100 dark:bg-white/10 shrink-0 size-10">
                                <span className="material-symbols-outlined">help_outline</span>
                            </div>
                            <p className="text-slate-800 dark:text-white text-base font-medium flex-1">Ayuda y Soporte</p>
                        </div>
                         <span className="material-symbols-outlined text-slate-400">chevron_right</span>
                    </button>
                </div>
            </div>

            {/* Logout Button */}
            <div className="mt-8 mb-8">
                <button 
                    onClick={onLogout}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 dark:bg-red-500/10 h-14 text-red-600 dark:text-red-400 text-base font-bold hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                >
                    <span className="material-symbols-outlined">logout</span>
                    <span>Cerrar Sesión</span>
                </button>
            </div>
        </div>
        <BottomNav />
    </div>
  );
};
