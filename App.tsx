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

// Mock initial data
const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'Yogurt Griego', quantity: 3, unit: 'unidades', expiryDate: '2023-10-25', categoryId: 'cat_food', status: 'expired', cost: 4.50, addedDate: new Date().toISOString() },
  { id: '2', name: 'Leche Entera', quantity: 2, unit: 'L', expiryDate: '2023-10-28', categoryId: 'cat_food', status: 'warning', cost: 2.40, addedDate: new Date().toISOString() },
];

const INITIAL_MEMBERS: User[] = [];

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

// Helper to decode JWT
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
  
  // Refs for State in Events
  // We use refs so socket callbacks can access the LATEST state without needing to re-bind the listener
  const syncCodeRef = useRef(syncCode);
  const userRef = useRef<User | null>(null); 
  const shouldEmit = useRef(true);

  // Auth State
  const [loggedUserId, setLoggedUserId] = useState<string | null>(() => {
      return loadState<string | null>('loggedUserId', null);
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
      syncCodeRef.current = syncCode; // Update Ref
  }, [syncCode]);
  
  useEffect(() => { 
      if (loggedUserId) localStorage.setItem('loggedUserId', JSON.stringify(loggedUserId)); 
      else localStorage.removeItem('loggedUserId');
  }, [loggedUserId]);

  // Derived Current User
  const currentUser = React.useMemo(() => {
      if (!loggedUserId) return null;
      return members.find(m => m.id === loggedUserId) || null;
  }, [members, loggedUserId]);

  // Keep ref updated
  useEffect(() => {
      userRef.current = currentUser;
  }, [currentUser]);

  // --- SOCKET.IO CONNECTION ---
  useEffect(() => {
    if (!serverUrl) return;

    console.log("Connecting to:", serverUrl);

    const socket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnectionAttempts: 5
    });
    socketRef.current = socket;

    socket.on('connect', () => {
        console.log("Connected to backend", socket.id);
        setIsConnected(true);
        // Automatic Rejoin on reconnect
        if (syncCodeRef.current) {
            console.log("Rejoining session:", syncCodeRef.current);
            socket.emit('join_session', { code: syncCodeRef.current, user: userRef.current });
        }
    });

    socket.on('disconnect', () => {
        setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
        console.warn("Socket error:", err.message);
        setIsConnected(false);
    });

    // --- INCOMING DATA HANDLERS ---
    
    // Generic Data Sync
    socket.on('data_updated', ({ type, data }) => {
        console.log("Remote update received:", type);
        shouldEmit.current = false; // Don't echo this back
        if (type === 'products') setProducts(data);
        if (type === 'categories') setCategories(data);
        if (type === 'members') setMembers(data);
        setTimeout(() => { shouldEmit.current = true; }, 100);
    });

    // Initial Full Sync
    socket.on('sync_initial_data', (data) => {
        console.log("Initial data received");
        shouldEmit.current = false;
        
        // Merge logic: Overwrite local with server if server has data
        if (data.products && data.products.length > 0) setProducts(data.products);
        if (data.categories && data.categories.length > 0) setCategories(data.categories);
        
        let finalMembers = data.members || [];
        
        // --- AUTO-CREATE USER LOGIC ---
        // We check if "I" exist in the incoming member list.
        // We rely on userRef.current to get the current logged in state ID, 
        // or we generate a new one if completely new.
        
        const myId = loadState<string | null>('loggedUserId', null); // Direct read to be safe
        const amIInList = myId && finalMembers.find((m: User) => m.id === myId);
        
        // If I am logged in locally, but not in the server list, I need to add myself.
        if (myId && !amIInList) {
             // Try to find local user object to push
             // We can't trust `members` state here as it might be old, so we construct a "New Device" profile if needed
             // or try to reuse what we had in `userRef`.
             let meToAdd: User;

             if (userRef.current && userRef.current.id === myId) {
                 meToAdd = userRef.current;
             } else {
                 // Fallback: Create new profile
                 meToAdd = {
                      id: myId,
                      name: `Dispositivo ${Math.floor(Math.random() * 100)}`,
                      email: '',
                      avatarUrl: '',
                      role: 'editor',
                      isCurrentUser: true
                 };
             }

             // Add me to list
             finalMembers = [...finalMembers, meToAdd];
             console.log("Auto-adding self to synced members list", meToAdd);
             
             // Emit this update immediately so server knows about me
             // We use a small timeout to let the 'members' state settle if we were to just set it, 
             // but emitting directly is safer for the group.
             socket.emit('update_data', { 
                 roomId: `room_${syncCodeRef.current}`, 
                 type: 'members', 
                 data: finalMembers 
             });
        }
        
        setMembers(finalMembers);

        setTimeout(() => { shouldEmit.current = true; }, 500);
    });

    return () => {
        socket.disconnect();
    };
  }, [serverUrl]); 

  // --- OUTGOING SYNC EMITTERS ---
  // Broadcast local changes to server
  useEffect(() => {
      if (isConnected && syncCode && shouldEmit.current) {
          socketRef.current?.emit('update_data', { roomId: `room_${syncCode}`, type: 'products', data: products });
      }
  }, [products, isConnected, syncCode]);

  useEffect(() => {
      if (isConnected && syncCode && shouldEmit.current) {
          socketRef.current?.emit('update_data', { roomId: `room_${syncCode}`, type: 'categories', data: categories });
      }
  }, [categories, isConnected, syncCode]);
  
  useEffect(() => {
      if (isConnected && syncCode && shouldEmit.current) {
          socketRef.current?.emit('update_data', { roomId: `room_${syncCode}`, type: 'members', data: members });
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

  // Safety: Logout if member removed
  useEffect(() => {
      if (loggedUserId && members.length > 0 && !members.find(m => m.id === loggedUserId)) {
          // Only logout if we are fully synced and confirmed not in list.
          // To prevent accidental logout on initial load/sync, we could check isConnected
          if (isConnected) {
             console.warn("User ID not found in synced members. Logging out.");
             // setLoggedUserId(null); // Optional: Enable strictly if you want to kick removed users
          }
      }
  }, [members, loggedUserId, isConnected]);

  const isAuthenticated = !!loggedUserId;

  // --- ACTIONS ---

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
  };

  const handleManualLogin = () => {
    if (members.length > 0) {
        const userToLogin = members.find(m => m.isCurrentUser) || members[0];
        setLoggedUserId(userToLogin.id);
    } else {
        const demoUser: User = {
            id: 'owner_' + Date.now(),
            name: 'Administrador',
            email: 'admin@pantrypal.com',
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
      
      if (decoded) {
          const existingUser = members.find(m => m.email === decoded.email || m.id === decoded.sub);

          if (existingUser) {
              setLoggedUserId(existingUser.id);
              const updatedMembers = members.map(m => m.id === existingUser.id ? { 
                  ...m, 
                  name: decoded.name, 
                  avatarUrl: decoded.picture,
                  isCurrentUser: true
              } : { ...m, isCurrentUser: false });
              setMembers(updatedMembers);
          } else {
              const newUser: User = {
                  id: decoded.sub, 
                  name: decoded.name,
                  email: decoded.email,
                  avatarUrl: decoded.picture,
                  role: 'owner', 
                  isCurrentUser: true
              };
              setMembers(prev => [...prev.map(m => ({...m, isCurrentUser: false})), newUser]);
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
              alert("Sin conexión. Verifica tu servidor.");
              resolve('');
              return;
          }

          socketRef.current.emit('create_session', {
              products,
              categories,
              members
          });

          socketRef.current.once('session_created', ({ code }) => {
              setSyncCode(code); 
              resolve(code);
          });
      });
  };

  const handleLinkDevice = async (code: string) => {
      if (!socketRef.current || !isConnected) {
          alert("Sin conexión.");
          return false;
      }

      return new Promise<boolean>((resolve) => {
          // Identify self
          const myUser = members.find(m => m.id === loggedUserId);
          
          socketRef.current?.emit('join_session', { 
              code, 
              user: myUser 
          });

          // Wait for specific success ack from server
          const onSuccess = ({ code: validCode }: { code: string }) => {
              if (validCode === code.toUpperCase()) {
                  setSyncCode(validCode);
                  cleanup();
                  resolve(true);
              }
          };
          
          const onError = (err: any) => {
              alert(err.message || "Error al vincular");
              cleanup();
              resolve(false);
          };

          const cleanup = () => {
              socketRef.current?.off('session_joined', onSuccess);
              socketRef.current?.off('error', onError);
          };

          socketRef.current?.on('session_joined', onSuccess);
          socketRef.current?.once('error', onError);
          
          setTimeout(() => {
              cleanup();
              resolve(false); 
          }, 5000);
      });
  };

  const handleUpdateServerUrl = (url: string) => {
      setServerUrl(url);
      setSyncCode(null); 
  };

  // CRUD Handlers
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

  const updateMembers = (newMembers: User[]) => {
      setMembers(newMembers);
  };
  
  const handleUpdateUser = (updatedUser: User) => {
      const newMembers = members.map(m => m.id === updatedUser.id ? updatedUser : m);
      setMembers(newMembers);
  };

  return (
    <Router>
      <div className="bg-background-light dark:bg-background-dark min-h-screen text-slate-900 dark:text-white font-display">
        
        {!isConnected && isAuthenticated && (
            <div className="bg-amber-500 text-white text-xs text-center p-1 cursor-pointer" onClick={() => window.location.hash = "#/access"}>
                Modo Offline. Toca para conectar.
            </div>
        )}
        {isConnected && isAuthenticated && syncCode && (
             <div className="bg-green-600 text-white text-[10px] text-center p-0.5">
                Sincronizado: {syncCode}
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