import React, { useState } from 'react';
import { Product, Category } from '../types';
import { Layout } from '../components/Layout';

interface ShoppingListProps {
  products: Product[];
  categories: Category[];
  onUpdateProduct: (product: Product) => void;
  onAddProduct: (product: Product) => void;
  userRole?: 'owner' | 'editor' | 'viewer';
}

// --- Restock Modal ---
interface RestockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number, unit: string, totalCost: number) => void;
  productName: string;
  currentUnit: string;
}

const RestockModal: React.FC<RestockModalProps> = ({ isOpen, onClose, onConfirm, productName, currentUnit }) => {
  const [amount, setAmount] = useState('1');
  const [unit, setUnit] = useState(currentUnit);
  const [totalCost, setTotalCost] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      setUnit(currentUnit);
      setAmount('1');
      setTotalCost('');
    }
  }, [isOpen, currentUnit]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    const val = parseFloat(amount);
    const cost = parseFloat(totalCost) || 0;
    if (val > 0) {
      onConfirm(val, unit, cost);
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
          ¿Cuánto compraste de <b className="text-primary">{productName}</b>?
        </p>

        <div className="space-y-4 mb-8">
          {/* Quantity & Unit */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <label className="text-xs text-text-muted ml-1 mb-1 block">Cantidad</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-surface-highlight/50 p-3 text-xl font-bold text-center text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                placeholder="0"
                min="0.1"
                step="any"
                autoFocus
              />
            </div>
            <div className="relative w-1/3">
              <label className="text-xs text-text-muted ml-1 mb-1 block">Unidad</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full h-[52px] appearance-none rounded-xl border border-white/10 bg-surface-highlight/50 px-3 text-center font-bold text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
              >
                <option value="unidades" className="bg-surface-dark">Uds</option>
                <option value="kg" className="bg-surface-dark">kg</option>
                <option value="g" className="bg-surface-dark">g</option>
                <option value="L" className="bg-surface-dark">L</option>
                <option value="ml" className="bg-surface-dark">ml</option>
              </select>
            </div>
          </div>

          {/* Cost */}
          <div>
            <label className="text-xs text-text-muted ml-1 mb-1 block">Costo Total (Opcional)</label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-text-muted">$</span>
              <input
                type="number"
                value={totalCost}
                onChange={(e) => setTotalCost(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-surface-highlight/50 p-3 pl-8 text-lg font-medium text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                placeholder="0"
                min="0"
              />
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

// --- Manual Add Modal ---
const ManualAddModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string, categoryId: string) => void;
  categories: Category[];
}> = ({ isOpen, onClose, onAdd, categories }) => {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="glass w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-white/10">
        <h3 className="text-xl font-bold text-white mb-4">Agregar a la Lista</h3>

        <div className="space-y-4 mb-6">
          <div>
            <label className="text-xs text-text-muted ml-1 mb-1 block">Nombre del Producto</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-surface-highlight/50 p-3 text-white focus:ring-2 focus:ring-primary/50 outline-none"
              placeholder="Ej: Leche, Pan..."
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs text-text-muted ml-1 mb-1 block">Categoría</label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-surface-highlight/50 p-3 text-white focus:ring-2 focus:ring-primary/50 outline-none appearance-none"
            >
              {categories.map(c => (
                <option key={c.id} value={c.id} className="bg-surface-dark text-white">
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 h-12 rounded-xl border border-white/10 text-text-muted font-bold">Cancelar</button>
          <button
            onClick={() => {
              if (name) {
                onAdd(name, categoryId);
                setName('');
                onClose();
              }
            }}
            disabled={!name}
            className="flex-1 h-12 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/25 disabled:opacity-50"
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
};

export const ShoppingList: React.FC<ShoppingListProps> = ({ products, categories, onUpdateProduct, onAddProduct, userRole = 'owner' }) => {
  const shoppingItems = products.filter(p => p.quantity === 0);
  const lowStockItems = products.filter(p => p.quantity > 0 && p.quantity <= 3);

  const isViewer = userRole === 'viewer';

  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [isManualAddOpen, setIsManualAddOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [sessionTotal, setSessionTotal] = useState(0);

  const handleRestockClick = (product: Product) => {
    if (isViewer) return;
    setSelectedProduct(product);
    setIsRestockModalOpen(true);
  };

  const handleConfirmRestock = (amount: number, unit: string, totalCost: number) => {
    if (selectedProduct) {
      // Calculate unit cost if total cost is provided
      const unitCost = totalCost > 0 ? totalCost / amount : selectedProduct.cost;

      onUpdateProduct({
        ...selectedProduct,
        quantity: selectedProduct.quantity + amount, // Add to existing quantity
        unit: unit,
        cost: unitCost, // Update unit cost for future reference
        status: 'ok'
      });

      if (totalCost > 0) {
        setSessionTotal(prev => prev + totalCost);
      }
    }
  };

  const handleManualAdd = (name: string, categoryId: string) => {
    const newProduct: Product = {
      id: Date.now().toString(),
      name,
      categoryId,
      quantity: 0, // Start at 0 so it appears in the shopping list
      unit: 'unidades',
      expiryDate: '',
      addedDate: new Date().toISOString(),
      status: 'ok'
    };
    onAddProduct(newProduct);
  };

  const getCategoryName = (id: string) => {
    return categories.find(c => c.id === id)?.name || 'Sin Categoría';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
  };

  return (
    <Layout>
      {/* Header */}
      <div className="sticky top-0 z-40 pb-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Lista de Compras</h1>
          <div className="flex items-center gap-3">
            {sessionTotal > 0 && (
              <div className="px-3 py-1.5 rounded-lg bg-surface-highlight border border-white/10 flex flex-col items-end">
                <span className="text-[10px] text-text-muted uppercase tracking-wider font-bold">Total Sesión</span>
                <span className="text-sm font-bold text-primary">{formatCurrency(sessionTotal)}</span>
              </div>
            )}
            <button
              onClick={() => setIsManualAddOpen(true)}
              className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/25 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined">add</span>
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-8 pb-24">
        {/* Out of Stock Section */}
        {shoppingItems.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-bold text-danger uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">remove_shopping_cart</span>
                Agotados
              </h2>
              <span className="text-xs font-bold text-danger bg-danger/10 px-2 py-1 rounded-lg">{shoppingItems.length}</span>
            </div>

            {shoppingItems.map(item => (
              <div key={item.id} className="glass rounded-2xl p-4 flex items-center gap-4 group transition-all hover:bg-white/5 border-l-4 border-l-danger">
                <button
                  onClick={() => handleRestockClick(item)}
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-white/10 text-transparent transition-all ${!isViewer ? 'hover:border-primary hover:bg-primary/10 hover:text-primary' : 'opacity-50 cursor-not-allowed'}`}
                >
                  <span className="material-symbols-outlined">check</span>
                </button>

                <div className="flex-1 min-w-0">
                  <p className="text-white text-lg font-bold truncate">{item.name}</p>
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
        )}

        {/* Low Stock Section */}
        {lowStockItems.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-bold text-warning uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">low_priority</span>
                Por Agotarse
              </h2>
              <span className="text-xs font-bold text-warning bg-warning/10 px-2 py-1 rounded-lg">{lowStockItems.length}</span>
            </div>

            {lowStockItems.map(item => (
              <div key={item.id} className="glass rounded-2xl p-4 flex items-center gap-4 group transition-all hover:bg-white/5 border-l-4 border-l-warning">
                <button
                  onClick={() => handleRestockClick(item)}
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-white/10 text-transparent transition-all ${!isViewer ? 'hover:border-primary hover:bg-primary/10 hover:text-primary' : 'opacity-50 cursor-not-allowed'}`}
                >
                  <span className="material-symbols-outlined">add</span>
                </button>

                <div className="flex-1 min-w-0">
                  <p className="text-white text-lg font-bold truncate">{item.name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-sm text-text-muted truncate flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">category</span>
                      {getCategoryName(item.categoryId)}
                    </p>
                    <span className="text-xs font-bold text-warning bg-warning/10 px-2 py-0.5 rounded">
                      Queda: {item.quantity} {item.unit}
                    </span>
                  </div>
                </div>

                <div className="shrink-0">
                  <button
                    onClick={() => handleRestockClick(item)}
                    className={`text-white font-bold text-sm bg-surface-highlight border border-white/5 px-4 py-2 rounded-xl transition-all ${!isViewer ? 'hover:bg-white/10 active:scale-95' : 'opacity-50'}`}
                  >
                    Sumar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {shoppingItems.length === 0 && lowStockItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center px-8">
            <div className="h-24 w-24 bg-surface-highlight rounded-full flex items-center justify-center mb-6 border border-white/5">
              <span className="material-symbols-outlined text-5xl text-white/20">shopping_bag</span>
            </div>
            <h3 className="text-white text-xl font-bold mb-2">Todo está en orden</h3>
            <p className="text-text-muted max-w-[250px]">
              No tienes productos agotados ni por agotarse.
            </p>
            <button
              onClick={() => setIsManualAddOpen(true)}
              className="mt-6 text-primary font-bold text-sm hover:underline"
            >
              Agregar producto manualmente
            </button>
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

      <ManualAddModal
        isOpen={isManualAddOpen}
        onClose={() => setIsManualAddOpen(false)}
        onAdd={handleManualAdd}
        categories={categories}
      />
    </Layout>
  );
};
