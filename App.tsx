import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Inventory } from './pages/Inventory';
import { AddProduct } from './pages/AddProduct';
import { Profile } from './pages/Profile';
import { ManageAccess } from './pages/ManageAccess';
import { ShoppingList } from './pages/ShoppingList';
import { AuthProvider, useAuth } from './context/AuthContext';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import { useSync } from './hooks/useSync';
import { useNotifications } from './hooks/useNotifications';
import { loadState, saveState } from './utils/storage';

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

const MainApp: React.FC = () => {
    const {
        products, categories, expenses, transactions,
        addProduct, updateProduct, deleteProduct,
        addCategory, updateCategory, deleteCategory
    } = useInventory();

    const {
        members, setMembers, currentUser, isAuthenticated,
        logout, joinTeam, updateUser,
        pendingInvite, setPendingInvite
    } = useAuth();

    const [serverUrl, setServerUrl] = useState<string>(() => loadState('serverUrl', import.meta.env.PROD
        ? 'https://inventario-casa.vercel.app'
        : 'http://localhost:3001'));

    // Initialize Sync Hook
    const { isConnected, syncCode, createSession, joinSession, setSyncCode } = useSync(serverUrl);

    // Initialize Notifications
    useNotifications();

    useEffect(() => { saveState('serverUrl', serverUrl); }, [serverUrl]);

    const handleUpdateServerUrl = (url: string) => {
        setServerUrl(url);
        setSyncCode(null);
    };

    const handleGenerateCode = async () => {
        return await createSession({ products, categories, members });
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
                    onJoin={joinTeam}
                    onClose={() => setPendingInvite(false)}
                />

                <Routes>
                    <Route
                        path="/"
                        element={
                            !isAuthenticated ?
                                <Login /> : <Navigate to="/inventory" />
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
                                expenses={expenses}
                                transactions={transactions}
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
                                onUpdate={updateProduct}
                            /> : <Navigate to="/" />}
                    />
                    <Route
                        path="/profile"
                        element={isAuthenticated && currentUser ?
                            <Profile
                                user={currentUser}
                                onUpdateUser={updateUser}
                                onLogout={logout}
                            /> : <Navigate to="/" />}
                    />
                    <Route
                        path="/access"
                        element={isAuthenticated && currentUser ?
                            <ManageAccess
                                members={members}
                                onUpdateMembers={setMembers}
                                onLinkDevice={joinSession}
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

const App: React.FC = () => {
    return (
        <AuthProvider>
            <InventoryProvider>
                <MainApp />
            </InventoryProvider>
        </AuthProvider>
    );
};

export default App;