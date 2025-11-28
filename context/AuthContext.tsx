import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { User } from '../types';
import { loadState, saveState } from '../utils/storage';
import { User } from '../types';
import { loadState, saveState } from '../utils/storage';
// Actually, I should check if decodeJwt is used. It was used in loginGoogle which I removed. So it should be removed.
// The previous edit added User and loadState again. I need to remove the duplicates.

const INITIAL_MEMBERS: User[] = [];

interface AuthContextType {
    members: User[];
    currentUser: User | null;
    isAuthenticated: boolean;
    pendingInvite: boolean;
    setPendingInvite: (pending: boolean) => void;
    setMembers: React.Dispatch<React.SetStateAction<User[]>>;
    logout: () => void;
    joinTeam: (name: string) => void;
    updateUser: (user: User) => void;
    // New Auth Methods
    register: (data: { username: string; pin: string }) => Promise<void>;
    login: (data: { username: string; pin: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [members, setMembers] = useState<User[]>(() => loadState('members', INITIAL_MEMBERS));
    const [loggedUserId, setLoggedUserId] = useState<string | null>(() => loadState('loggedUserId', null));
    const [pendingInvite, setPendingInvite] = useState<boolean>(false);
    const [authToken, setAuthToken] = useState<string | null>(() => loadState('authToken', null));

    // Persistence
    useEffect(() => { saveState('members', members); }, [members]);
    useEffect(() => {
        if (loggedUserId) saveState('loggedUserId', loggedUserId);
        else localStorage.removeItem('loggedUserId');
    }, [loggedUserId]);
    useEffect(() => {
        if (authToken) saveState('authToken', authToken);
        else localStorage.removeItem('authToken');
    }, [authToken]);

    // Check for invite link on load
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const inviteCode = params.get('invite');
        if (inviteCode) {
            setPendingInvite(true);
        }
    }, []);

    const currentUser = useMemo(() => {
        if (!loggedUserId) return null;
        return members.find(m => m.id === loggedUserId) || null;
    }, [members, loggedUserId]);

    const isAuthenticated = !!loggedUserId;

    // --- API HELPERS ---
    const SERVER_URL = 'http://localhost:3001'; // Should be env var

    const register = async (data: { username: string; pin: string }) => {
        const res = await fetch(`${SERVER_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message);

        // Auto login
        handleAuthSuccess(json);
    };

    const login = async (data: { username: string; pin: string }) => {
        const res = await fetch(`${SERVER_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message);

        handleAuthSuccess(json);
    };

    const handleAuthSuccess = (data: any) => {
        setAuthToken(data.token);

        const user: User = {
            id: data.user.id,
            name: data.user.name,
            avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.name}`,
            role: 'owner', // Default role for new signups
            isCurrentUser: true
        };

        // Add or update in members list
        setMembers(prev => {
            const exists = prev.find(m => m.id === user.id);
            if (exists) {
                return prev.map(m => m.id === user.id ? { ...user, isCurrentUser: true } : { ...m, isCurrentUser: false });
            }
            return [...prev.map(m => ({ ...m, isCurrentUser: false })), user];
        });
        setLoggedUserId(user.id);
    };

    const logout = () => {
        setLoggedUserId(null);
        setAuthToken(null);
        localStorage.removeItem('loggedUserId');
        localStorage.removeItem('authToken');
    };

    const joinTeam = (name: string) => {
        const newUserId = Date.now().toString();
        const newUser: User = {
            id: newUserId,
            name: name,
            avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
            role: 'editor',
            isCurrentUser: true
        };

        setMembers(prev => [...prev.map(m => ({ ...m, isCurrentUser: false })), newUser]);
        setLoggedUserId(newUserId);
        setPendingInvite(false);
    };

    const updateUser = (updatedUser: User) => {
        setMembers(prev => prev.map(m => m.id === updatedUser.id ? updatedUser : m));
    };

    return (
        <AuthContext.Provider value={{
            members, currentUser, isAuthenticated, pendingInvite, setPendingInvite,
            setMembers, logout, joinTeam, updateUser,
            register, login
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
