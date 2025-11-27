import React, { useState } from 'react';
import { Product, Category } from '../types';
import { Layout } from '../components/Layout';

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

  React.useEffect(() => {
    if (isOpen) {
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="glass w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-white/10">
        <h3 className="text-xl font-bold text-white mb-2">Reponer Producto</h3>
        <p className="text-text-muted text-sm mb-6">
          ¿Qué cantidad de <b className="text-primary">{productName}</b> vas a reponer?
        </p>

        <div className="flex gap-2 mb-8">
          <div className="relative flex-1">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-surface-highlight/50 p-4 text-2xl font-bold text-center text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
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
              className="w-full h-full appearance-none rounded-xl border border-white/10 bg-surface-highlight/50 px-3 text-center font-bold text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
            >
              <option value="unidades" className="bg-surface-dark">Uds</option>
              <option value="kg" className="bg-surface-dark">kg</option>
              <option value="g" className="bg-surface-dark">g</option>
              <option value="L" className="bg-surface-dark">L</option>
              <option value="ml" className="bg-surface-dark">ml</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-muted">
              <span className="material-symbols-outlined text-sm">expand_more</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-12 rounded-xl border border-white/10 font-bold text-text-muted hover:bg-white/5 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!amount}
            className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold disabled:opacity-50 shadow-lg shadow-primary/25 transition-all active:scale-95"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

export const ShoppingList: React.FC<ShoppingListProps> = ({ products, categories, onUpdateProduct, userRole = 'owner' }) => {
  const shoppingItems = products.filter(p => p.quantity === 0);
  const isViewer = userRole === 'viewer';

  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const handleRestockClick = (product: Product) => {
    if (isViewer) return;
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
    <Layout>
      {/* Header */}
      <div className="sticky top-0 z-40 pb-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Lista de Compras</h1>
          <div className="w-10 h-10 rounded-full bg-surface-highlight flex items-center justify-center border border-white/5">
            <span className="material-symbols-outlined text-primary">shopping_cart</span>
          </div>
        </div>

        {shoppingItems.length > 0 ? (
          <div className="space-y-4 pb-20">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider">Productos Agotados</h2>
              <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg">{shoppingItems.length} items</span>
            </div>

            {shoppingItems.map(item => (
              <div key={item.id} className="glass rounded-2xl p-4 flex items-center gap-4 group transition-all hover:bg-white/5">
                {/* Checkbox / Restock Button */}
                <button
                  onClick={() => handleRestockClick(item)}
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-white/10 text-transparent transition-all ${!isViewer ? 'hover:border-primary hover:bg-primary/10 hover:text-primary' : 'opacity-50 cursor-not-allowed'}`}
                >
                  <span className="material-symbols-outlined">check</span>
                </button>

                <div className="flex-1 min-w-0">
                  <p className="text-white text-lg font-bold truncate">
                    {item.name}
                  </p>
                  <p className="text-sm text-text-muted truncate flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">category</span>
                    {getCategoryName(item.categoryId)}
                  </p>
                </div>

                <div className="shrink-0">
                  <button
                    onClick={() => handleRestockClick(item)}
                    className={`text-white font-bold text-sm bg-surface-highlight border border-white/5 px-4 py-2 rounded-xl transition-all ${!isViewer ? 'hover:bg-white/10 active:scale-95' : 'opacity-50'}`}
                  >
                    Reponer
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center px-8">
            <div className="h-24 w-24 bg-surface-highlight rounded-full flex items-center justify-center mb-6 border border-white/5">
              <span className="material-symbols-outlined text-5xl text-white/20">shopping_bag</span>
            </div>
            <h3 className="text-white text-xl font-bold mb-2">Todo está en orden</h3>
            <p className="text-text-muted max-w-[250px]">
              No tienes productos agotados.
            </p>
          </div>
        )}
      </div>

      <RestockModal
        isOpen={isRestockModalOpen}
        onClose={() => setIsRestockModalOpen(false)}
        onConfirm={handleConfirmRestock}
        productName={selectedProduct?.name || ''}
        currentUnit={selectedProduct?.unit || 'unidades'}
      />
    </Layout>
  );
};
