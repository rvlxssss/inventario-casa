
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { User } from '../types';

interface ProfileProps {
    user: User;
    onUpdateUser: (user: User) => void;
    onLogout: () => void;
}

// --- Edit Profile Modal ---
interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
    onSave: (name: string, email: string, avatarUrl: string) => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, user, onSave }) => {
    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email);
    const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);

    // Reset state when modal opens
    React.useEffect(() => {
        if (isOpen) {
            setName(user.name);
            setEmail(user.email);
            setAvatarUrl(user.avatarUrl);
        }
    }, [isOpen, user]);

    if (!isOpen) return null;

    const handleRandomizeAvatar = () => {
        const randomStr = Math.random().toString(36).substring(7);
        setAvatarUrl(`https://api.dicebear.com/7.x/avataaars/svg?seed=${name || randomStr}`);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
             <div className="bg-white dark:bg-[#1e1e1e] w-full max-w-sm rounded-2xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Editar Perfil</h3>
                
                <div className="flex flex-col gap-4">
                    {/* Avatar Preview & Edit */}
                    <div className="flex flex-col items-center gap-3 mb-2">
                        <img 
                            src={avatarUrl || `https://ui-avatars.com/api/?name=${name || 'User'}&background=random`} 
                            className="h-24 w-24 rounded-full object-cover ring-4 ring-slate-100 dark:ring-white/10"
                            alt="Preview"
                        />
                        <div className="flex gap-2">
                             <button 
                                onClick={handleRandomizeAvatar}
                                className="text-xs font-bold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-white px-3 py-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-white/20"
                            >
                                Generar Avatar
                            </button>
                             <button 
                                onClick={() => setAvatarUrl('')}
                                className="text-xs font-bold bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-lg"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>

                    {/* Fields */}
                    <div>
                        <label className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1 block">Nombre</label>
                        <input 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-black/20 p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-500/50 outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1 block">Email</label>
                        <input 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-black/20 p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-500/50 outline-none"
                            type="email"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1 block">URL de Imagen (Opcional)</label>
                        <input 
                            value={avatarUrl}
                            onChange={(e) => setAvatarUrl(e.target.value)}
                            placeholder="https://..."
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-black/20 p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-500/50 outline-none text-sm"
                        />
                    </div>
                </div>

                <div className="flex gap-3 mt-8">
                    <button 
                        onClick={onClose}
                        className="flex-1 h-12 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={() => {
                            if(name && email) {
                                onSave(name, email, avatarUrl);
                                onClose();
                            } else {
                                alert("Nombre y Email requeridos");
                            }
                        }}
                        className="flex-1 h-12 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold"
                    >
                        Guardar
                    </button>
                </div>
             </div>
        </div>
    )
}

export const Profile: React.FC<ProfileProps> = ({ user, onUpdateUser, onLogout }) => {
  const navigate = useNavigate();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [notifications, setNotifications] = useState({
      expiry: true,
      stock: false
  });

  const toggleNotification = (key: 'expiry' | 'stock') => {
      setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveProfile = (name: string, email: string, avatarUrl: string) => {
      onUpdateUser({
          ...user,
          name,
          email,
          avatarUrl
      });
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
                 <div className="rounded-full h-32 w-32 shadow-xl ring-4 ring-white dark:ring-white/10 overflow-hidden bg-slate-100 dark:bg-surface-dark">
                    <img 
                        src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.name}&background=random`} 
                        alt={user.name}
                        className="h-full w-full object-cover"
                    />
                 </div>
                 <div className="flex flex-col items-center justify-center">
                    <p className="text-slate-900 dark:text-white text-2xl font-bold">{user.name}</p>
                    <p className="text-slate-500 dark:text-slate-400 text-base">{user.email}</p>
                </div>
                <button 
                    onClick={() => setIsEditOpen(true)}
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
        
        <EditProfileModal 
            isOpen={isEditOpen} 
            onClose={() => setIsEditOpen(false)}
            user={user}
            onSave={handleSaveProfile}
        />
        
        <BottomNav />
    </div>
  );
};
