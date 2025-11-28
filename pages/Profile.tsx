import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { User } from '../types';
import { useInventory } from '../context/InventoryContext';
import { saveState } from '../utils/storage';

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
            <div className="glass w-full max-w-sm rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[90vh] border border-white/10">
                <h3 className="text-xl font-bold text-white mb-6">Editar Perfil</h3>

                <div className="flex flex-col gap-4">
                    {/* Avatar Preview & Edit */}
                    <div className="flex flex-col items-center gap-3 mb-2">
                        <img
                            src={avatarUrl || `https://ui-avatars.com/api/?name=${name || 'User'}&background=random`}
                            className="h-24 w-24 rounded-full object-cover ring-4 ring-white/10"
                            alt="Preview"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleRandomizeAvatar}
                                className="text-xs font-bold bg-white/10 text-white px-3 py-1.5 rounded-lg hover:bg-white/20 transition-colors"
                            >
                                Generar Avatar
                            </button>
                            <button
                                onClick={() => setAvatarUrl('')}
                                className="text-xs font-bold bg-danger/10 text-danger px-3 py-1.5 rounded-lg hover:bg-danger/20 transition-colors"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>

                    {/* Fields */}
                    <div>
                        <label className="text-sm font-medium text-text-muted mb-1 block">Nombre</label>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-surface-highlight/50 p-3 text-white focus:ring-2 focus:ring-primary/50 outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-text-muted mb-1 block">Email</label>
                        <input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-surface-highlight/50 p-3 text-white focus:ring-2 focus:ring-primary/50 outline-none"
                            type="email"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-text-muted mb-1 block">URL de Imagen (Opcional)</label>
                        <input
                            value={avatarUrl}
                            onChange={(e) => setAvatarUrl(e.target.value)}
                            placeholder="https://..."
                            className="w-full rounded-xl border border-white/10 bg-surface-highlight/50 p-3 text-white focus:ring-2 focus:ring-primary/50 outline-none text-sm"
                        />
                    </div>
                </div>

                <div className="flex gap-3 mt-8">
                    <button
                        onClick={onClose}
                        className="flex-1 h-12 rounded-xl border border-white/10 font-bold text-text-muted hover:bg-white/5 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => {
                            if (name && email) {
                                onSave(name, email, avatarUrl);
                                onClose();
                            } else {
                                alert("Nombre y Email requeridos");
                            }
                        }}
                        className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold shadow-lg shadow-primary/25"
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
    const {
        products, categories, expenses, transactions,
        setProducts, setCategories, setExpenses, setTransactions
    } = useInventory();

    const [isEditOpen, setIsEditOpen] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
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

    const handleExport = () => {
        const data = {
            products,
            categories,
            expenses,
            transactions,
            version: '1.0',
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `pantrypal_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const data = JSON.parse(content);

                // Basic validation
                if (!data.products || !data.categories) {
                    throw new Error('Formato de archivo inválido');
                }

                if (window.confirm('¿Estás seguro de importar estos datos? Esto reemplazará tu inventario actual.')) {
                    // Update State
                    setProducts(data.products);
                    setCategories(data.categories);
                    setExpenses(data.expenses || {});
                    setTransactions(data.transactions || []);

                    // Update Storage
                    saveState('products', data.products);
                    saveState('categories', data.categories);
                    saveState('expenses', data.expenses || {});
                    saveState('transactions', data.transactions || []);

                    alert('Datos importados correctamente');
                }
            } catch (error) {
                console.error('Error importing data:', error);
                alert('Error al importar el archivo. Asegúrate de que sea un respaldo válido.');
            }
            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = '';
        };
        reader.readAsText(file);
    };

    return (
        <Layout>
            {/* Header */}
            <div className="sticky top-0 z-10 flex flex-col pb-4">
                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-2xl font-bold text-white">Perfil y Ajustes</h1>
                    <div className="w-10 h-10" /> {/* Spacer */}
                </div>
            </div>

            <div className="space-y-6 pb-20">
                {/* Profile Info */}
                <div className="flex pt-4 pb-6 flex-col items-center gap-4">
                    <div className="rounded-full h-32 w-32 shadow-xl ring-4 ring-white/10 overflow-hidden bg-surface-highlight">
                        <img
                            src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.name}&background=random`}
                            alt={user.name}
                            className="h-full w-full object-cover"
                        />
                    </div>
                    <div className="flex flex-col items-center justify-center">
                        <p className="text-white text-2xl font-bold">{user.name}</p>
                        <p className="text-text-muted text-base">{user.email}</p>
                    </div>
                    <button
                        onClick={() => setIsEditOpen(true)}
                        className="flex items-center justify-center rounded-xl h-10 px-6 bg-surface-highlight border border-white/10 text-white text-sm font-bold mt-2 hover:bg-white/10 transition-colors"
                    >
                        Editar Perfil
                    </button>
                </div>

                {/* Account Settings */}
                <div>
                    <h2 className="text-text-muted text-xs font-bold uppercase tracking-wider px-2 pb-2">Cuenta</h2>
                    <div className="glass rounded-2xl overflow-hidden shadow-sm border border-white/5">
                        <button
                            onClick={() => navigate('/access')}
                            className="w-full flex items-center gap-4 px-4 min-h-[60px] justify-between border-b border-white/5 hover:bg-white/5 transition-colors text-left"
                        >
                            <div className="flex items-center gap-4">
                                <div className="text-white flex items-center justify-center rounded-lg bg-white/10 shrink-0 size-10">
                                    <span className="material-symbols-outlined">group</span>
                                </div>
                                <p className="text-white text-base font-medium flex-1">Inventarios Compartidos</p>
                            </div>
                            <span className="material-symbols-outlined text-text-muted">chevron_right</span>
                        </button>

                        <button
                            onClick={handleChangePassword}
                            className="w-full flex items-center gap-4 px-4 min-h-[60px] justify-between hover:bg-white/5 transition-colors text-left"
                        >
                            <div className="flex items-center gap-4">
                                <div className="text-white flex items-center justify-center rounded-lg bg-white/10 shrink-0 size-10">
                                    <span className="material-symbols-outlined">lock</span>
                                </div>
                                <p className="text-white text-base font-medium flex-1">Cambiar Contraseña</p>
                            </div>
                            <span className="material-symbols-outlined text-text-muted">chevron_right</span>
                        </button>
                    </div>
                </div>

                {/* Notifications */}
                <div>
                    <h2 className="text-text-muted text-xs font-bold uppercase tracking-wider px-2 pb-2">Notificaciones</h2>
                    <div className="glass rounded-2xl overflow-hidden shadow-sm border border-white/5">
                        <div className="flex items-center gap-4 px-4 min-h-[60px] justify-between border-b border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="text-white flex items-center justify-center rounded-lg bg-white/10 shrink-0 size-10">
                                    <span className="material-symbols-outlined">notifications</span>
                                </div>
                                <p className="text-white text-base font-medium flex-1">Alertas de Vencimiento</p>
                            </div>
                            <div
                                onClick={() => toggleNotification('expiry')}
                                className="relative inline-flex cursor-pointer items-center"
                            >
                                <input type="checkbox" className="peer sr-only" checked={notifications.expiry} readOnly />
                                <div className="peer h-6 w-11 rounded-full bg-surface-highlight border border-white/10 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 px-4 min-h-[60px] justify-between">
                            <div className="flex items-center gap-4">
                                <div className="text-white flex items-center justify-center rounded-lg bg-white/10 shrink-0 size-10">
                                    <span className="material-symbols-outlined">inventory_2</span>
                                </div>
                                <p className="text-white text-base font-medium flex-1">Stock Bajo</p>
                            </div>
                            <div
                                onClick={() => toggleNotification('stock')}
                                className="relative inline-flex cursor-pointer items-center"
                            >
                                <input type="checkbox" className="peer sr-only" checked={notifications.stock} readOnly />
                                <div className="peer h-6 w-11 rounded-full bg-surface-highlight border border-white/10 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Data Management */}
                <div>
                    <h2 className="text-text-muted text-xs font-bold uppercase tracking-wider px-2 pb-2">Gestión de Datos</h2>
                    <div className="glass rounded-2xl overflow-hidden shadow-sm border border-white/5">
                        <button
                            onClick={handleExport}
                            className="w-full flex items-center gap-4 px-4 min-h-[60px] justify-between border-b border-white/5 hover:bg-white/5 transition-colors text-left"
                        >
                            <div className="flex items-center gap-4">
                                <div className="text-white flex items-center justify-center rounded-lg bg-white/10 shrink-0 size-10">
                                    <span className="material-symbols-outlined">download</span>
                                </div>
                                <p className="text-white text-base font-medium flex-1">Exportar Copia de Seguridad</p>
                            </div>
                            <span className="material-symbols-outlined text-text-muted">chevron_right</span>
                        </button>

                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full flex items-center gap-4 px-4 min-h-[60px] justify-between hover:bg-white/5 transition-colors text-left"
                        >
                            <div className="flex items-center gap-4">
                                <div className="text-white flex items-center justify-center rounded-lg bg-white/10 shrink-0 size-10">
                                    <span className="material-symbols-outlined">upload</span>
                                </div>
                                <p className="text-white text-base font-medium flex-1">Importar Copia de Seguridad</p>
                            </div>
                            <span className="material-symbols-outlined text-text-muted">chevron_right</span>
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImport}
                            accept=".json"
                            className="hidden"
                        />
                    </div>
                </div>

                {/* General */}
                <div>
                    <h2 className="text-text-muted text-xs font-bold uppercase tracking-wider px-2 pb-2">Soporte</h2>
                    <div className="glass rounded-2xl overflow-hidden shadow-sm border border-white/5">
                        <button
                            onClick={handleSupport}
                            className="w-full flex items-center gap-4 px-4 min-h-[60px] justify-between hover:bg-white/5 transition-colors text-left"
                        >
                            <div className="flex items-center gap-4">
                                <div className="text-white flex items-center justify-center rounded-lg bg-white/10 shrink-0 size-10">
                                    <span className="material-symbols-outlined">help_outline</span>
                                </div>
                                <p className="text-white text-base font-medium flex-1">Ayuda y Soporte</p>
                            </div>
                            <span className="material-symbols-outlined text-text-muted">chevron_right</span>
                        </button>
                    </div>
                </div>

                {/* Logout Button */}
                <div className="mt-8 mb-8">
                    <button
                        onClick={onLogout}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-danger/10 h-14 text-danger text-base font-bold hover:bg-danger/20 transition-colors border border-danger/20"
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
        </Layout>
    );
};
