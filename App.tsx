import React, { useState, useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { Login } from './pages/Login';
import { Inventory } from './pages/Inventory';
import { AddProduct } from './pages/AddProduct';
import { Profile } from './pages/Profile';
import { ManageAccess } from './pages/ManageAccess';
import { ShoppingList } from './pages/ShoppingList';
import { Product, Category, User } from './types';

// Initial Categories
const INITIAL_CATEGORIES: Category[] = [
    { id: 'cat_food', name: 'Alimentos', icon: 'restaurant' },
    { id: 'cat_cleaning', name: 'Limpieza', icon: 'cleaning_services' },
    { id: 'cat_hygiene', name: 'Higiene Personal', icon: 'soap' },
    { id: 'cat_pets', name: 'Mascotas', icon: 'pets' },
];

// Mock initial data linked to category IDs
const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'Yogurt Griego', quantity: 3, unit: 'unidades', expiryDate: '2023-10-25', categoryId: 'cat_food', status: 'expired' },
  { id: '2', name: 'Leche Entera', quantity: 2, unit: 'unidades', expiryDate: '2023-10-28', categoryId: 'cat_food', status: 'warning' },
  { id: '3', name: 'Huevos', quantity: 12, unit: 'unidades', expiryDate: '2023-11-10', categoryId: 'cat_food', status: 'ok' },
  { id: '4', name: 'Arroz', quantity: 1000, unit: 'g', expiryDate: '2024-06-01', categoryId: 'cat_food', status: 'ok' },
  { id: '5', name: 'Detergente', quantity: 1, unit: 'L', expiryDate: '', categoryId: 'cat_cleaning', status: 'ok' },
  { id: '6', name: 'Limpiador Multiuso', quantity: 750, unit: 'ml', expiryDate: '', categoryId: 'cat_cleaning', status: 'ok' },
];

const INITIAL_MEMBERS: User[] = [
    { id: '1', name: 'Ana García', email: 'ana.garcia@email.com', avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBPvFGoPvtrNCKL4PffxiXg_GCTuLG5Y_dAffAAgW1xF2DkTqH7t7SYcZeuVrVODhUbyz2_QpOu2XNlM6Z62hN8rZNrppCrGPtn7gkKNRrvMws5bzowGSVQBLQdgvek1wFCjHhyJyJF4OGXEkWn8pFHgANihPaYVE2nAWCoc10VOTK3gr6EIyA6GN95TJWmjRMOp1RyRTMHJEgoJAceR43NMCxM2AGmjllI6FhUHFBwOX3tRI0xyj2inW3soq0h66rWMAxubYgl47A', role: 'owner', isCurrentUser: true },
    { id: '2', name: 'Ana Gómez', email: 'ana.gomez@email.com', avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDLNA3YZOo9mbFhzDJkLsgSzsYpVuPOzvFpYnEEoEwE69N76rYiMcFXllwRHIK7JANcAFumOCEIXgQPdDFjsOkAttniX5er7ZVINowYSqy01Vy_g8cLqfMz-tltajfkAkVN48jripHGh_GxFrxufiXE2xCCYl8G58zVz1eMFc6D_dwNgHv502bhG4DS3T5_SXhRxsBoGvKngaF5NwekYADaH2maYp6Lc80o2-zF55QKeK3O_n_mce9ulVetIc6hyn9DyYvSE7lFoEs', role: 'editor' },
];

// Helper to load from local storage
const loadState = <T,>(key: string, fallback: T): T => {
  const saved = localStorage.getItem(key);
  try {
      return saved ? JSON.parse(saved) : fallback;
  } catch (e) {
      console.error(`Error parsing ${key} from localStorage`, e);
      return fallback;
  }
};

// Helper to decode JWT correctly handling UTF-8 characters
const decodeJwt = (token: string) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error("Failed to decode JWT", e);
        return null;
    }
};

// --- Invite Modal Component ---
const JoinInviteModal: React.FC<{
    isOpen: boolean;
    onJoin: (name: string) => void;
    onClose: () => void;
}> = ({ isOpen, onJoin, onClose }) => {
    const [name, setName] = useState('');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
             <div className="bg-white dark:bg-[#1e1e1e] w-full max-w-sm rounded-2xl p-6 shadow-2xl text-center">
                <div className="h-16 w-16 bg-slate-100 dark:bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-3xl text-slate-900 dark:text-white">group_add</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">¡Te han invitado!</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                    Has recibido una invitación para colaborar en este inventario. Ingresa tu nombre para unirte.
                </p>
                <input 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-black/20 p-4 mb-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-500/50 outline-none"
                    placeholder="Tu nombre"
                    autoFocus
                />
                <button 
                    onClick={() => {
                        if (name) onJoin(name);
                    }}
                    className="w-full h-12 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:opacity-90 transition-opacity"
                >
                    Unirse al Equipo
                </button>
                <button 
                    onClick={onClose}
                    className="mt-4 text-sm text-slate-500 underline"
                >
                    Ignorar
                </button>
             </div>
        </div>
    );
}


const App: React.FC = () => {
  // State with persistence
  const [products, setProducts] = useState<Product[]>(() => loadState('products', INITIAL_PRODUCTS));
  const [categories, setCategories] = useState<Category[]>(() => loadState('categories', INITIAL_CATEGORIES));
  const [members, setMembers] = useState<User[]>(() => loadState('members', INITIAL_MEMBERS));
  
  // Sync State
  const [serverUrl, setServerUrl] = useState<string>(() => loadState('serverUrl', 'http://localhost:3001'));
  const [syncCode, setSyncCode] = useState<string | null>(() => loadState('syncCode', null));
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  
  // Ref to prevent infinite loops (Server update -> State Change -> Emit -> Server update...)
  const shouldEmit = useRef(true);

  // Auth State
  const [loggedUserId, setLoggedUserId] = useState<string | null>(() => {
      const savedId = loadState<string | null>('loggedUserId', null);
      return savedId;
  });

  // Invite Logic State
  const [pendingInvite, setPendingInvite] = useState<boolean>(false);

  // Persistence Effects
  useEffect(() => { localStorage.setItem('products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('categories', JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem('members', JSON.stringify(members)); }, [members]);
  useEffect(() => { localStorage.setItem('serverUrl', JSON.stringify(serverUrl)); }, [serverUrl]);

  useEffect(() => { 
      if(syncCode) localStorage.setItem('syncCode', JSON.stringify(syncCode)); 
      else localStorage.removeItem('syncCode');
  }, [syncCode]);
  
  // Persist User Session
  useEffect(() => { 
      if (loggedUserId) {
          localStorage.setItem('loggedUserId', JSON.stringify(loggedUserId)); 
      } else {
          localStorage.removeItem('loggedUserId');
      }
  }, [loggedUserId]);

  // --- SOCKET.IO CONNECTION ---
  useEffect(() => {
    // If no server URL is provided, don't try to connect
    if (!serverUrl) return;

    console.log("Connecting to:", serverUrl);

    // Init socket
    const socket = io(serverUrl, {
        transports: ['websocket', 'polling'], // Fallback options
        autoConnect: true,
        reconnectionAttempts: 5
    });
    socketRef.current = socket;

    socket.on('connect', () => {
        console.log("Connected to backend", socket.id);
        setIsConnected(true);
        // If we already have a sync code saved, rejoin the session
        if (syncCode) {
            console.log("Rejoining session:", syncCode);
            socket.emit('join_session', { code: syncCode, user: currentUser || { name: 'Unknown' } });
        }
    });

    socket.on('connect_error', (err) => {
        console.warn("Connection error:", err.message);
        setIsConnected(false);
    });

    socket.on('disconnect', () => {
        console.log("Disconnected from backend");
        setIsConnected(false);
    });

    // Handle Incoming Data
    socket.on('sync_initial_data', (data) => {
        console.log("Initial data received:", data);
        shouldEmit.current = false;
        if (data.products) setProducts(data.products);
        if (data.categories) setCategories(data.categories);
        if (data.members) setMembers(data.members);
        // Re-enable emitting after state settles (next tick)
        setTimeout(() => { shouldEmit.current = true; }, 100);
    });

    socket.on('data_updated', ({ type, data }) => {
        console.log("Remote update received:", type);
        shouldEmit.current = false; // Don't echo this back
        if (type === 'products') setProducts(data);
        if (type === 'categories') setCategories(data);
        if (type === 'members') setMembers(data);
        setTimeout(() => { shouldEmit.current = true; }, 100);
    });

    return () => {
        socket.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverUrl]); // Re-connect if URL changes

  // --- SYNC EMITTERS ---
  // When local state changes, send to server IF it's a local change
  useEffect(() => {
      if (isConnected && syncCode && shouldEmit.current) {
          const roomId = `room_${syncCode}`;
          socketRef.current?.emit('update_data', { roomId, type: 'products', data: products });
      }
  }, [products, isConnected, syncCode]);

  useEffect(() => {
      if (isConnected && syncCode && shouldEmit.current) {
          const roomId = `room_${syncCode}`;
          socketRef.current?.emit('update_data', { roomId, type: 'categories', data: categories });
      }
  }, [categories, isConnected, syncCode]);
  
  useEffect(() => {
      if (isConnected && syncCode && shouldEmit.current) {
          const roomId = `room_${syncCode}`;
          socketRef.current?.emit('update_data', { roomId, type: 'members', data: members });
      }
  }, [members, isConnected, syncCode]);


  // Check for invite link on load
  useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const inviteCode = params.get('invite');
      if (inviteCode) {
          setPendingInvite(true);
      }
  }, []);

  // Determine current user object based on loggedUserId
  const currentUser = React.useMemo(() => {
      if (!loggedUserId) return null;
      return members.find(m => m.id === loggedUserId) || null;
  }, [members, loggedUserId]);

  useEffect(() => {
      if (loggedUserId && !currentUser && members.length > 0) {
          console.warn("User ID in session not found in members list. Logging out.");
          setLoggedUserId(null);
      }
  }, [loggedUserId, currentUser, members]);

  const isAuthenticated = !!currentUser;

  const handleJoinTeam = (name: string) => {
      const newUserId = Date.now().toString();
      const newUser: User = {
          id: newUserId,
          name: name,
          email: `${name.toLowerCase().replace(/\s+/g, '.')}@demo.com`,
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
          role: 'editor',
          isCurrentUser: true
      };

      setMembers(prev => [...prev.map(m => ({ ...m, isCurrentUser: false })), newUser]);
      setLoggedUserId(newUserId);
      setPendingInvite(false);
      window.history.replaceState({}, document.title, window.location.pathname);
  };

  const handleManualLogin = () => {
    if (members.length > 0) {
        setLoggedUserId(members[0].id);
    } else {
        const demoUser: User = {
            id: 'demo_user',
            name: 'Usuario Demo',
            email: 'demo@pantrypal.com',
            avatarUrl: '',
            role: 'owner',
            isCurrentUser: true
        };
        setMembers([demoUser]);
        setLoggedUserId(demoUser.id);
    }
  };

  const handleGoogleLogin = (credentialResponse: any) => {
      const token = credentialResponse.credential;
      const decoded = decodeJwt(token);
      console.log("Google Login Payload:", decoded);

      if (decoded) {
          const existingUser = members.find(m => m.email === decoded.email || m.id === decoded.sub);

          if (existingUser) {
              setLoggedUserId(existingUser.id);
              const needsUpdate = existingUser.avatarUrl !== decoded.picture || existingUser.name !== decoded.name;
              if (needsUpdate) {
                  setMembers(prev => prev.map(m => m.id === existingUser.id ? { 
                      ...m, 
                      name: decoded.name, 
                      avatarUrl: decoded.picture 
                  } : m));
              }
          } else {
              const newUser: User = {
                  id: decoded.sub, 
                  name: decoded.name,
                  email: decoded.email,
                  avatarUrl: decoded.picture,
                  role: 'owner', 
                  isCurrentUser: true
              };
              setMembers(prev => [...prev, newUser]);
              setLoggedUserId(newUser.id);
          }
      }
  };

  const handleLogout = () => {
    setLoggedUserId(null);
    localStorage.removeItem('loggedUserId');
    if (window.google && window.google.accounts) {
        window.google.accounts.id.disableAutoSelect();
    }
  };

  // --- SYNC HANDLERS ---
  const handleGenerateCode = async (): Promise<string> => {
      return new Promise((resolve) => {
          if (!socketRef.current || !isConnected) {
              alert("No hay conexión con el servidor. Verifica la URL del servidor en 'Gestionar Acceso'.");
              resolve('');
              return;
          }

          // Emit create session
          socketRef.current.emit('create_session', {
              products,
              categories,
              members
          });

          // Listen for the code response (one-time listener)
          socketRef.current.once('session_created', ({ code }) => {
              setSyncCode(code); // Save locally so we stay connected to this session
              resolve(code);
          });
      });
  };

  const handleLinkDevice = async (code: string) => {
      if (!socketRef.current || !isConnected) {
          alert("No hay conexión con el servidor. Verifica la URL del servidor en 'Gestionar Acceso'.");
          return false;
      }

      return new Promise<boolean>((resolve) => {
          // Join existing session
          socketRef.current?.emit('join_session', { 
              code, 
              user: currentUser || { name: 'New Device', id: 'dev' } 
          });

          // We wait for initial data as confirmation, or an error
          const onData = () => {
              setSyncCode(code);
              cleanup();
              resolve(true);
          };
          
          const onError = (err: any) => {
              alert(err.message || "Error al vincular");
              cleanup();
              resolve(false);
          };

          const cleanup = () => {
              socketRef.current?.off('sync_initial_data', onData);
              socketRef.current?.off('error', onError);
          };

          socketRef.current?.once('sync_initial_data', onData);
          socketRef.current?.once('error', onError);
          
          // Timeout fallback
          setTimeout(() => {
              cleanup();
              resolve(false); 
          }, 5000);
      });
  };

  const handleUpdateServerUrl = (url: string) => {
      setServerUrl(url);
      setSyncCode(null); // Reset sync when server changes
  };

  // Product Handlers
  const addProduct = (newProduct: Product) => {
    if (currentUser?.role === 'viewer') return;
    setProducts(prev => [newProduct, ...prev]);
  };

  const updateProduct = (updatedProduct: Product) => {
    if (currentUser?.role === 'viewer') return;
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const deleteProduct = (productId: string) => {
      if (currentUser?.role === 'viewer') return;
      setProducts(prev => prev.filter(p => p.id !== productId));
  };

  // Category Handlers
  const addCategory = (category: Category) => {
    if (currentUser?.role === 'viewer') return;
    setCategories(prev => [...prev, category]);
  };

  const updateCategory = (updatedCategory: Category) => {
    if (currentUser?.role === 'viewer') return;
    setCategories(prev => prev.map(c => c.id === updatedCategory.id ? updatedCategory : c));
  };

  const deleteCategory = (categoryId: string) => {
    if (currentUser?.role === 'viewer') return;
    if (window.confirm('¿Seguro que quieres eliminar esta categoría? Se borrarán los productos asociados.')) {
        setProducts(prev => prev.filter(p => p.categoryId !== categoryId));
        setCategories(prev => prev.filter(c => c.id !== categoryId));
    }
  };

  // Member Handlers
  const updateMembers = (newMembers: User[]) => {
      setMembers(newMembers);
  };
  
  const handleUpdateUser = (updatedUser: User) => {
      setMembers(prev => prev.map(m => m.id === updatedUser.id ? updatedUser : m));
  };

  return (
    <Router>
      <div className="bg-background-light dark:bg-background-dark min-h-screen text-slate-900 dark:text-white font-display">
        
        {/* Connection Status Indicator */}
        {!isConnected && isAuthenticated && (
            <div className="bg-amber-500 text-white text-xs text-center p-1 cursor-pointer" onClick={() => window.location.hash = "#/access"}>
                Sin conexión de sincronización (Click para configurar). Modo offline.
            </div>
        )}
        {isConnected && isAuthenticated && syncCode && (
             <div className="bg-green-600 text-white text-[10px] text-center p-0.5">
                Sincronizado
            </div>
        )}

        <JoinInviteModal 
            isOpen={pendingInvite} 
            onJoin={handleJoinTeam} 
            onClose={() => setPendingInvite(false)} 
        />

        <Routes>
          <Route 
            path="/" 
            element={
                !isAuthenticated ? 
                <Login 
                    onLogin={handleManualLogin} 
                    onGoogleLogin={handleGoogleLogin} 
                /> : <Navigate to="/inventory" />
            } 
          />
          <Route 
            path="/inventory" 
            element={isAuthenticated && currentUser ? 
                <Inventory 
                    products={products} 
                    categories={categories}
                    onUpdateProduct={updateProduct} 
                    onDeleteProduct={deleteProduct}
                    onAddCategory={addCategory}
                    onUpdateCategory={updateCategory}
                    onDeleteCategory={deleteCategory}
                    userRole={currentUser.role}
                /> : <Navigate to="/" />} 
            />
          <Route 
            path="/shopping-list" 
            element={isAuthenticated && currentUser ? 
                <ShoppingList 
                    products={products} 
                    categories={categories}
                    onUpdateProduct={updateProduct}
                    userRole={currentUser.role} 
                /> : <Navigate to="/" />} 
            />
          <Route 
            path="/add" 
            element={isAuthenticated && currentUser ? 
                <AddProduct 
                    categories={categories}
                    onAdd={addProduct} 
                /> : <Navigate to="/" />} 
            />
          <Route 
            path="/profile" 
            element={isAuthenticated && currentUser ? 
                <Profile 
                    user={currentUser}
                    onUpdateUser={handleUpdateUser}
                    onLogout={handleLogout} 
                /> : <Navigate to="/" />} 
            />
          <Route 
            path="/access" 
            element={isAuthenticated && currentUser ? 
                <ManageAccess 
                    members={members} 
                    onUpdateMembers={updateMembers} 
                    onLinkDevice={handleLinkDevice}
                    onGenerateCode={handleGenerateCode}
                    currentSyncCode={syncCode}
                    serverUrl={serverUrl}
                    onUpdateServerUrl={handleUpdateServerUrl}
                    isConnected={isConnected}
                /> : <Navigate to="/" />} 
            />
        </Routes>
      </div>
    </Router>
  );
};

export default App;