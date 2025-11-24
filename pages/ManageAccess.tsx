import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types';
import { BottomNav } from '../components/BottomNav';

interface ManageAccessProps {
    members: User[];
    onUpdateMembers: (members: User[]) => void;
    onLinkDevice: (code: string) => Promise<boolean>;
    onGenerateCode: () => Promise<string>;
    currentSyncCode: string | null;
    serverUrl: string;
    onUpdateServerUrl: (url: string) => void;
    isConnected: boolean;
}

// --- Server Config Modal ---
const ServerConfigModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    currentUrl: string;
    onSave: (url: string) => void;
}> = ({ isOpen, onClose, currentUrl, onSave }) => {
    const [url, setUrl] = useState(currentUrl);

    React.useEffect(() => {
        if(isOpen) setUrl(currentUrl);
    }, [isOpen, currentUrl]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
             <div className="bg-white dark:bg-[#1e1e1e] w-full max-w-sm rounded-2xl p-6 shadow-2xl">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Configurar Servidor</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
                    Para sincronizar fuera de casa, necesitas un servidor accesible desde internet (ej: ngrok, Glitch).
                </p>
                
                <div className="mb-6">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">URL del Backend</label>
                    <input 
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="http://192.168.1.5:3001"
                        className="w-full mt-1 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-black/20 text-slate-900 dark:text-white font-mono text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                        Defecto: http://localhost:3001
                    </p>
                </div>

                <div className="flex gap-3">
                    <button 
                        onClick={onClose}
                        className="flex-1 h-12 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={() => {
                            onSave(url);
                            onClose();
                        }}
                        className="flex-1 h-12 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold"
                    >
                        Guardar
                    </button>
                </div>
             </div>
        </div>
    );
};

// --- Device Sync Modal ---
const DeviceSyncModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirmCode: (code: string) => Promise<boolean>;
    onGenerateCode: () => Promise<string>;
    currentCode: string | null;
}> = ({ isOpen, onClose, onConfirmCode, onGenerateCode, currentCode }) => {
    const [mode, setMode] = useState<'select' | 'generate' | 'enter'>('select');
    const [code, setCode] = useState('');
    const [generatedCode, setGeneratedCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // Reset state when opening
    React.useEffect(() => {
        if (isOpen) {
            setMode('select');
            setCode('');
            setGeneratedCode(currentCode || '');
            setIsLoading(false);
        }
    }, [isOpen, currentCode]);

    // Generate code logic
    React.useEffect(() => {
        if (mode === 'generate' && !generatedCode) {
            const fetchCode = async () => {
                const c = await onGenerateCode();
                if (c) {
                    const formatted = `${c.substring(0,3)}-${c.substring(3,6)}`;
                    setGeneratedCode(formatted);
                } else {
                    setMode('select'); // Go back if failed
                }
            };
            fetchCode();
        } else if (mode === 'generate' && currentCode) {
            const formatted = `${currentCode.substring(0,3)}-${currentCode.substring(3,6)}`;
            setGeneratedCode(formatted);
        }
    }, [mode, onGenerateCode, generatedCode, currentCode]);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        if (code.replace(/[^a-zA-Z0-9]/g, '').length < 6) return;
        setIsLoading(true);
        const success = await onConfirmCode(code.replace(/[^a-zA-Z0-9]/g, ''));
        setIsLoading(false);
        if (success) {
            onClose();
            alert("¡Dispositivo vinculado exitosamente! Los inventarios se han sincronizado.");
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedCode.replace('-', ''));
        alert("Código copiado al portapapeles");
    };

    const handleBack = () => {
        setMode('select');
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
             <div className="bg-white dark:bg-[#1e1e1e] w-full max-w-sm rounded-2xl p-6 shadow-2xl relative overflow-hidden transition-all">
                
                {mode !== 'select' && (
                    <button onClick={handleBack} className="absolute top-4 left-4 text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">arrow_back</span>
                        <span className="text-xs font-bold">Atrás</span>
                    </button>
                )}
                
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                    <span className="material-symbols-outlined">close</span>
                </button>

                <div className="mt-8">
                    {mode === 'select' && (
                        <div className="flex flex-col items-center text-center animate-fade-in">
                            <div className="h-16 w-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                                <span className="material-symbols-outlined text-3xl text-blue-600 dark:text-blue-400">sync_alt</span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Sincronizar Dispositivo</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                                Mantén tu inventario actualizado en todos tus dispositivos en tiempo real.
                            </p>

                            <div className="flex flex-col w-full gap-3">
                                <button 
                                    onClick={() => setMode('generate')}
                                    className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-4 transition-all group"
                                >
                                    <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center group-hover:bg-white dark:group-hover:bg-white/20">
                                        <span className="material-symbols-outlined text-slate-700 dark:text-white">qr_code_2</span>
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-slate-900 dark:text-white text-sm">Este es mi móvil principal</p>
                                        <p className="text-xs text-slate-500">
                                            {currentCode ? 'Ver código actual' : 'Crear nuevo grupo y código'}
                                        </p>
                                    </div>
                                </button>

                                <button 
                                    onClick={() => setMode('enter')}
                                    className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-4 transition-all group"
                                >
                                    <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center group-hover:bg-white dark:group-hover:bg-white/20">
                                        <span className="material-symbols-outlined text-slate-700 dark:text-white">smartphone</span>
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-slate-900 dark:text-white text-sm">Soy un nuevo dispositivo</p>
                                        <p className="text-xs text-slate-500">Unirme a un grupo existente</p>
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}

                    {mode === 'generate' && (
                         <div className="flex flex-col items-center text-center animate-fade-in">
                             <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Código de Vinculación</h3>
                             <p className="text-slate-500 dark:text-slate-400 text-xs mb-6 px-4">
                                Ingresa este código en tu otro dispositivo para sincronizar los datos.
                             </p>

                             {generatedCode ? (
                                <div className="bg-slate-100 dark:bg-black/40 rounded-xl p-6 mb-6 w-full border-2 border-dashed border-slate-300 dark:border-slate-600">
                                    <p className="text-3xl font-mono font-bold tracking-wider text-slate-900 dark:text-white">{generatedCode}</p>
                                </div>
                             ) : (
                                <div className="h-32 flex items-center justify-center">
                                    <span className="material-symbols-outlined animate-spin text-3xl text-slate-400">sync</span>
                                </div>
                             )}

                             <button 
                                onClick={handleCopy}
                                className="text-blue-600 dark:text-blue-400 text-sm font-bold flex items-center gap-2 mb-8 hover:underline"
                             >
                                <span className="material-symbols-outlined text-lg">content_copy</span>
                                Copiar Código
                             </button>

                             <div className="w-full bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg flex items-start gap-3">
                                <span className="material-symbols-outlined text-amber-600 text-lg mt-0.5">info</span>
                                <p className="text-left text-xs text-amber-800 dark:text-amber-200">
                                    Cualquier cambio que hagas aquí se reflejará en todos los dispositivos conectados.
                                </p>
                             </div>
                         </div>
                    )}

                    {mode === 'enter' && (
                         <div className="flex flex-col items-center text-center animate-fade-in">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Ingresar Código</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-xs mb-6 px-4">
                                Pídele el código al administrador del inventario (En la opción "Móvil Principal").
                            </p>

                            <input 
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                placeholder="ABC-123"
                                className="w-full h-16 text-center text-2xl font-mono font-bold tracking-widest rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-black/20 text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all uppercase mb-6"
                                maxLength={7}
                            />

                            <button 
                                onClick={handleConfirm}
                                disabled={isLoading || code.length < 3}
                                className="w-full h-12 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <>
                                        <span className="material-symbols-outlined animate-spin text-lg">sync</span>
                                        Conectando...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-lg">link</span>
                                        Vincular
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
             </div>
        </div>
    );
}

// --- Invite Modal ---
const InviteMemberModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSendInvite: (email: string) => void;
}> = ({ isOpen, onClose, onSendInvite }) => {
    const [email, setEmail] = useState('');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
             <div className="bg-white dark:bg-[#1e1e1e] w-full max-w-sm rounded-2xl p-6 shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Invitar Miembro</h3>
                    <button onClick={onClose} className="text-slate-400">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    Envía una invitación por correo para colaborar en este inventario.
                </p>

                <input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-black/20 p-3 mb-6 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="correo@ejemplo.com"
                    autoFocus
                />

                <button 
                    onClick={() => {
                        if(email) {
                            onSendInvite(email);
                            setEmail('');
                            onClose();
                        }
                    }}
                    className="w-full h-12 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold"
                >
                    Enviar Invitación
                </button>
             </div>
        </div>
    );
};


export const ManageAccess: React.FC<ManageAccessProps> = ({ 
    members, 
    onUpdateMembers, 
    onLinkDevice, 
    onGenerateCode,
    currentSyncCode,
    serverUrl,
    onUpdateServerUrl,
    isConnected
}) => {
  const navigate = useNavigate();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const [isServerConfigOpen, setIsServerConfigOpen] = useState(false);

  const handleRemoveMember = (id: string) => {
      if (window.confirm('¿Eliminar a este usuario del grupo?')) {
          onUpdateMembers(members.filter(m => m.id !== id));
      }
  };

  const handleSendInvite = (email: string) => {
      alert(`Invitación enviada a ${email}`);
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark">
      {/* Header */}
      <div className="sticky top-0 z-10 flex flex-col bg-background-light dark:bg-background-dark shadow-sm dark:shadow-md dark:shadow-black/20">
        <div className="flex items-center p-4 pb-3 justify-between">
            <button onClick={() => navigate(-1)} className="text-slate-800 dark:text-white flex size-12 shrink-0 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10">
                <span className="material-symbols-outlined text-2xl">arrow_back</span>
            </button>
            <h1 className="text-slate-800 dark:text-white text-xl font-bold leading-tight tracking-tight flex-1 text-center">Gestionar Acceso</h1>
            <button onClick={() => setIsServerConfigOpen(true)} className="text-slate-600 dark:text-slate-300 flex size-12 shrink-0 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10">
                <span className="material-symbols-outlined text-xl">settings</span>
            </button>
        </div>
      </div>

      <main className="flex-1 px-4 pt-4 pb-28">
        
        {/* Device Sync Card */}
        <div className={`rounded-2xl p-6 text-white shadow-lg mb-8 relative overflow-hidden transition-colors ${isConnected ? 'bg-gradient-to-br from-blue-600 to-indigo-700' : 'bg-gradient-to-br from-slate-600 to-slate-700'}`}>
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                    <span className="material-symbols-outlined bg-white/20 p-2 rounded-lg">phonelink_setup</span>
                    <h2 className="text-lg font-bold">Sincronización</h2>
                </div>
                <p className="text-blue-100 text-sm mb-4 max-w-[80%]">
                    {isConnected 
                        ? "Vincula otro teléfono o tablet para gestionar el inventario en equipo." 
                        : "Servidor desconectado. Verifica la configuración o inicia el backend."
                    }
                </p>
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setIsSyncOpen(true)}
                        disabled={!isConnected}
                        className={`bg-white text-blue-700 px-4 py-2.5 rounded-lg text-sm font-bold shadow-sm active:scale-95 transition-transform flex items-center gap-2 ${!isConnected && 'opacity-50 cursor-not-allowed'}`}
                    >
                        <span className="material-symbols-outlined text-lg">add_link</span>
                        {currentSyncCode ? 'Ver Código' : 'Vincular Dispositivo'}
                    </button>
                    {currentSyncCode && isConnected && (
                        <div className="px-3 py-2 bg-black/20 rounded-lg text-xs font-mono font-bold">
                            {currentSyncCode.substring(0,3)}-{currentSyncCode.substring(3,6)}
                        </div>
                    )}
                </div>
            </div>
            {/* Decor */}
            <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-9xl text-white/10 pointer-events-none">sync</span>
        </div>

        {/* Current Server Info */}
        <div className="mb-8 p-3 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-between">
            <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Servidor Actual</p>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-mono mt-0.5 truncate max-w-[200px]">{serverUrl}</p>
            </div>
             <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{isConnected ? 'Online' : 'Offline'}</span>
            </div>
        </div>

        {/* Members List */}
        <div className="mb-4 flex items-center justify-between">
            <h2 className="text-slate-800 dark:text-white font-bold text-lg">Miembros del Equipo</h2>
            <button 
                onClick={() => setIsInviteOpen(true)}
                className="text-blue-600 dark:text-blue-400 text-sm font-bold flex items-center gap-1"
            >
                <span className="material-symbols-outlined text-lg">person_add</span>
                Invitar
            </button>
        </div>

        <div className="space-y-3">
            {members.map(member => (
                <div key={member.id} className="bg-white dark:bg-surface-dark p-4 rounded-xl shadow-sm flex items-center gap-4">
                     <div className="relative">
                        <img 
                            src={member.avatarUrl || `https://ui-avatars.com/api/?name=${member.name}`} 
                            className="h-12 w-12 rounded-full object-cover bg-slate-100"
                            alt={member.name}
                        />
                        {member.role === 'owner' && (
                            <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-yellow-900 rounded-full p-0.5 border-2 border-white dark:border-surface-dark">
                                <span className="material-symbols-outlined text-[10px] font-bold block">crown</span>
                            </div>
                        )}
                     </div>
                     
                     <div className="flex-1">
                         <div className="flex items-center gap-2">
                            <p className="text-slate-900 dark:text-white font-bold">{member.name}</p>
                            {member.isCurrentUser && <span className="text-[10px] bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded text-slate-500">Tú</span>}
                         </div>
                         <p className="text-slate-500 dark:text-slate-400 text-xs">{member.email}</p>
                     </div>

                     <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-400 capitalize bg-slate-50 dark:bg-white/5 px-2 py-1 rounded-lg border border-slate-100 dark:border-white/5">
                            {member.role === 'owner' ? 'Admin' : member.role === 'editor' ? 'Editor' : 'Lector'}
                        </span>
                        {!member.isCurrentUser && (
                            <button 
                                onClick={() => handleRemoveMember(member.id)}
                                className="h-8 w-8 flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors"
                            >
                                <span className="material-symbols-outlined">delete</span>
                            </button>
                        )}
                     </div>
                </div>
            ))}
        </div>
      </main>

      <InviteMemberModal 
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onSendInvite={handleSendInvite}
      />

      <DeviceSyncModal 
        isOpen={isSyncOpen}
        onClose={() => setIsSyncOpen(false)}
        onConfirmCode={onLinkDevice}
        onGenerateCode={onGenerateCode}
        currentCode={currentSyncCode}
      />

      <ServerConfigModal 
        isOpen={isServerConfigOpen}
        onClose={() => setIsServerConfigOpen(false)}
        currentUrl={serverUrl}
        onSave={onUpdateServerUrl}
      />

      <BottomNav />
    </div>
  );
};