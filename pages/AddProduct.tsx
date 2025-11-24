
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product, Category } from '../types';

interface AddProductProps {
    categories: Category[];
    onAdd: (product: Product) => void;
}

export const AddProduct: React.FC<AddProductProps> = ({ categories, onAdd }) => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('unidades');
  // Default to first category if available
  const [categoryId, setCategoryId] = useState<string>(categories[0]?.id || '');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');

  // Update categoryId if categories load later or empty initially
  React.useEffect(() => {
      if (!categoryId && categories.length > 0) {
          setCategoryId(categories[0].id);
      }
  }, [categories, categoryId]);

  const handleSubmit = () => {
    if (!name) {
        alert("Por favor escribe el nombre del producto.");
        return;
    }
    if (!categoryId) {
        alert("Por favor crea o selecciona una categoría.");
        return;
    }
    
    const newProduct: Product = {
        id: Date.now().toString(),
        name,
        quantity,
        unit,
        categoryId,
        expiryDate,
        notes,
        status: 'ok' // Default logic
    };
    
    onAdd(newProduct);
    navigate('/inventory');
  };

  const handleScanBarcode = () => {
      alert("Abriendo escáner de código de barras...");
      // Simulate scan result
      setTimeout(() => {
          setName("Producto Escaneado " + Math.floor(Math.random() * 100));
      }, 1000);
  };

  return (
    <div className="relative flex h-full min-h-screen w-full flex-col bg-background-light dark:bg-background-dark">
      {/* Header */}
      <div className="flex items-center bg-background-light dark:bg-background-dark p-4 pb-2 justify-between">
        <button onClick={() => navigate('/inventory')} className="text-slate-800 dark:text-white flex size-12 shrink-0 items-center justify-center hover:bg-slate-200 dark:hover:bg-white/10 rounded-full transition-colors">
          <span className="material-symbols-outlined">close</span>
        </button>
        <h2 className="text-slate-800 dark:text-white text-lg font-bold leading-tight flex-1 text-center">Añadir Producto</h2>
        <div className="size-12 shrink-0"></div>
      </div>

      <main className="flex-1 px-4 py-6">
        <div className="flex flex-col gap-6 rounded-2xl bg-white dark:bg-surface-dark p-6 shadow-sm">
          
          {/* Name */}
          <label className="flex flex-col w-full gap-2">
            <span className="text-slate-800 dark:text-white text-base font-medium">Nombre del Producto</span>
            <div className="flex w-full flex-1 items-stretch rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#191919] focus-within:ring-2 focus-within:ring-slate-500/50">
              <input 
                className="flex w-full min-w-0 flex-1 bg-transparent text-slate-800 dark:text-white focus:outline-none h-14 placeholder:text-slate-400 p-4 text-base"
                placeholder="Ej: Leche de Almendras" 
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <button onClick={handleScanBarcode} className="text-slate-500 flex items-center justify-center pr-4 hover:text-slate-800 dark:hover:text-white transition-colors">
                <span className="material-symbols-outlined">barcode_scanner</span>
              </button>
            </div>
          </label>

          <div className="flex flex-wrap items-start gap-4">
            {/* Quantity */}
            <div className="flex flex-col flex-1 min-w-[120px] gap-2">
              <span className="text-slate-800 dark:text-white text-base font-medium">Cantidad</span>
              <div className="flex items-center justify-between rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#191919] h-14 px-4 focus-within:ring-2 focus-within:ring-slate-500/50">
                <input 
                  className="w-full bg-transparent text-slate-800 dark:text-white focus:outline-none text-base"
                  placeholder="Ej: 1" 
                  type="number"
                  min="0" 
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                />
              </div>
            </div>
            
            {/* Expiry */}
            <label className="flex flex-col flex-1 min-w-[150px] gap-2">
              <span className="text-slate-800 dark:text-white text-base font-medium">Vencimiento</span>
              <div className="flex w-full flex-1 items-stretch rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#191919] h-14 focus-within:ring-2 focus-within:ring-slate-500/50">
                <input 
                  type="date"
                  className="flex w-full min-w-0 flex-1 bg-transparent text-slate-800 dark:text-white focus:outline-none p-4 text-base dark:[color-scheme:dark]" 
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </div>
            </label>
          </div>

          <div className="flex flex-wrap items-start gap-4">
            {/* Category */}
            <label className="flex flex-col flex-1 min-w-[120px] gap-2">
              <span className="text-slate-800 dark:text-white text-base font-medium">Categoría</span>
              <div className="relative">
                <select 
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="flex w-full appearance-none rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#191919] text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-500/50 h-14 px-4 text-base"
                >
                    {categories.length === 0 && <option value="" disabled>Sin categorías</option>}
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                     <span className="material-symbols-outlined">expand_more</span>
                </div>
              </div>
            </label>

            {/* Unit */}
            <label className="flex flex-col flex-1 min-w-[120px] gap-2">
              <span className="text-slate-800 dark:text-white text-base font-medium">Unidad</span>
              <div className="relative">
                <select 
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="flex w-full appearance-none rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#191919] text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-500/50 h-14 px-4 text-base"
                >
                    <option value="unidades">Unidades</option>
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="L">L</option>
                    <option value="ml">ml</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                     <span className="material-symbols-outlined">expand_more</span>
                </div>
              </div>
            </label>
          </div>

          {/* Notes */}
          <label className="flex flex-col w-full gap-2">
            <span className="text-slate-800 dark:text-white text-base font-medium">Notas (Opcional)</span>
            <textarea 
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#191919] text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-500/50 h-28 placeholder:text-slate-400 p-4 text-base resize-none" 
                placeholder="Ej: Usar antes del fin de semana"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
            />
          </label>
        </div>
      </main>

      {/* FAB Check */}
      <div className="fixed bottom-6 right-6">
        <button 
            onClick={handleSubmit}
            className="flex items-center justify-center rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 h-16 w-16 shadow-lg hover:opacity-90 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-3xl">check</span>
        </button>
      </div>
    </div>
  );
};
