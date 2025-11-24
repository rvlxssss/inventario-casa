import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product, Category } from '../types';
import { BottomNav } from '../components/BottomNav';

interface InventoryProps {
  products: Product[];
  categories: Category[];
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onAddCategory: (category: Category) => void;
  onUpdateCategory: (category: Category) => void;
  onDeleteCategory: (id: string) => void;
  userRole?: 'owner' | 'editor' | 'viewer';
}

// --- Helpers ---
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

// --- Consume Modal ---
interface ConsumeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (amount: number) => void;
    productName: string;
    unit: string;
    maxQuantity: number;
}

const ConsumeModal: React.FC<ConsumeModalProps> = ({ isOpen, onClose, onConfirm, productName, unit, maxQuantity }) => {
    const [amount, setAmount] = useState('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        const val = parseFloat(amount);
        // Explicitly use maxQuantity in validation logic
        if (val > 0 && val <= maxQuantity) {
            onConfirm(val);
            setAmount('');
            onClose();
        } else if (val > maxQuantity) {
            alert(`No puedes consumir más de lo que tienes (${maxQuantity} ${unit})`);
        } else {
            alert("Por favor ingresa una cantidad válida");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-[#1e1e1e] w-full max-w-sm rounded-2xl p-6 shadow-2xl">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Consumir Producto</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
                    ¿Cuánto {productName} has consumido?
                    <br/>
                    {/* Explicitly use maxQuantity in display */}
                    <span className="text-xs text-slate-400">Disponible: {maxQuantity} {unit}</span>
                </p>
                
                <div className="relative mb-6">
                    <input 
                        type="number" 
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-black/20 p-4 text-2xl font-bold text-center text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-500/50 outline-none"
                        placeholder="0"
                        // Explicitly use maxQuantity in input attribute
                        max={maxQuantity}
                        autoFocus
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">{unit}</span>
                </div>

                <div className="flex gap-3">
                    <button 
                        onClick={onClose}
                        className="flex-1 h-12 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={!amount}
                        className="flex-1 h-12 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold disabled:opacity-50"
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Product Item Component ---
const ProductItem: React.FC<{ 
    product: Product; 
    onUpdate: (p: Product) => void;
    onDelete: (id: string) => void;
    onConsumeRequest: (p: Product) => void;
    isReadOnly: boolean;
}> = ({ product, onUpdate, onDelete, onConsumeRequest, isReadOnly }) => {
  
  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isReadOnly) return;
    // If unit is measurable (not simple units), open modal
    const measurableUnits = ['g', 'ml', 'kg', 'L'];
    if (measurableUnits.includes(product.unit)) {
        onConsumeRequest(product);
    } else {
        // Standard decrement
        const newQuantity = Math.max(0, product.quantity - 1);
        onUpdate({ ...product, quantity: newQuantity });
    }
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isReadOnly) return;
    let step = 1;
    if (product.unit === 'g' || product.unit === 'ml') step = 50; 
    if (product.unit === 'kg' || product.unit === 'L') step = 0.5;

    onUpdate({ ...product, quantity: product.quantity + step });
  };

  const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isReadOnly) return;
      if(window.confirm('¿Eliminar este producto permanentemente?')) {
          onDelete(product.id);
      }
  };

  return (
    <div className="group/item relative flex items-center gap-3 bg-white dark:bg-surface-dark px-3 min-h-[80px] py-3 rounded-xl shadow-sm border border-transparent dark:border-white/5 transition-colors overflow-hidden">
      
      {/* Icon */}
      <div className={`flex items-center justify-center rounded-lg shrink-0 size-12 ${getStatusColorClass(product.status)}`}>
        <span className="material-symbols-outlined">{getStatusIcon(product.status)}</span>
      </div>
      
      {/* Text Info - Added pr-10 to prevent overlap with absolute delete button */}
      <div className="flex flex-col justify-center flex-1 min-w-0 mr-1 pr-10 sm:pr-0">
        <p className="text-slate-800 dark:text-white text-base font-bold leading-tight truncate">{product.name}</p>
        <p className={`text-xs mt-1 truncate ${getStatusTextClass(product.status)}`}>
          {getStatusMessage(product)}
        </p>
      </div>

      {/* Delete Button (Absolute for small footprint) - Increased touch target */}
      {!isReadOnly && (
        <button 
            onClick={handleDelete}
            className="absolute right-0 top-0 p-3 text-slate-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 z-10"
        >
            <span className="material-symbols-outlined text-xl">delete</span>
        </button>
      )}

      {/* Controls */}
      <div className="shrink-0 flex items-center bg-slate-50 dark:bg-black/20 rounded-lg p-1 gap-1 sm:gap-3 border border-slate-100 dark:border-white/5 mt-auto">
        <button 
          onClick={handleDecrement}
          disabled={isReadOnly}
          className="size-8 flex items-center justify-center rounded-md bg-white dark:bg-surface-dark text-slate-600 dark:text-slate-300 shadow-sm active:scale-95 transition-transform disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-lg">remove</span>
        </button>
        
        <div className="flex flex-col items-center min-w-[3rem] text-center">
            <span className="text-slate-800 dark:text-white text-sm sm:text-base font-bold leading-none">{Number(product.quantity).toLocaleString()}</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-none mt-0.5">{product.unit}</span>
        </div>

        <button 
          onClick={handleIncrement}
          disabled={isReadOnly}
          className="size-8 flex items-center justify-center rounded-md bg-white dark:bg-surface-dark text-slate-600 dark:text-slate-300 shadow-sm active:scale-95 transition-transform disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-lg">add</span>
        </button>
      </div>
    </div>
  );
};

// --- Category Modal ---
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

    React.useEffect(() => {
        if(isOpen) {
            setName(initialName || '');
            setIcon(initialIcon || 'inventory_2');
        }
    }, [isOpen, initialName, initialIcon]);

    if (!isOpen) return null;

    const icons = ['inventory_2', 'restaurant', 'cleaning_services', 'soap', 'pets', 'checkroom', 'kitchen', 'medication', 'toys', 'construction', 'spa', 'local_cafe', 'bakery_dining', 'liquor'];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-[#1e1e1e] w-full max-w-sm rounded-2xl p-6 shadow-2xl">
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
                        <div className="grid grid-cols-5 gap-2">
                            {icons.map(ic => (
                                <button
                                    key={ic}
                                    onClick={() => setIcon(ic)}
                                    className={`aspect-square flex items-center justify-center rounded-lg transition-all ${icon === ic ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 scale-110' : 'bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10'}`}
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

// --- Main Component ---
export const Inventory: React.FC<InventoryProps> = ({ 
    products, categories, onUpdateProduct, onDeleteProduct, onAddCategory, onUpdateCategory, onDeleteCategory, userRole = 'owner' 
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const isViewer = userRole === 'viewer';
  
  // Modal States
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  const [isConsumeModalOpen, setIsConsumeModalOpen] = useState(false);
  const [consumeProduct, setConsumeProduct] = useState<Product | null>(null);

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
    if (isViewer) return;
    setEditingCategory(cat);
    setIsCatModalOpen(true);
  };

  const handleAddCatClick = () => {
    setEditingCategory(null);
    setIsCatModalOpen(true);
  };

  const handleConsumeRequest = (p: Product) => {
      setConsumeProduct(p);
      setIsConsumeModalOpen(true);
  };

  const handleConsumeConfirm = (amount: number) => {
      if (consumeProduct) {
          const newQuantity = Math.max(0, consumeProduct.quantity - amount);
          onUpdateProduct({ ...consumeProduct, quantity: newQuantity });
      }
  };

  const handleAddProductToCategory = (catId: string) => {
      if (isViewer) {
          alert("Solo editores pueden añadir productos.");
          return;
      }
      navigate('/add', { state: { categoryId: catId } });
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
                        className="flex items-center justify-center rounded-full h-12 w-12 text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                    >
                        <span className="material-symbols-outlined">qr_code_scanner</span>
                    </button>
                    <button 
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
                // If searching, hide empty categories
                if (searchTerm && catProducts.length === 0) return null;

                return (
                    <div key={cat.id} className="space-y-3">
                        {/* Category Header */}
                        <div className="flex items-center justify-between px-1 group">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-slate-400 text-lg">{cat.icon}</span>
                                <h2 className="text-lg font-bold text-slate-800 dark:text-white">{cat.name}</h2>
                            </div>
                            <div className="flex items-center gap-1">
                                {!isViewer && (
                                    <>
                                        <button
                                            onClick={() => handleAddProductToCategory(cat.id)}
                                            className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white hover:bg-primary hover:text-white transition-colors"
                                            title="Añadir producto a esta categoría"
                                        >
                                            <span className="material-symbols-outlined text-lg">add</span>
                                        </button>
                                        <button 
                                            onClick={() => handleEditClick(cat)}
                                            className="h-8 w-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-lg">edit</span>
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                        
                        {/* Products List */}
                        {catProducts.length > 0 ? (
                            <div className="space-y-3">
                                {catProducts.map(p => (
                                    <ProductItem 
                                        key={p.id} 
                                        product={p} 
                                        onUpdate={onUpdateProduct} 
                                        onDelete={onDeleteProduct}
                                        onConsumeRequest={handleConsumeRequest}
                                        isReadOnly={isViewer}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-xl text-slate-400">
                                <p className="text-sm mb-2">Sin productos</p>
                                {!isViewer && (
                                    <button 
                                        onClick={() => handleAddProductToCategory(cat.id)}
                                        className="text-xs font-bold text-primary dark:text-white bg-slate-100 dark:bg-white/10 px-3 py-1.5 rounded-lg"
                                    >
                                        + Añadir aquí
                                    </button>
                                )}
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

             {/* Add Category Button */}
             {!isViewer && (
                 <button 
                    onClick={handleAddCatClick}
                    className="w-full py-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                 >
                    <span className="material-symbols-outlined">add_circle</span>
                    Nueva Categoría Principal
                 </button>
             )}

        </main>

        <CategoryModal 
            isOpen={isCatModalOpen}
            onClose={() => setIsCatModalOpen(false)}
            onSave={handleSaveCategory}
            initialName={editingCategory?.name}
            initialIcon={editingCategory?.icon}
            isEdit={!!editingCategory}
            onDelete={() => {
                if(editingCategory) {
                    onDeleteCategory(editingCategory.id);
                    setIsCatModalOpen(false);
                }
            }}
        />

        <ConsumeModal 
            isOpen={isConsumeModalOpen}
            onClose={() => setIsConsumeModalOpen(false)}
            onConfirm={handleConsumeConfirm}
            productName={consumeProduct?.name || ''}
            unit={consumeProduct?.unit || ''}
            maxQuantity={consumeProduct?.quantity || 0}
        />
        
        <BottomNav />
    </div>
  );
};