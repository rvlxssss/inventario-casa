import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Product, Category } from '../types';

interface AddProductProps {
    categories: Category[];
    onAdd: (product: Product) => void;
}

declare global {
    interface Window {
        Html5Qrcode: any;
    }
}

// --- Scanner Modal Component ---
const BarcodeScannerModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onDetected: (code: string) => void;
}> = ({ isOpen, onClose, onDetected }) => {
    const scannerRef = useRef<any>(null);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        if (isOpen) {
            // Give the DOM a moment to render the 'reader' div
            const timeout = setTimeout(() => {
                startScanner();
            }, 300);
            return () => {
                clearTimeout(timeout);
                stopScanner();
            };
        } else {
            stopScanner();
        }
    }, [isOpen]);

    const startScanner = async () => {
        if (!window.Html5Qrcode) {
            setError("Librería de escáner no cargada.");
            return;
        }

        try {
            const html5QrCode = new window.Html5Qrcode("reader");
            scannerRef.current = html5QrCode;

            await html5QrCode.start(
                { facingMode: "environment" }, // Prefer back camera
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0
                },
                (decodedText: string) => {
                    // Success callback
                    // Play a beep sound
                    const audio = new Audio('https://www.soundjay.com/buttons/beep-01a.mp3');
                    audio.play().catch(() => {});
                    
                    stopScanner().then(() => {
                        onDetected(decodedText);
                    });
                },
                (errorMessage: string) => {
                    // Scanning... ignore individual frame errors
                }
            );
        } catch (err: any) {
            console.error("Error starting scanner", err);
            setError("No se pudo acceder a la cámara. Verifica permisos.");
        }
    };

    const stopScanner = async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
                scannerRef.current.clear();
            } catch (ignore) {
                // Ignore stop errors (usually if already stopped)
            }
            scannerRef.current = null;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center animate-fade-in">
            <div className="absolute top-6 right-6 z-20">
                <button onClick={onClose} className="bg-white/20 p-2 rounded-full text-white backdrop-blur-sm">
                    <span className="material-symbols-outlined text-2xl">close</span>
                </button>
            </div>
            
            <h3 className="text-white font-bold text-lg mb-4 z-10">Escaneando código...</h3>
            
            <div id="reader" className="w-full max-w-sm h-[350px] bg-black overflow-hidden rounded-2xl relative"></div>
            
            {error && (
                <div className="bg-red-500/80 text-white p-3 rounded-lg mt-4 max-w-xs text-center text-sm">
                    {error}
                </div>
            )}

            <p className="text-white/60 text-sm mt-8 max-w-[80%] text-center">
                Apunta la cámara al código de barras del producto.
            </p>
        </div>
    );
};

export const AddProduct: React.FC<AddProductProps> = ({ categories, onAdd }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('unidades');
  
  // Initialize Category ID
  const [categoryId, setCategoryId] = useState<string>('');
  
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');

  // Scanner State
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);

  // Check for pre-selected category from navigation state
  useEffect(() => {
      if (location.state && (location.state as any).categoryId) {
          setCategoryId((location.state as any).categoryId);
      } else if (categories.length > 0 && !categoryId) {
          setCategoryId(categories[0].id);
      }
  }, [categories, location.state]);

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

  const handleScanResult = async (code: string) => {
      setIsScannerOpen(false);
      setIsLoadingProduct(true);
      
      try {
          // OpenFoodFacts API
          const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`);
          const data = await response.json();
          
          if (data.status === 1 && data.product) {
              const productName = data.product.product_name_es || data.product.product_name;
              if (productName) {
                  setName(productName);
              } else {
                  alert("Producto encontrado pero sin nombre registrado.");
                  setName(`Producto ${code}`);
              }
              
              // Try to guess quantity/unit if available (optional enhancement)
              // if (data.product.quantity) { ... }
              
          } else {
              alert("Producto no encontrado en la base de datos.");
              setName(`Producto ${code}`);
          }
      } catch (error) {
          console.error("API Error", error);
          alert("Error al buscar información del producto.");
      } finally {
          setIsLoadingProduct(false);
      }
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
            <div className="flex justify-between items-center">
                 <span className="text-slate-800 dark:text-white text-base font-medium">Nombre del Producto</span>
                 {isLoadingProduct && <span className="text-xs text-blue-500 font-bold animate-pulse">Buscando info...</span>}
            </div>
            <div className="flex w-full flex-1 items-stretch rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#191919] focus-within:ring-2 focus-within:ring-slate-500/50">
              <input 
                className="flex w-full min-w-0 flex-1 bg-transparent text-slate-800 dark:text-white focus:outline-none h-14 placeholder:text-slate-400 p-4 text-base"
                placeholder="Ej: Leche de Almendras" 
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <button 
                onClick={() => setIsScannerOpen(true)}
                className="text-slate-500 flex items-center justify-center px-4 hover:text-slate-800 dark:hover:text-white transition-colors border-l border-slate-200 dark:border-white/5"
              >
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
      <div className="fixed bottom-6 right-6 z-10">
        <button 
            onClick={handleSubmit}
            className="flex items-center justify-center rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 h-16 w-16 shadow-lg hover:opacity-90 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-3xl">check</span>
        </button>
      </div>

      <BarcodeScannerModal 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)}
        onDetected={handleScanResult}
      />
    </div>
  );
};