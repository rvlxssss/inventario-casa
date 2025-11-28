import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useInventory } from '../context/InventoryContext';
import { useAuth } from '../context/AuthContext';
import { loadState, saveState } from '../utils/storage';

export const useSync = (serverUrl: string) => {
    const {
        setProducts, setCategories,
        registerSyncCallback
    } = useInventory();

    const {
        setMembers, currentUser
    } = useAuth();

    const [syncCode, setSyncCode] = useState<string | null>(() => loadState('syncCode', null));
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef<Socket | null>(null);

    // Refs for state access in callbacks
    const syncCodeRef = useRef(syncCode);
    const userRef = useRef(currentUser);
    const shouldEmit = useRef(true);

    useEffect(() => { syncCodeRef.current = syncCode; }, [syncCode]);
    useEffect(() => { userRef.current = currentUser; }, [currentUser]);

    useEffect(() => {
        if (syncCode) saveState('syncCode', syncCode);
        else localStorage.removeItem('syncCode');
    }, [syncCode]);

    // Register callback to capture local changes
    useEffect(() => {
        registerSyncCallback((action) => {
            if (shouldEmit.current && isConnected) {
                // Determine Room ID (User Room or Sync Code Room)
                let roomId = '';
                if (syncCodeRef.current) {
                    roomId = `room_${syncCodeRef.current}`;
                } else if (userRef.current) {
                    roomId = `user_${userRef.current.id}`;
                }

                if (roomId) {
                    socketRef.current?.emit('sync_action', {
                        roomId,
                        action,
                        userId: userRef.current?.id
                    });
                }
            }
        });
    }, [registerSyncCallback, isConnected]);

    useEffect(() => {
        if (!serverUrl) return;

        const socket = io(serverUrl, {
            transports: ['websocket', 'polling'],
            autoConnect: true,
            reconnectionAttempts: 5
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log("Connected to backend", socket.id);
            setIsConnected(true);

            // Join User Room if logged in
            if (userRef.current) {
                socket.emit('join_user_room', userRef.current.id);
            }

            // Join Sync Session if code exists
            if (syncCodeRef.current) {
                socket.emit('join_session', { code: syncCodeRef.current, user: userRef.current });
            }
        });

        socket.on('disconnect', () => setIsConnected(false));
        socket.on('connect_error', (err) => {
            console.warn("Socket error:", err.message);
            setIsConnected(false);
        });

        // --- INCOMING HANDLERS ---

        // Legacy/Full Sync
        socket.on('data_updated', ({ type, data }) => {
            shouldEmit.current = false;
            if (type === 'products') setProducts(data);
            if (type === 'categories') setCategories(data);
            if (type === 'members') setMembers(data);
            setTimeout(() => { shouldEmit.current = true; }, 50);
        });

        // Granular Sync
        socket.on('sync_action', (action: any) => {
            console.log("Remote action:", action.type);
            shouldEmit.current = false;
            switch (action.type) {
                case 'ADD_PRODUCT': setProducts(prev => [action.payload, ...prev]); break;
                case 'UPDATE_PRODUCT': setProducts(prev => prev.map(p => p.id === action.payload.id ? action.payload : p)); break;
                case 'DELETE_PRODUCT': setProducts(prev => prev.filter(p => p.id !== action.payload)); break;
                case 'ADD_CATEGORY': setCategories(prev => [...prev, action.payload]); break;
                case 'UPDATE_CATEGORY': setCategories(prev => prev.map(c => c.id === action.payload.id ? action.payload : c)); break;
                case 'DELETE_CATEGORY': setCategories(prev => prev.filter(c => c.id !== action.payload)); break;
                case 'UPDATE_MEMBERS': setMembers(action.payload); break;
            }
            setTimeout(() => { shouldEmit.current = true; }, 50);
        });

        socket.on('sync_initial_data', (data) => {
            console.log("Initial data received");
            shouldEmit.current = false;
            if (data.products?.length > 0) setProducts(data.products);
            if (data.categories?.length > 0) setCategories(data.categories);
            if (data.members?.length > 0) setMembers(data.members);
            setTimeout(() => { shouldEmit.current = true; }, 500);
        });

        return () => {
            socket.disconnect();
        };
    }, [serverUrl]);

    const createSession = async (initialData: any): Promise<string> => {
        return new Promise((resolve) => {
            if (!socketRef.current || !isConnected) {
                alert("Sin conexión");
                resolve('');
                return;
            }
            socketRef.current.emit('create_session', initialData);
            socketRef.current.once('session_created', ({ code }) => {
                setSyncCode(code);
                resolve(code);
            });
        });
    };

    const joinSession = async (code: string): Promise<boolean> => {
        if (!socketRef.current || !isConnected) return false;
        return new Promise((resolve) => {
            socketRef.current?.emit('join_session', { code, user: userRef.current });

            const onSuccess = ({ code: validCode }: { code: string }) => {
                if (validCode === code.toUpperCase()) {
                    setSyncCode(validCode);
                    cleanup();
                    resolve(true);
                }
            };
            const onError = (err: any) => {
                alert(err.message);
                cleanup();
                resolve(false);
            };
            const cleanup = () => {
                socketRef.current?.off('session_joined', onSuccess);
                socketRef.current?.off('error', onError);
            };
            socketRef.current?.on('session_joined', onSuccess);
            socketRef.current?.once('error', onError);
        });
    };

    return {
        isConnected,
        syncCode,
        setSyncCode,
        createSession,
        joinSession
    };
};
