import React, { useState, useMemo } from 'react';
import { Product, Category } from '../types';
import { Layout } from '../components/Layout';

interface InventoryProps {
    products: Product[];
    categories: Category[];
    onUpdateProduct: (product: Product) => void;
    onDeleteProduct: (id: string) => void;
    onAddCategory: (category: Category) => void;
    onUpdateCategory: (category: Category) => void;
    onDeleteCategory: (id: string) => void;
    userRole: 'owner' | 'editor' | 'viewer';
}

export const Inventory: React.FC<InventoryProps> = ({
    products, categories, onDeleteProduct, userRole
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [products, searchTerm, selectedCategory]);

    const getExpiryStatus = (dateStr: string) => {
        const today = new Date();
        const expiry = new Date(dateStr);
        const diffTime = expiry.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { color: 'bg-danger', text: 'Vencido', icon: 'error' };
        if (diffDays <= 3) return { color: 'bg-warning', text: `${diffDays} días`, icon: 'warning' };
        return { color: 'bg-success', text: 'Buen estado', icon: 'check_circle' };
    };

    return (
        <Layout>
            {/* Header & Search */}
            <div className="sticky top-0 z-40 pb-4 space-y-4">
                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-2xl font-bold text-white">Mi Despensa</h1>
                    <div className="w-8 h-8 rounded-full bg-surface-highlight flex items-center justify-center border border-white/5">
                        <span className="text-xs font-bold text-primary">{products.length}</span>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Buscar productos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-12 pl-12 pr-4 bg-surface-highlight/50 backdrop-blur-md border border-white/5 rounded-2xl text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                    <span className="material-symbols-outlined absolute left-4 top-3 text-text-muted">search</span>
                </div>

                {/* Categories Scroll */}
                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                    <button
                        onClick={() => setSelectedCategory('all')}
                        className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedCategory === 'all'
                                ? 'bg-primary text-white shadow-lg shadow-primary/25'
                                : 'bg-surface-highlight text-text-muted border border-white/5'
                            }`}
                    >
                        Todos
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${selectedCategory === cat.id
                                    ? 'bg-primary text-white shadow-lg shadow-primary/25'
                                    : 'bg-surface-highlight text-text-muted border border-white/5'
                                }`}
                        >
                            <span className="material-symbols-outlined text-lg">{cat.icon}</span>
                            {cat.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 gap-4 pb-20">
                {filteredProducts.map(product => {
                    const status = getExpiryStatus(product.expiryDate);

                    return (
                        <div key={product.id} className="glass rounded-2xl p-4 flex items-center gap-4 group active:scale-[0.98] transition-transform">
                            {/* Icon Box */}
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${status.color}/20 text-${status.color.replace('bg-', '')}`}>
                                <span className="material-symbols-outlined text-2xl">
                                    {categories.find(c => c.id === product.categoryId)?.icon || 'inventory_2'}
                                </span>
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-white truncate">{product.name}</h3>
                                <div className="flex items-center gap-2 text-xs text-text-muted mt-1">
                                    <span className="bg-surface-highlight px-2 py-0.5 rounded-md border border-white/5">
                                        {product.quantity} {product.unit}
                                    </span>
                                    <span className={`flex items-center gap-1 ${status.color.replace('bg-', 'text-')}`}>
                                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                        {status.text}
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            {userRole !== 'viewer' && (
                                <button
                                    onClick={() => onDeleteProduct(product.id)}
                                    className="w-8 h-8 rounded-full bg-surface-highlight flex items-center justify-center text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-lg">delete</span>
                                </button>
                            )}
                        </div>
                    );
                })}

                {filteredProducts.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-text-muted">
                        <span className="material-symbols-outlined text-6xl mb-4 opacity-20">inbox</span>
                        <p>No se encontraron productos</p>
                    </div>
                )}
            </div>
        </Layout>
    );
};