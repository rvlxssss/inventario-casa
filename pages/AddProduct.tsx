import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Product, Category } from '../types';
import { BottomNav } from '../components/BottomNav';

interface AddProductProps {
    categories: Category[];
    onAdd: (product: Product) => void;
    onUpdate: (product: Product) => void;
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

export const AddProduct: React.FC<AddProductProps> = ({ categories, onAdd, onUpdate }) => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Check if we are editing an existing product
    const editingProduct = (location.state as any)?.product as Product | undefined;
    const initialCategoryId = (location.state as any)?.categoryId || (categories.length > 0 ? categories[0].id : '');

    const [name, setName] = useState('');
    const [quantity, setQuantity] = useState('1');
    const [unit, setUnit] = useState('unidades');
    const [expiryDate, setExpiryDate] = useState('');
    const [categoryId, setCategoryId] = useState(initialCategoryId);
    
    // Price Calculator State
    const [useUnitPrice, setUseUnitPrice] = useState(false);
    const [pricePerPackage, setPricePerPackage] = useState(''); 
    const [packageSize, setPackageSize] = useState('1'); 
    const [totalCost, setTotalCost] = useState('');

    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [isLoadingProduct, setIsLoadingProduct] = useState(false);

    // Autocomplete State
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchTimeout = useRef<any>(null);

    // Load data if editing
    useEffect(() => {
        if (editingProduct) {
            setName(editingProduct.name);
            setQuantity(editingProduct.quantity.toString());
            setUnit(editingProduct.unit);
            setExpiryDate(editingProduct.expiryDate || '');
            setCategoryId(editingProduct.categoryId);
            if (editingProduct.cost) {
                setTotalCost(editingProduct.cost.toString());
            }
        }
    }, [editingProduct]);

    // --- Price Calculation Logic ---
    useEffect(() => {
        if (useUnitPrice) {
            const qty = parseFloat(quantity) || 0;
            const size = parseFloat(packageSize) || 1;
            const price = parseFloat(pricePerPackage) || 0;
            
            if (size > 0) {
                const numberOfPacks = qty / size;
                const calculated = numberOfPacks * price;
                setTotalCost(calculated > 0 ? calculated.toFixed(2) : '');
            }
        }
    }, [quantity, packageSize, pricePerPackage, useUnitPrice]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !categoryId) return;

        const productData: Product = {
            id: editingProduct ? editingProduct.id : Date.now().toString(),
            name,
            quantity: parseFloat(quantity),
            unit,
            expiryDate,
            categoryId,
            status: calculateStatus(expiryDate),
            cost: parseFloat(totalCost) || 0,
            addedDate: editingProduct ? editingProduct.addedDate : new Date().toISOString()
        };

        if (editingProduct) {
            onUpdate(productData);
        } else {
            onAdd(productData);
        }
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
                
                // Try to extract quantity/unit hint
                if (data.product.quantity) {
                     const qStr = data.product.quantity.toLowerCase();
                     if(qStr.includes('l') && !qStr.includes('ml')) setUnit('L');
                     if(qStr.includes('ml')) setUnit('ml');
                     if(qStr.includes('kg')) setUnit('kg');
                     if(qStr.includes('g') && !qStr.includes('kg')) setUnit('g');
                }
                
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

    // Autocomplete Logic
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setName(val);

        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }

        if (val.length < 3) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        searchTimeout.current = setTimeout(async () => {
            try {
                // Fetch Suggestions from OpenFoodFacts Search API
                const response = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(val)}&search_simple=1&action=process&json=1&page_size=5`);
                const data = await response.json();
                
                if (data.products && data.products.length > 0) {
                    setSuggestions(data.products);
                    setShowSuggestions(true);
                } else {
                    setSuggestions([]);
                    setShowSuggestions(false);
                }
            } catch (err) {
                console.error("Error fetching suggestions", err);
            }
        }, 500); // 500ms Debounce
    };

    const handleSelectSuggestion = (product: any) => {
        const bestName = product.product_name_es || product.product_name || name;
        setName(bestName);
        setShowSuggestions(false);
        setSuggestions([]);
    };

    return (
        <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark">
            {/* Header */}
            <div className="flex items-center p-4 justify-between sticky top-0 z-10 bg-background-light dark:bg-background-dark">
                <button onClick={() => navigate(-1)} className="text-slate-800 dark:text-white flex size-12 shrink-0 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10">
                    <span className="material-symbols-outlined text-2xl">arrow_back</span>
                </button>
                <h1 className="text-slate-800 dark:text-white text-lg font-bold leading-tight">
                    {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                </h1>
                <div className="size-12"></div>
            </div>

            <main className="flex-1 px-4 pb-24">
                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* Name Input with Scanner & Autocomplete */}
                    <div className="space-y-1 relative z-20">
                        <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Nombre del Producto</label>
                        <div className="flex gap-2">
                            <input 
                                value={name}
                                onChange={handleNameChange}
                                onFocus={() => name.length >= 3 && suggestions.length > 0 && setShowSuggestions(true)}
                                // Delayed blur to allow click on suggestion
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark p-4 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-slate-500/50"
                                placeholder="Ej: Leche Deslactosada"
                                required
                                autoComplete="off"
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
                        
                        {/* Autocomplete Dropdown */}
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden z-30 animate-fade-in max-h-60 overflow-y-auto">
                                <ul>
                                    {suggestions.map((item, idx) => (
                                        <li 
                                            key={item.code || idx}
                                            onClick={() => handleSelectSuggestion(item)}
                                            className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer flex items-center gap-3 border-b border-slate-100 dark:border-white/5 last:border-0 transition-colors"
                                        >
                                            {item.image_small_url ? (
                                                <img src={item.image_small_url} alt="" className="h-8 w-8 object-cover rounded bg-white" />
                                            ) : (
                                                <div className="h-8 w-8 bg-slate-100 dark:bg-white/10 rounded flex items-center justify-center">
                                                     <span className="material-symbols-outlined text-sm text-slate-400">restaurant</span>
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
                                                    {item.product_name_es || item.product_name}
                                                </p>
                                                <p className="text-xs text-slate-400 truncate">
                                                    {item.brands || 'Sin marca'}
                                                </p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Quantity & Unit */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                             <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Cantidad Total</label>
                             <input 
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark p-4 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-slate-500/50"
                                placeholder="1"
                                min="0.1"
                                step="any"
                                required
                            />
                        </div>
                        <div className="space-y-1">
                             <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Unidad</label>
                             <div className="relative">
                                <select 
                                    value={unit}
                                    onChange={(e) => setUnit(e.target.value)}
                                    className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark p-4 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-slate-500/50"
                                >
                                    <option value="unidades">Unidades</option>
                                    <option value="kg">Kilogramos (kg)</option>
                                    <option value="g">Gramos (g)</option>
                                    <option value="L">Litros (L)</option>
                                    <option value="ml">Mililitros (ml)</option>
                                    <option value="oz">Onzas (oz)</option>
                                    <option value="lb">Libras (lb)</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                                     <span className="material-symbols-outlined">expand_more</span>
                                </div>
                             </div>
                        </div>
                    </div>
                    
                    {/* --- Price Calculator Section --- */}
                    <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-4 space-y-3 border border-slate-100 dark:border-white/5">
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center ${useUnitPrice ? 'bg-slate-900 border-slate-900 dark:bg-white dark:border-white' : 'border-slate-400'}`}>
                                    {useUnitPrice && <span className="material-symbols-outlined text-xs text-white dark:text-slate-900">check</span>}
                                </div>
                                <input type="checkbox" className="hidden" checked={useUnitPrice} onChange={() => setUseUnitPrice(!useUnitPrice)} />
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Calcular por unidad/paquete</span>
                            </label>
                        </div>
                        
                        {useUnitPrice ? (
                            <div className="grid grid-cols-2 gap-4 animate-fade-in">
                                <div>
                                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Precio del Paquete</label>
                                    <div className="relative mt-1">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                                        <input 
                                            type="number"
                                            value={pricePerPackage}
                                            onChange={(e) => setPricePerPackage(e.target.value)}
                                            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark p-2 pl-6 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-slate-500/50"
                                            placeholder="10.00"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Tamaño del Paquete</label>
                                    <div className="relative mt-1">
                                        <input 
                                            type="number"
                                            value={packageSize}
                                            onChange={(e) => setPackageSize(e.target.value)}
                                            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark p-2 pr-8 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-slate-500/50"
                                            placeholder="1"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">{unit}</span>
                                    </div>
                                </div>
                                <div className="col-span-2 text-xs text-slate-500">
                                    <p>Estás añadiendo <b>{parseFloat(quantity) / (parseFloat(packageSize)||1)}</b> paquetes.</p>
                                </div>
                            </div>
                        ) : null}

                        <div>
                            <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Costo Total</label>
                            <div className="relative mt-1">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                                <input 
                                    type="number"
                                    value={totalCost}
                                    onChange={(e) => setTotalCost(e.target.value)}
                                    className={`w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark p-4 pl-8 text-xl font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-slate-500/50 ${useUnitPrice ? 'opacity-80' : ''}`}
                                    placeholder="0.00"
                                    readOnly={useUnitPrice}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Expiry Date */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Fecha de Vencimiento (Opcional)</label>
                        <input 
                            type="date"
                            value={expiryDate}
                            onChange={(e) => setExpiryDate(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark p-4 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-slate-500/50 min-h-[58px]"
                        />
                    </div>

                    {/* Category Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Categoría</label>
                        <div className="grid grid-cols-2 gap-2">
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setCategoryId(cat.id)}
                                    className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${categoryId === cat.id ? 'bg-slate-900 dark:bg-white border-slate-900 dark:border-white text-white dark:text-slate-900' : 'bg-white dark:bg-surface-dark border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-500'}`}
                                >
                                    <span className="material-symbols-outlined text-lg">{cat.icon}</span>
                                    <span className="text-sm font-bold truncate">{cat.name}</span>
                                </button>
                            ))}
                        </div>
                        {categories.length === 0 && (
                            <p className="text-xs text-red-500">Crea una categoría antes de añadir productos.</p>
                        )}
                    </div>

                    <div className="pt-4">
                        <button 
                            type="submit"
                            disabled={!name || !categoryId}
                            className="w-full h-14 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-lg font-bold shadow-lg hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {editingProduct ? 'Actualizar Producto' : 'Guardar Producto'}
                        </button>
                    </div>
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