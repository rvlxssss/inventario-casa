
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types';

interface ManageAccessProps {
    members: User[];
    onUpdateMembers: (members: User[]) => void;
}

export const ManageAccess: React.FC<ManageAccessProps> = ({ members, onUpdateMembers }) => {
  const navigate = useNavigate();
  const [inviteEmail, setInviteEmail] = useState('');

  const handleInvite = () => {
      if (!inviteEmail) return;
      if (!inviteEmail.includes('@')) {
          alert('Por favor introduce un correo válido.');
          return;
      }
      
      const newUser: User = {
          id: Date.now().toString(),
          name: inviteEmail.split('@')[0],
          email: inviteEmail,
          avatarUrl: '',
          role: 'viewer'
      };

      onUpdateMembers([...members, newUser]);
      alert(`Invitación enviada a ${inviteEmail}`);
      setInviteEmail('');
  };

  const handleCopyLink = () => {
      // Generate a link that points to the current page with a query param
      // In a real app, this would be a unique token.
      const baseUrl = window.location.href.split('#')[0]; // Get base URL without hash
      const randomCode = Math.random().toString(36).substring(7);
      const inviteLink = `${baseUrl}?invite=${randomCode}#`;
      
      navigator.clipboard.writeText(inviteLink).then(() => {
        alert('Enlace copiado al portapapeles:\n' + inviteLink + '\n\nCualquiera con este enlace podrá unirse.');
      });
  };

  const handleRemoveMember = (id: string, name: string) => {
      if (window.confirm(`¿Eliminar a ${name} del inventario?`)) {
          onUpdateMembers(members.filter(m => m.id !== id));
      }
  };

  const handleRoleChange = (id: string, newRole: 'editor' | 'viewer') => {
      onUpdateMembers(members.map(m => m.id === id ? { ...m, role: newRole } : m));
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
                    <span>Copiar Enlace de Invitación</span>
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
                                <img className="h-12 w-12 rounded-full object-cover" src={member.avatarUrl || `https://ui-avatars.com/api/?name=${member.name}&background=random`} alt={member.name} />
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
                                <p className="text-slate-700 dark:text-slate-300 font-medium text-sm">
                                    {member.role === 'owner' ? 'Propietario' : member.role === 'editor' ? 'Editor' : 'Lector'}
                                </p>
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
