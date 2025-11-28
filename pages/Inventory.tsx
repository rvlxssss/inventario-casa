import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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

const CategoryModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    categories: Category[];
    onAdd: (category: Category) => void;
    onUpdate: (category: Category) => void;
    onDelete: (id: string) => void;
}> = ({ isOpen, onClose, categories, onAdd, onUpdate, onDelete }) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [icon, setIcon] = useState('inventory_2');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;

        if (editingId) {
            onUpdate({ id: editingId, name, icon });
            setEditingId(null);
        } else {
            onAdd({ id: Date.now().toString(), name, icon });
        }
        setName('');
        setIcon('inventory_2');
    };

    const handleEdit = (cat: Category) => {
        setEditingId(cat.id);
        setName(cat.name);
        setIcon(cat.icon);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setName('');
        setIcon('inventory_2');
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-[#1e1e1e] w-full max-w-md rounded-2xl p-6 shadow-2xl flex flex-col max-h-[80vh]">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Gestionar Categorías</h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-900 dark:hover:text-white">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="mb-6 space-y-3">
                    <div className="flex gap-2">
                        <div className="relative">
                            <button
                                type="button"
                                className="w-12 h-12 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-white/5"
                                onClick={() => {
                                    const icons = ['inventory_2', 'restaurant', 'cleaning_services', 'soap', 'pets', 'local_bar', 'kitchen', 'fastfood', 'icecream'];
                                    const currentIdx = icons.indexOf(icon);
                                    setIcon(icons[(currentIdx + 1) % icons.length]);
                                }}
                            >
                                <span className="material-symbols-outlined">{icon}</span>
                            </button>
                        </div>
                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Nombre de categoría"
                            className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-black/20 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-500/50 outline-none"
                        />
                        <button
                            type="submit"
                            className="w-12 h-12 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center hover:opacity-90"
                        >
                            <span className="material-symbols-outlined">{editingId ? 'save' : 'add'}</span>
                        </button>
                    </div>
                    {editingId && (
                        <div className="text-xs text-slate-500 flex justify-end">
                            <button type="button" onClick={handleCancelEdit} className="underline">Cancelar Edición</button>
                        </div>
                    )}
                </form>

                <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                    {categories.map(cat => (
                        <div key={cat.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-slate-500">{cat.icon}</span>
                                <span className="font-medium text-slate-900 dark:text-white">{cat.name}</span>
                            </div>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => handleEdit(cat)}
                                    className="w-8 h-8 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 flex items-center justify-center text-slate-500"
                                >
                                    <span className="material-symbols-outlined text-lg">edit</span>
                                </button>
                                <button
                                    onClick={() => onDelete(cat.id)}
                                    className="w-8 h-8 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 flex items-center justify-center text-red-500"
                                >
                                    <span className="material-symbols-outlined text-lg">delete</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export const Inventory: React.FC<InventoryProps> = ({
    products, categories, onDeleteProduct, onAddCategory, onUpdateCategory, onDeleteCategory, userRole, onUpdateProduct
}) => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

    const getDiffDays = (dateStr: string) => {
        if (!dateStr) return 9999;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [year, month, day] = dateStr.split('-').map(Number);
        const expiry = new Date(year, month - 1, day);
        const diffTime = expiry.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const filteredProducts = useMemo(() => {
        const filtered = products
            .filter(p => p.quantity > 0) // Hide out of stock items
            .filter(p => {
                const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
                return matchesSearch && matchesCategory;
            });

        return filtered.sort((a, b) => {
            const daysA = getDiffDays(a.expiryDate);
            const daysB = getDiffDays(b.expiryDate);

            const getPriority = (days: number) => {
                if (days < 0) return 0; // Expired
                if (days <= 7) return 1; // About to expire
                return 2; // Good condition
            };

            const priorityA = getPriority(daysA);
            const priorityB = getPriority(daysB);

            if (priorityA !== priorityB) return priorityA - priorityB;
            return daysA - daysB;
        });
    }, [products, searchTerm, selectedCategory]);

    const getExpiryStatus = (dateStr: string) => {
        const diffDays = getDiffDays(dateStr);
        if (diffDays < 0) return { color: 'bg-danger', text: 'Vencido', icon: 'error' };
        if (diffDays <= 7) return { color: 'bg-warning', text: diffDays === 0 ? 'Vence hoy' : `${diffDays} días`, icon: 'warning' };
        return { color: 'bg-success', text: 'Buen estado', icon: 'check_circle' };
    };

    const handleProductClick = (product: Product) => {
        if (userRole === 'viewer') return;
        navigate('/add', { state: { product } });
    };

    const handleUpdateQuantity = (e: React.MouseEvent, product: Product, change: number) => {
        e.stopPropagation();
        if (userRole === 'viewer') return;
        const newQuantity = Math.max(0, product.quantity + change);
        onUpdateProduct({ ...product, quantity: newQuantity });
    };

    return (
        <Layout>
            {/* Header & Search */}
            <div className="sticky top-0 z-40 pb-4 space-y-4">
                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-2xl font-bold text-white">Mi Despensa</h1>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsCategoryModalOpen(true)}
                            className="w-8 h-8 rounded-full bg-surface-highlight flex items-center justify-center border border-white/5 text-white hover:bg-white/10 transition-colors"
                        >
                            <span className="material-symbols-outlined text-lg">category</span>
                        </button>
                        <div className="w-8 h-8 rounded-full bg-surface-highlight flex items-center justify-center border border-white/5">
                            <span className="text-xs font-bold text-primary">{products.length}</span>
                        </div>
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
                        <div
                            key={product.id}
                            onClick={() => handleProductClick(product)}
                            className="glass rounded-2xl p-4 flex items-center gap-4 group active:scale-[0.98] transition-transform cursor-pointer"
                        >
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
                                    <div className="flex items-center bg-surface-highlight rounded-md border border-white/5 overflow-hidden" onClick={e => e.stopPropagation()}>
                                        <button
                                            onClick={(e) => handleUpdateQuantity(e, product, -1)}
                                            className="px-2 py-1 hover:bg-white/10 active:bg-white/20 transition-colors text-white"
                                        >
                                            -
                                        </button>
                                        <span className="px-2 py-0.5 font-medium text-white min-w-[3rem] text-center">
                                            {product.quantity} {product.unit}
                                        </span>
                                        <button
                                            onClick={(e) => handleUpdateQuantity(e, product, 1)}
                                            className="px-2 py-1 hover:bg-white/10 active:bg-white/20 transition-colors text-white"
                                        >
                                            +
                                        </button>
                                    </div>
                                    <span className={`flex items-center gap-1 ${status.color.replace('bg-', 'text-')}`}>
                                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                        {status.text}
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            {userRole !== 'viewer' && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteProduct(product.id);
                                    }}
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

            <CategoryModal
                isOpen={isCategoryModalOpen}
                onClose={() => setIsCategoryModalOpen(false)}
                categories={categories}
                onAdd={onAddCategory}
                onUpdate={onUpdateCategory}
                onDelete={onDeleteCategory}
            />
        </Layout>
    );
};