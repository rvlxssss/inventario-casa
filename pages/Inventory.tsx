
import React, { useState } from 'react';
import { Product, Category } from '../types';
import { BottomNav } from '../components/BottomNav';

interface InventoryProps {
  products: Product[];
  categories: Category[];
  onUpdateProduct: (product: Product) => void;
  onAddCategory: (category: Category) => void;
  onUpdateCategory: (category: Category) => void;
  onDeleteCategory: (id: string) => void;
}

// Helper Components & Functions
const getStatusIcon = (status: Product['status']) => {
  switch (status) {
    case 'expired': return 'error';
    case 'warning': return 'warning';
    default: return 'inventory_2';
  }
};

const getStatusColorClass = (status: Product['status']) => {
  switch (status) {
    case 'expired': return 'text-red-500 bg-red-500/10 dark:bg-red-500/20';
    case 'warning': return 'text-amber-500 bg-amber-500/10 dark:bg-amber-500/20';
    default: return 'text-primary dark:text-white bg-slate-100 dark:bg-white/10';
  }
};

const getStatusTextClass = (status: Product['status']) => {
    switch (status) {
    case 'expired': return 'text-red-500 font-medium';
    case 'warning': return 'text-amber-500 font-medium';
    default: return 'text-slate-500 dark:text-slate-400';
  }
}

const getStatusMessage = (p: Product) => {
    if (p.status === 'expired') return 'Venció ayer'; 
    if (p.status === 'warning') return 'Vence pronto';
    if (p.expiryDate) return `Vence: ${new Date(p.expiryDate).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}`;
    return 'En stock';
}

const ProductItem: React.FC<{ product: Product; onUpdate: (p: Product) => void }> = ({ product, onUpdate }) => {
  
  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newQuantity = Math.max(0, product.quantity - 1);
    onUpdate({ ...product, quantity: newQuantity });
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate({ ...product, quantity: product.quantity + 1 });
  };

  return (
    <div className="flex items-center gap-3 bg-white dark:bg-surface-dark px-3 min-h-[80px] py-3 rounded-xl shadow-sm border border-transparent dark:border-white/5 transition-colors">
      <div className={`flex items-center justify-center rounded-lg shrink-0 size-12 ${getStatusColorClass(product.status)}`}>
        <span className="material-symbols-outlined">{getStatusIcon(product.status)}</span>
      </div>
      
      <div className="flex flex-col justify-center flex-1 min-w-0 mr-2">
        <p className="text-slate-800 dark:text-white text-base font-bold leading-tight truncate">{product.name}</p>
        <p className={`text-xs mt-1 truncate ${getStatusTextClass(product.status)}`}>
          {getStatusMessage(product)}
        </p>
      </div>

      <div className="shrink-0 flex items-center bg-slate-50 dark:bg-black/20 rounded-lg p-1 gap-3 border border-slate-100 dark:border-white/5">
        <button 
          onClick={handleDecrement}
          className="size-8 flex items-center justify-center rounded-md bg-white dark:bg-surface-dark text-slate-600 dark:text-slate-300 shadow-sm active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-lg">remove</span>
        </button>
        
        <div className="flex flex-col items-center w-8">
            <span className="text-slate-800 dark:text-white text-base font-bold leading-none">{product.quantity}</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-none mt-0.5">{product.unit.substring(0,3)}</span>
        </div>

        <button 
          onClick={handleIncrement}
          className="size-8 flex items-center justify-center rounded-md bg-white dark:bg-surface-dark text-slate-600 dark:text-slate-300 shadow-sm active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-lg">add</span>
        </button>
      </div>
    </div>
  );
};

// Modal for adding/editing categories
const CategoryModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    onSave: (name: string, icon: string) => void; 
    initialName?: string;
    initialIcon?: string;
    isEdit?: boolean;
    onDelete?: () => void;
}> = ({ isOpen, onClose, onSave, initialName = '', initialIcon = 'inventory_2', isEdit = false, onDelete }) => {
    const [name, setName] = useState(initialName);
    const [icon, setIcon] = useState(initialIcon);

    // Reset state when opening
    React.useEffect(() => {
        if(isOpen) {
            setName(initialName || '');
            setIcon(initialIcon || 'inventory_2');
        } else {
             // Clear on close
             setName('');
             setIcon('inventory_2');
        }
    }, [isOpen, initialName, initialIcon]);

    if (!isOpen) return null;

    const icons = ['inventory_2', 'restaurant', 'cleaning_services', 'soap', 'pets', 'checkroom', 'kitchen', 'medication', 'toys', 'construction', 'spa'];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-[#1e1e1e] w-full max-w-sm rounded-2xl p-6 shadow-2xl transform transition-all">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                    {isEdit ? 'Editar Categoría' : 'Nueva Categoría'}
                </h3>
                
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1 block">Nombre</label>
                        <input 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-black/20 p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-500/50 outline-none"
                            placeholder="Ej: Congelados"
                        />
                    </div>
                    
                    <div>
                        <label className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2 block">Icono</label>
                        <div className="flex flex-wrap gap-2">
                            {icons.map(ic => (
                                <button
                                    key={ic}
                                    onClick={() => setIcon(ic)}
                                    className={`p-2 rounded-lg transition-all ${icon === ic ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 scale-110' : 'bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10'}`}
                                >
                                    <span className="material-symbols-outlined text-xl">{ic}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 mt-8">
                    {isEdit && onDelete && (
                        <button 
                            onClick={onDelete}
                            className="flex items-center justify-center h-12 w-12 rounded-xl bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400"
                            title="Eliminar Categoría"
                        >
                            <span className="material-symbols-outlined">delete</span>
                        </button>
                    )}
                    <button 
                        onClick={onClose}
                        className="flex-1 h-12 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={() => {
                            if(name) {
                                onSave(name, icon);
                                onClose();
                            }
                        }}
                        disabled={!name}
                        className="flex-1 h-12 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold disabled:opacity-50"
                    >
                        Guardar
                    </button>
                </div>
            </div>
        </div>
    );
};

export const Inventory: React.FC<InventoryProps> = ({ 
    products, categories, onUpdateProduct, onAddCategory, onUpdateCategory, onDeleteCategory 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Filtering
  const activeProducts = products.filter(p => p.quantity > 0);
  const filteredProducts = activeProducts.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveCategory = (name: string, icon: string) => {
    if (editingCategory) {
        onUpdateCategory({ ...editingCategory, name, icon });
    } else {
        onAddCategory({
            id: `cat_${Date.now()}`,
            name,
            icon
        });
    }
    setEditingCategory(null);
  };

  const handleEditClick = (cat: Category) => {
    setEditingCategory(cat);
    setIsModalOpen(true);
  };

  const handleAddClick = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleScanQR = () => {
      alert("Abriendo escáner de códigos QR...");
  };

  const handleMenuClick = () => {
      alert("Opciones: \n- Exportar inventario \n- Configuración \n- Ayuda");
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 flex flex-col bg-background-light dark:bg-background-dark shadow-sm dark:shadow-md dark:shadow-black/20">
            <div className="flex items-center p-4 pb-3 justify-between">
                <div className="text-slate-700 dark:text-white flex size-12 shrink-0 items-center">
                    <span className="material-symbols-outlined text-3xl">inventory_2</span>
                </div>
                <h1 className="text-slate-800 dark:text-white text-xl font-bold leading-tight tracking-tight flex-1">Mi Inventario</h1>
                <div className="flex items-center justify-end gap-2">
                    <button 
                        onClick={handleScanQR}
                        className="flex items-center justify-center rounded-full h-12 w-12 text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                    >
                        <span className="material-symbols-outlined">qr_code_scanner</span>
                    </button>
                    <button 
                        onClick={handleMenuClick} 
                        className="flex items-center justify-center rounded-full h-12 w-12 text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                    >
                        <span className="material-symbols-outlined">more_vert</span>
                    </button>
                </div>
            </div>
            
            <div className="px-4 pb-4 pt-1">
                <div className="flex w-full items-center rounded-xl bg-white dark:bg-surface-dark shadow-sm h-12 border border-slate-200 dark:border-transparent">
                    <div className="text-slate-500 dark:text-slate-400 flex items-center justify-center pl-4 pr-2">
                        <span className="material-symbols-outlined">search</span>
                    </div>
                    <input 
                        className="flex w-full min-w-0 flex-1 bg-transparent text-slate-800 dark:text-white focus:outline-none h-full placeholder:text-slate-500 dark:placeholder:text-slate-400 text-base"
                        placeholder="Buscar productos..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
        </div>

        {/* Content */}
        <main className="flex-1 px-4 pt-4 pb-32 space-y-6">
            
            {/* Dynamic Categories */}
            {categories.map(cat => {
                const catProducts = filteredProducts.filter(p => p.categoryId === cat.id);
                // Only hide empty categories if searching, otherwise show them so user can edit them
                if (searchTerm && catProducts.length === 0) return null;

                return (
                    <div key={cat.id} className="space-y-3">
                        <div className="flex items-center justify-between px-1 group">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-slate-400 text-lg">{cat.icon}</span>
                                <h2 className="text-lg font-bold text-slate-800 dark:text-white">{cat.name}</h2>
                            </div>
                            <button 
                                onClick={() => handleEditClick(cat)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
                            >
                                <span className="material-symbols-outlined text-lg">edit</span>
                            </button>
                        </div>
                        
                        {catProducts.length > 0 ? (
                            <div className="space-y-3">
                                {catProducts.map(p => <ProductItem key={p.id} product={p} onUpdate={onUpdateProduct} />)}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-xl text-slate-400">
                                <p className="text-sm">Sin productos</p>
                            </div>
                        )}
                    </div>
                );
            })}

             {activeProducts.length === 0 && !searchTerm && categories.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500 px-8 text-center">
                    <span className="material-symbols-outlined text-6xl mb-4 opacity-30">shelves</span>
                    <p className="text-lg font-medium mb-1">Tu inventario está vacío</p>
                    <p className="text-sm opacity-80">Añade una categoría para empezar.</p>
                </div>
             )}

             {/* Add Category Button at bottom of list */}
             <button 
                onClick={handleAddClick}
                className="w-full py-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
             >
                <span className="material-symbols-outlined">add_circle</span>
                Nueva Categoría
             </button>

        </main>

        <CategoryModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSaveCategory}
            initialName={editingCategory?.name}
            initialIcon={editingCategory?.icon}
            isEdit={!!editingCategory}
            onDelete={() => {
                if(editingCategory) {
                    onDeleteCategory(editingCategory.id);
                    setIsModalOpen(false);
                }
            }}
        />
        
        <BottomNav />
    </div>
  );
};
