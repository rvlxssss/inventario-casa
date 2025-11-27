import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();

    const navItems = [
        { path: '/inventory', icon: 'inventory_2', label: 'Inventario' },
        { path: '/shopping-list', icon: 'shopping_cart', label: 'Compras' },
        { path: '/add', icon: 'add_circle', label: 'Añadir', isFab: true },
        { path: '/access', icon: 'group', label: 'Equipo' },
        { path: '/profile', icon: 'person', label: 'Perfil' },
    ];

    return (
        <div className="min-h-screen bg-background text-text pb-24 relative overflow-hidden">
            {/* Ambient Background Effects */}
            <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[100px] pointer-events-none z-0" />
            <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/20 rounded-full blur-[100px] pointer-events-none z-0" />

            {/* Main Content */}
            <main className="relative z-10 p-4 animate-fade-in">
                {children}
            </main>

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2">
                <nav className="glass rounded-2xl h-16 flex items-center justify-around shadow-2xl shadow-black/50">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;

                        if (item.isFab) {
                            return (
                                <button
                                    key={item.path}
                                    onClick={() => navigate(item.path)}
                                    className="relative -top-6 bg-primary hover:bg-primary-dark text-white w-14 h-14 rounded-full shadow-lg shadow-primary/40 flex items-center justify-center transition-transform active:scale-95"
                                >
                                    <span className="material-symbols-outlined text-3xl">{item.icon}</span>
                                </button>
                            );
                        }

                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 ${isActive ? 'text-primary' : 'text-text-muted hover:text-text'
                                    }`}
                            >
                                <span className={`material-symbols-outlined text-2xl mb-0.5 transition-transform ${isActive ? 'scale-110' : ''}`}>
                                    {item.icon}
                                </span>
                                <span className="text-[10px] font-medium">{item.label}</span>
                                {isActive && (
                                    <span className="absolute bottom-2 w-1 h-1 bg-primary rounded-full" />
                                )}
                            </button>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
};
