
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types';

const INITIAL_MEMBERS: User[] = [
    { id: '1', name: 'Ana García', email: 'ana.garcia@email.com', avatarUrl: '', role: 'owner', isCurrentUser: true },
    { id: '2', name: 'Ana Gómez', email: 'ana.gomez@email.com', avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDLNA3YZOo9mbFhzDJkLsgSzsYpVuPOzvFpYnEEoEwE69N76rYiMcFXllwRHIK7JANcAFumOCEIXgQPdDFjsOkAttniX5er7ZVINowYSqy01Vy_g8cLqfMz-tltajfkAkVN48jripHGh_GxFrxufiXE2xCCYl8G58zVz1eMFc6D_dwNgHv502bhG4DS3T5_SXhRxsBoGvKngaF5NwekYADaH2maYp6Lc80o2-zF55QKeK3O_n_mce9ulVetIc6hyn9DyYvSE7lFoEs', role: 'editor' },
    { id: '3', name: 'Javier Peña', email: 'jpena@email.com', avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB9TlhlXyt-l8AUz_tqVaGE46v3_emIsf-27KvcsuZZ_QS_28eoueZFABYHVBmuLVuY23cLOvz4p8rZ6FRl_5xeDGT6QvIkD86oJNmXxMaI8OHV5muBDBQl-UiTP1nIAvLjvrDWBOMJbh59FEGmI4uUBMj1Fq1z83Jm1GMQdbFM5dY7U-8bREW-ZVWm_0o_GH65wjpWbZjHjgchInxFAnReAen5sVQbUK0FFpeuyxcc5t4qc7OEwrZfi0RuiJhf4qmijFSRAhuukNM', role: 'viewer' },
];

export const ManageAccess: React.FC = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState<User[]>(INITIAL_MEMBERS);
  const [inviteEmail, setInviteEmail] = useState('');

  const handleInvite = () => {
      if (!inviteEmail) return;
      if (!inviteEmail.includes('@')) {
          alert('Por favor introduce un correo válido.');
          return;
      }
      
      alert(`Invitación enviada a ${inviteEmail}`);
      setInviteEmail('');
  };

  const handleCopyLink = () => {
      alert('Enlace de invitación copiado al portapapeles');
  };

  const handleRemoveMember = (id: string, name: string) => {
      if (window.confirm(`¿Eliminar a ${name} del inventario?`)) {
          setMembers(prev => prev.filter(m => m.id !== id));
      }
  };

  const handleRoleChange = (id: string, newRole: 'editor' | 'viewer') => {
      setMembers(prev => prev.map(m => m.id === id ? { ...m, role: newRole } : m));
  };

  const handleMenuClick = () => {
      alert('Opciones del grupo');
  };

  return (
    <div className="relative flex h-full min-h-screen w-full flex-col bg-background-light dark:bg-background-dark">
      {/* Header */}
      <div className="flex items-center bg-background-light dark:bg-background-dark p-4 pb-2 justify-between sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="text-slate-800 dark:text-white flex size-12 shrink-0 items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-white/10">
            <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight flex-1 text-center">Gestionar Acceso</h2>
        <div className="flex size-12 items-center justify-center text-slate-800 dark:text-white">
            <button onClick={handleMenuClick} className="rounded-full p-2 hover:bg-slate-200 dark:hover:bg-white/10">
                <span className="material-symbols-outlined">more_vert</span>
            </button>
        </div>
      </div>

      <div className="flex-grow p-4 space-y-8">
        {/* Invite Section */}
        <section>
            <h3 className="text-slate-900 dark:text-white text-lg font-bold pb-4">Invitar a un Miembro</h3>
            <div className="flex flex-col gap-4">
                <div className="relative">
                    <input 
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="flex w-full min-w-0 flex-1 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-500/50 border border-slate-300 dark:border-slate-700 bg-white dark:bg-surface-dark h-14 placeholder:text-slate-400 pl-4 pr-12 text-base shadow-sm" 
                        placeholder="Introduce el correo del invitado" 
                    />
                    <button 
                        onClick={handleInvite}
                        className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center h-10 w-10 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-105 transition-transform"
                    >
                        <span className="material-symbols-outlined text-sm">send</span>
                    </button>
                </div>
                <button 
                    onClick={handleCopyLink}
                    className="flex items-center justify-center gap-2 rounded-xl h-14 bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-white font-bold hover:bg-slate-300 dark:hover:bg-white/20 transition-colors active:scale-[0.98]"
                >
                    <span className="material-symbols-outlined">link</span>
                    <span>Crear Enlace de Invitación</span>
                </button>
            </div>
        </section>

        {/* Members Section */}
        <section>
            <h3 className="text-slate-900 dark:text-white text-lg font-bold pb-4">Miembros del Inventario</h3>
            <div className="space-y-4">
                
                {members.map(member => (
                    <div key={member.id} className="flex flex-col gap-4 rounded-xl bg-white dark:bg-surface-dark p-4 shadow-sm border border-transparent dark:border-white/5">
                        <div className="flex items-center gap-4">
                            {member.isCurrentUser ? (
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-lg">
                                    TÚ
                                </div>
                            ) : (
                                <img className="h-12 w-12 rounded-full object-cover" src={member.avatarUrl} alt={member.name} />
                            )}
                            
                            <div className="flex-1">
                                <p className="font-bold text-slate-800 dark:text-white">
                                    {member.name} {member.isCurrentUser && '(Tú)'}
                                </p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{member.email}</p>
                            </div>
                            
                            {!member.isCurrentUser && (
                                <button 
                                    onClick={() => handleRemoveMember(member.id, member.name)}
                                    className="flex items-center justify-center p-2 rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                >
                                    <span className="material-symbols-outlined">person_remove</span>
                                </button>
                            )}
                        </div>
                        
                        {/* Role Controls */}
                        {member.isCurrentUser ? (
                            <div className="flex items-center justify-between rounded-lg bg-slate-100 dark:bg-black/20 p-3">
                                <p className="text-slate-700 dark:text-slate-300 font-medium text-sm">Propietario</p>
                                <span className="material-symbols-outlined text-slate-400 text-sm">lock</span>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => handleRoleChange(member.id, 'editor')}
                                    className={`flex-1 flex items-center justify-center rounded-lg h-10 text-sm font-bold gap-2 transition-colors ${member.role === 'editor' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-white/20'}`}
                                >
                                    <span className="material-symbols-outlined text-lg">edit</span>
                                    <span className="truncate">Editor</span>
                                </button>
                                <button 
                                    onClick={() => handleRoleChange(member.id, 'viewer')}
                                    className={`flex-1 flex items-center justify-center rounded-lg h-10 text-sm font-bold gap-2 transition-colors ${member.role === 'viewer' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-white/20'}`}
                                >
                                    <span className="material-symbols-outlined text-lg">visibility</span>
                                    <span className="truncate">Solo Ver</span>
                                </button>
                            </div>
                        )}
                    </div>
                ))}

            </div>
        </section>
      </div>
    </div>
  );
};
