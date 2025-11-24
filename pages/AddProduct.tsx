import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Product, Category } from '../types';
import { BottomNav } from '../components/BottomNav';

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
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 }
                },
                (decodedText: string) => {
                    // Success callback
                    stopScanner();
                    onDetected(decodedText);
                },
                (_errorMessage: string) => { 
                    // parse error, ignore it.
                }
            );
        } catch (err) {
            console.error("Error starting scanner", err);
            setError("No se pudo iniciar la cámara. Verifica permisos.");
        }
    };

    const stopScanner = () => {
        if (scannerRef.current) {
            scannerRef.current.stop().then(() => {
                scannerRef.current.clear();
                scannerRef.current = null;
            }).catch((err: any) => {
                console.error("Failed to stop scanner", err);
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4">
             <div className="w-full max-w-sm bg-white dark:bg-surface-dark rounded-2xl overflow-hidden relative">
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 bg-black/50 text-white rounded-full p-2"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>

                <div className="p-4 text-center">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Escanear Código</h3>
                    {error ? (
                         <div className="text-red-500 text-sm mb-4">{error}</div>
                    ) : (
                        <div id="reader" className="w-full h-64 bg-black rounded-lg overflow-hidden"></div>
                    )}
                    <p className="text-xs text-slate-500 mt-4">Apunta la cámara al código de barras del producto.</p>
                </div>
             </div>
        </div>
    );
};

export const AddProduct: React.FC<AddProductProps> = ({ categories, onAdd }) => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Default to first category or passed categoryId
    const initialCategoryId = (location.state as any)?.categoryId || (categories.length > 0 ? categories[0].id : '');

    const [name, setName] = useState('');
    const [quantity, setQuantity] = useState('1');
    const [unit, setUnit] = useState('unidades');
    const [expiryDate, setExpiryDate] = useState('');
    const [categoryId, setCategoryId] = useState(initialCategoryId);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [isLoadingProduct, setIsLoadingProduct] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !categoryId) return;

        const newProduct: Product = {
            id: Date.now().toString(),
            name,
            quantity: parseFloat(quantity),
            unit,
            expiryDate,
            categoryId,
            status: calculateStatus(expiryDate)
        };

        onAdd(newProduct);
        navigate(-1);
    };

    const calculateStatus = (dateString: string): Product['status'] => {
        if (!dateString) return 'ok';
        const today = new Date();
        today.setHours(0,0,0,0);
        const expiry = new Date(dateString);
        
        const diffTime = expiry.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

        if (diffDays < 0) return 'expired';
        if (diffDays <= 3) return 'warning';
        return 'ok';
    };

    const handleBarcodeDetected = async (code: string) => {
        setIsScannerOpen(false);
        setIsLoadingProduct(true);
        try {
            // Fetch from OpenFoodFacts
            const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`);
            const data = await response.json();
            
            if (data.status === 1) {
                const productName = data.product.product_name_es || data.product.product_name || '';
                if (productName) setName(productName);
                
                // Try to guess category (very basic)
                // const categoriesTags = data.product.categories_tags; // e.g. ["en:beverages"]
            } else {
                alert("Producto no encontrado en la base de datos pública.");
            }
        } catch (error) {
            console.error("Error fetching product", error);
            alert("Error al buscar información del producto.");
        } finally {
            setIsLoadingProduct(false);
        }
    };

    return (
        <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark">
            {/* Header */}
            <div className="flex items-center p-4 justify-between sticky top-0 z-10 bg-background-light dark:bg-background-dark">
                <button onClick={() => navigate(-1)} className="text-slate-800 dark:text-white flex size-12 shrink-0 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10">
                    <span className="material-symbols-outlined text-2xl">arrow_back</span>
                </button>
                <h1 className="text-slate-800 dark:text-white text-lg font-bold leading-tight">Nuevo Producto</h1>
                <div className="size-12"></div>
            </div>

            <main className="flex-1 px-4 pb-24">
                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* Name Input with Scanner */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Nombre del Producto</label>
                        <div className="flex gap-2">
                            <input 
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark p-4 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-slate-500/50"
                                placeholder="Ej: Leche Deslactosada"
                                required
                            />
                            <button 
                                type="button"
                                onClick={() => setIsScannerOpen(true)}
                                className="w-14 rounded-xl bg-slate-200 dark:bg-white/10 flex items-center justify-center text-slate-700 dark:text-white hover:bg-slate-300 dark:hover:bg-white/20 transition-colors"
                            >
                                {isLoadingProduct ? (
                                    <span className="material-symbols-outlined animate-spin">sync</span>
                                ) : (
                                    <span className="material-symbols-outlined">qr_code_scanner</span>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Quantity & Unit Row */}
                    <div className="flex gap-4">
                        <div className="flex-1 space-y-1">
                            <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Cantidad</label>
                            <input 
                                type="number"
                                value={quantity}
                                onChange={e => setQuantity(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark p-4 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-slate-500/50"
                                placeholder="1"
                                min="0"
                                step="any"
                                required
                            />
                        </div>
                        <div className="w-1/3 space-y-1">
                            <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Unidad</label>
                            <div className="relative">
                                <select 
                                    value={unit}
                                    onChange={e => setUnit(e.target.value)}
                                    className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark p-4 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-slate-500/50"
                                >
                                    <option value="unidades">Uds</option>
                                    <option value="kg">kg</option>
                                    <option value="g">g</option>
                                    <option value="L">L</option>
                                    <option value="ml">ml</option>
                                </select>
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 pointer-events-none">expand_more</span>
                            </div>
                        </div>
                    </div>

                    {/* Expiry Date */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Fecha de Vencimiento (Opcional)</label>
                        <input 
                            type="date"
                            value={expiryDate}
                            onChange={e => setExpiryDate(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark p-4 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-slate-500/50 min-h-[58px]"
                        />
                    </div>

                    {/* Category */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Categoría</label>
                        <div className="relative">
                            <select 
                                value={categoryId}
                                onChange={e => setCategoryId(e.target.value)}
                                className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark p-4 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-slate-500/50"
                            >
                                <option value="" disabled>Selecciona una categoría</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 pointer-events-none">expand_more</span>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button 
                        type="submit"
                        className="w-full h-14 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-lg hover:opacity-90 active:scale-[0.98] transition-all mt-8 shadow-lg shadow-slate-900/10 dark:shadow-none"
                    >
                        Guardar Producto
                    </button>
                </form>
            </main>

            <BarcodeScannerModal 
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onDetected={handleBarcodeDetected}
            />
            
            <BottomNav />
        </div>
    );
};