
import React from 'react';
import { Product, Category } from '../types';
import { BottomNav } from '../components/BottomNav';

interface ShoppingListProps {
  products: Product[];
  categories: Category[];
  onUpdateProduct: (product: Product) => void;
}

export const ShoppingList: React.FC<ShoppingListProps> = ({ products, categories, onUpdateProduct }) => {
  // Filter products that are out of stock (quantity 0)
  const shoppingItems = products.filter(p => p.quantity === 0);

  const handleRestock = (product: Product) => {
    // Restock 1 unit by default to move it back to inventory
    onUpdateProduct({ ...product, quantity: 1, status: 'ok' });
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
                  onClick={() => handleRestock(item)}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-slate-200 dark:border-slate-600 text-transparent hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 transition-all"
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
                    onClick={() => handleRestock(item)}
                    className="text-slate-900 dark:text-white font-bold text-sm bg-slate-100 dark:bg-white/10 px-3 py-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-white/20 transition-colors"
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

      <BottomNav />
    </div>
  );
};
