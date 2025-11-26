
import React, { useState } from 'react';
import { Product, Category } from '../types';
import { BottomNav } from '../components/BottomNav';

interface ShoppingListProps {
  products: Product[];
  categories: Category[];
  onUpdateProduct: (product: Product) => void;
  userRole?: 'owner' | 'editor' | 'viewer';
}

// --- Restock Modal ---
interface RestockModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (amount: number, unit: string) => void;
    productName: string;
    currentUnit: string;
}

const RestockModal: React.FC<RestockModalProps> = ({ isOpen, onClose, onConfirm, productName, currentUnit }) => {
    const [amount, setAmount] = useState('1');
    const [unit, setUnit] = useState(currentUnit);

    // Reset unit when modal opens/product changes
    React.useEffect(() => {
        if(isOpen) {
            setUnit(currentUnit);
            setAmount('1');
        }
    }, [isOpen, currentUnit]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        const val = parseFloat(amount);
        if (val > 0) {
            onConfirm(val, unit);
            onClose();
        } else {
            alert("Por favor ingresa una cantidad válida");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-[#1e1e1e] w-full max-w-sm rounded-2xl p-6 shadow-2xl">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Reponer Producto</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
                    ¿Qué cantidad de <b>{productName}</b> vas a reponer?
                </p>
                
                <div className="flex gap-2 mb-6">
                    <div className="relative flex-1">
                        <input 
                            type="number" 
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-black/20 p-4 text-2xl font-bold text-center text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-500/50 outline-none"
                            placeholder="0"
                            min="0.1"
                            step="any"
                            autoFocus
                        />
                    </div>
                    <div className="relative w-1/3">
                         <select 
                            value={unit}
                            onChange={(e) => setUnit(e.target.value)}
                            className="w-full h-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-black/20 px-3 text-center font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-500/50 outline-none"
                        >
                            <option value="unidades">Uds</option>
                            <option value="kg">kg</option>
                            <option value="g">g</option>
                            <option value="L">L</option>
                            <option value="ml">ml</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                             <span className="material-symbols-outlined text-sm">expand_more</span>
                        </div>
                    </div>
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

export const ShoppingList: React.FC<ShoppingListProps> = ({ products, categories, onUpdateProduct, userRole = 'owner' }) => {
  // Filter products that are out of stock (quantity 0)
  const shoppingItems = products.filter(p => p.quantity === 0);
  const isViewer = userRole === 'viewer';

  // Modal State
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const handleRestockClick = (product: Product) => {
      if (isViewer) {
          alert("Solo los editores pueden reponer productos.");
          return;
      }
      setSelectedProduct(product);
      setIsRestockModalOpen(true);
  };

  const handleConfirmRestock = (amount: number, unit: string) => {
      if (selectedProduct) {
          onUpdateProduct({ 
              ...selectedProduct, 
              quantity: amount,
              unit: unit,
              status: 'ok' 
          });
      }
  };

  const getCategoryName = (id: string) => {
    return categories.find(c => c.id === id)?.name || 'Sin Categoría';
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark">
      {/* Header */}
      <div className="sticky top-0 z-10 flex flex-col bg-background-light dark:bg-background-dark shadow-sm dark:shadow-md dark:shadow-black/20">
        <div className="flex items-center p-4 pb-3 justify-between">
            <div className="text-slate-700 dark:text-white flex size-12 shrink-0 items-center">
                <span className="material-symbols-outlined text-3xl">shopping_cart</span>
            </div>
            <h1 className="text-slate-800 dark:text-white text-xl font-bold leading-tight tracking-tight flex-1">Lista de Compras</h1>
            <div className="flex items-center justify-end gap-2">
                 <div className="size-12"></div>
            </div>
        </div>
      </div>

      <main className="flex-1 px-4 pt-4 pb-28 space-y-4">
        {shoppingItems.length > 0 ? (
          <div className="space-y-3">
             <div className="flex items-center justify-between px-1 pb-2">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Productos Agotados</h2>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{shoppingItems.length} artículos</span>
             </div>
            
            {shoppingItems.map(item => (
              <div key={item.id} className="group flex items-center gap-4 bg-white dark:bg-surface-dark px-4 py-3 rounded-xl shadow-sm border border-transparent dark:border-white/5 transition-all">
                {/* Checkbox / Restock Button */}
                <button 
                  onClick={() => handleRestockClick(item)}
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-slate-200 dark:border-slate-600 text-transparent transition-all ${!isViewer ? 'hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600' : 'opacity-50 cursor-not-allowed'}`}
                >
                  <span className="material-symbols-outlined">check</span>
                </button>

                <div className="flex-1">
                  <p className="text-slate-800 dark:text-white text-base font-bold leading-tight line-clamp-1 decoration-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                    {item.name}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                    {getCategoryName(item.categoryId)} • {item.unit}
                  </p>
                </div>

                <div className="shrink-0 flex flex-col items-end">
                   <button 
                    onClick={() => handleRestockClick(item)}
                    className={`text-slate-900 dark:text-white font-bold text-sm bg-slate-100 dark:bg-white/10 px-3 py-1.5 rounded-lg transition-colors ${!isViewer ? 'hover:bg-slate-200 dark:hover:bg-white/20' : 'opacity-50'}`}
                   >
                      Reponer
                   </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center px-8">
            <div className="h-24 w-24 bg-slate-100 dark:bg-surface-dark rounded-full flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600">shopping_bag</span>
            </div>
            <h3 className="text-slate-900 dark:text-white text-lg font-bold mb-2">Todo está en orden</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-[250px]">
              No tienes productos agotados. Cuando un producto llegue a 0 en tu inventario, aparecerá aquí automáticamente.
            </p>
          </div>
        )}
      </main>

      <RestockModal 
        isOpen={isRestockModalOpen}
        onClose={() => setIsRestockModalOpen(false)}
        onConfirm={handleConfirmRestock}
        productName={selectedProduct?.name || ''}
        currentUnit={selectedProduct?.unit || 'unidades'}
      />

      <BottomNav />
    </div>
  );
};
