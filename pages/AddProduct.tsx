import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Product, Category } from '../types';
import { Layout } from '../components/Layout';

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
    const [isStopping, setIsStopping] = useState(false);

    // Initial mount logic
    useEffect(() => {
        let timeout: any;
        if (isOpen && !isStopping) {
            // Give the DOM a moment to render the 'reader' div
            timeout = setTimeout(() => {
                startScanner();
            }, 300);
        }
        return () => {
            if (timeout) clearTimeout(timeout);
            // Safety cleanup on unmount if still running
            if (scannerRef.current) {
                try {
                    if (scannerRef.current.isScanning) {
                        scannerRef.current.stop().catch((e: any) => console.warn(e));
                    }
                    scannerRef.current.clear();
                } catch (e) { /* ignore */ }
            }
        };
    }, [isOpen]);

    const startScanner = async () => {
        if (!window.Html5Qrcode) {
            setError("Librería de escáner no cargada.");
            return;
        }

        // Prevent multiple instances
        if (scannerRef.current) return;

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
                    handleStopAndClose(() => onDetected(decodedText));
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

    const handleStopAndClose = async (callback?: () => void) => {
        if (isStopping) return;
        setIsStopping(true);

        try {
            if (scannerRef.current) {
                // Check internal state if possible, or just try stopping
                try {
                    // Html5Qrcode throws if you call stop() while it's not running.
                    // We assume it is running if we are here, but wrap in try/catch safely.
                    await scannerRef.current.stop();
                } catch (stopErr) {
                    console.warn("Scanner stop warning:", stopErr);
                }

                try {
                    scannerRef.current.clear();
                } catch (clearErr) {
                    console.warn("Scanner clear warning:", clearErr);
                }
            }
        } catch (err) {
            console.error("Critical error stopping scanner", err);
        } finally {
            scannerRef.current = null;
            setIsStopping(false);
            onClose(); // Always close the modal
            if (callback) callback();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 animate-fade-in">
            <div className="w-full max-w-sm glass rounded-2xl overflow-hidden relative border border-white/10">
                <button
                    onClick={() => handleStopAndClose()}
                    className="absolute top-4 right-4 z-10 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 transition-colors"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>

                <div className="p-4 text-center">
                    <h3 className="text-lg font-bold text-white mb-2">Escanear Código</h3>
                    {error ? (
                        <div className="text-danger text-sm mb-4">{error}</div>
                    ) : (
                        <div className="relative w-full h-64 bg-black rounded-lg overflow-hidden flex items-center justify-center border border-white/10">
                            <div id="reader" className="w-full h-full"></div>
                            {/* Loading overlay if initializing */}
                            {!scannerRef.current && !error && (
                                <div className="absolute inset-0 flex items-center justify-center text-white/50">
                                    <span className="material-symbols-outlined animate-spin text-3xl">sync</span>
                                </div>
                            )}
                        </div>
                    )}
                    <p className="text-xs text-text-muted mt-4">Apunta la cámara al código de barras del producto.</p>
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
    const [pricePerPackage, setPricePerPackage] = useState(() => {
        if (editingProduct && editingProduct.cost && editingProduct.quantity > 0) {
            return (editingProduct.cost / editingProduct.quantity).toFixed(0);
        }
        return '';
    });
    const [totalCost, setTotalCost] = useState('');

    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [isLoadingProduct, setIsLoadingProduct] = useState(false);

    // Autocomplete State
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchTimeout = useRef<any>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);

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
    // --- Price Calculation Logic ---
    useEffect(() => {
        if (useUnitPrice) {
            const qty = parseFloat(quantity) || 0;
            const price = parseFloat(pricePerPackage) || 0;

            // User requested: Unit Price * Quantity
            // We assume 'pricePerPackage' is the Unit Price.
            const calculated = qty * price;
            setTotalCost(calculated > 0 ? calculated.toFixed(0) : '');
        }
    }, [quantity, pricePerPackage, useUnitPrice]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true); // Set submitting state to true

        if (!name || !categoryId) {
            setIsSubmitting(false); // Reset if validation fails
            return;
        }

        try {
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
        } catch (error) {
            console.error("Error submitting product:", error);
            // Optionally show an error message to the user
        } finally {
            setIsSubmitting(false); // Always reset submitting state
        }
    };

    const calculateStatus = (dateString: string): Product['status'] => {
        if (!dateString) return 'ok';
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [year, month, day] = dateString.split('-').map(Number);
        const expiry = new Date(year, month - 1, day);

        const diffTime = expiry.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return 'expired';
        if (diffDays <= 7) return 'warning';
        return 'ok';
    };

    const handleBarcodeDetected = async (code: string) => {
        setIsLoadingProduct(true);
        try {
            // Fetch from OpenFoodFacts with Chile preference
            const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json?cc=cl`);
            const data = await response.json();

            if (data.status === 1) {
                const productName = data.product.product_name_es || data.product.product_name || '';
                if (productName) setName(productName);

                // Try to extract quantity/unit hint
                if (data.product.quantity) {
                    const qStr = data.product.quantity.toLowerCase();
                    if (qStr.includes('l') && !qStr.includes('ml')) setUnit('L');
                    if (qStr.includes('ml')) setUnit('ml');
                    if (qStr.includes('kg')) setUnit('kg');
                    if (qStr.includes('g') && !qStr.includes('kg')) setUnit('g');
                }

                // Try to extract category hint
                if (data.product.categories_tags && data.product.categories_tags.length > 0) {
                    // This is a simple heuristic, mapped manually or just left for user
                    // We could try to map 'en:beverages' to 'Bebidas', etc.
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
                // Fetch Suggestions from OpenFoodFacts Search API filtered by Chile
                // We request specific fields to show in the UI
                const fields = 'product_name,product_name_es,brands,image_small_url,categories_tags,quantity';
                const response = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(val)}&search_simple=1&action=process&json=1&page_size=10&cc=cl&fields=${fields}`);
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

        // Auto-fill other fields if available
        if (product.quantity) {
            const qStr = product.quantity.toLowerCase();
            if (qStr.includes('l') && !qStr.includes('ml')) setUnit('L');
            else if (qStr.includes('ml')) setUnit('ml');
            else if (qStr.includes('kg')) setUnit('kg');
            else if (qStr.includes('g')) setUnit('g');
        }

        setShowSuggestions(false);
        setSuggestions([]);
    };

    return (
        <Layout>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-surface-highlight flex items-center justify-center border border-white/5 text-white hover:bg-white/10 transition-colors">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1 className="text-xl font-bold text-white">
                    {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                </h1>
                <div className="w-10"></div>
            </div>

            <main className="pb-24">
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Name Input with Scanner & Autocomplete */}
                    <div className="space-y-2 relative z-20">
                        <label className="text-sm font-medium text-text-muted ml-1">Nombre del Producto</label>
                        <div className="flex gap-2">
                            <input
                                value={name}
                                onChange={handleNameChange}
                                onFocus={() => name.length >= 3 && suggestions.length > 0 && setShowSuggestions(true)}
                                // Delayed blur to allow click on suggestion
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                className="flex-1 h-14 px-4 rounded-2xl border border-white/10 bg-surface-highlight/50 text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                placeholder="Ej: Leche Deslactosada"
                                required
                                autoComplete="off"
                            />
                            <button
                                type="button"
                                onClick={() => setIsScannerOpen(true)}
                                className="w-14 h-14 rounded-2xl bg-surface-highlight border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
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
                            <div className="absolute top-full left-0 right-0 mt-2 glass border border-white/10 rounded-2xl shadow-xl overflow-hidden z-30 animate-fade-in max-h-60 overflow-y-auto">
                                <ul>
                                    {suggestions.map((item, idx) => (
                                        <li
                                            key={item.code || idx}
                                            onClick={() => handleSelectSuggestion(item)}
                                            className="px-4 py-3 hover:bg-white/10 cursor-pointer flex items-center gap-3 border-b border-white/5 last:border-0 transition-colors"
                                        >
                                            {item.image_small_url ? (
                                                <img src={item.image_small_url} alt="" className="h-8 w-8 object-cover rounded bg-white" />
                                            ) : (
                                                <div className="h-8 w-8 bg-surface-highlight rounded flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-sm text-text-muted">restaurant</span>
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-white truncate">
                                                    {item.product_name_es || item.product_name}
                                                </p>
                                                <p className="text-xs text-text-muted truncate">
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
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-muted ml-1">Cantidad Total</label>
                            <input
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                className="w-full h-14 px-4 rounded-2xl border border-white/10 bg-surface-highlight/50 text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                placeholder="1"
                                min="0.1"
                                step="any"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-muted ml-1">Unidad</label>
                            <div className="relative">
                                <select
                                    value={unit}
                                    onChange={(e) => setUnit(e.target.value)}
                                    className="w-full h-14 appearance-none rounded-2xl border border-white/10 bg-surface-highlight/50 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                >
                                    <option value="unidades" className="bg-surface-dark">Unidades</option>
                                    <option value="kg" className="bg-surface-dark">Kilogramos (kg)</option>
                                    <option value="g" className="bg-surface-dark">Gramos (g)</option>
                                    <option value="L" className="bg-surface-dark">Litros (L)</option>
                                    <option value="ml" className="bg-surface-dark">Mililitros (ml)</option>
                                    <option value="oz" className="bg-surface-dark">Onzas (oz)</option>
                                    <option value="lb" className="bg-surface-dark">Libras (lb)</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-text-muted">
                                    <span className="material-symbols-outlined">expand_more</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- Price Calculator Section --- */}
                    <div className="glass rounded-2xl p-4 space-y-4 border border-white/10">
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${useUnitPrice ? 'bg-primary border-primary' : 'border-text-muted group-hover:border-white'}`}>
                                    {useUnitPrice && <span className="material-symbols-outlined text-sm text-white">check</span>}
                                </div>
                                <input type="checkbox" checked={useUnitPrice} onChange={(e) => setUseUnitPrice(e.target.checked)} className="hidden" />
                                <span className="text-sm font-bold text-white">Calcular Precio</span>
                            </label>
                            {totalCost && (
                                <span className="text-success font-bold bg-success/20 px-3 py-1 rounded-lg text-sm border border-success/30">
                                    Total: ${totalCost}
                                </span>
                            )}
                        </div>

                        {useUnitPrice && (
                            <div className="grid grid-cols-2 gap-4 animate-fade-in">
                                <div>
                                    <label className="text-xs text-text-muted block mb-1 ml-1">Precio Unitario</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">$</span>
                                        <input
                                            type="number"
                                            value={pricePerPackage}
                                            onChange={(e) => setPricePerPackage(e.target.value)}
                                            className="w-full rounded-xl border border-white/10 bg-surface-highlight/30 p-3 pl-6 text-sm text-white outline-none focus:ring-2 focus:ring-primary/50"
                                            placeholder="2.50"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-text-muted block mb-1 ml-1">Cantidad</label>
                                    <input
                                        type="number"
                                        value={quantity}
                                        readOnly
                                        className="w-full rounded-xl border border-white/10 bg-surface-highlight/10 p-3 text-sm text-text-muted outline-none cursor-not-allowed"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <p className="text-[10px] text-text-muted leading-relaxed">
                                        Ej: Si compraste 6 Unidades (Cantidad), y cada una cuesta $1000 (Precio Unitario), el costo total será $6000.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Expiry Date */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text-muted ml-1">Fecha de Vencimiento</label>
                        <input
                            type="date"
                            value={expiryDate}
                            onChange={(e) => setExpiryDate(e.target.value)}
                            className="w-full h-14 px-4 rounded-2xl border border-white/10 bg-surface-highlight/50 text-white outline-none focus:ring-2 focus:ring-primary/50 transition-all [color-scheme:dark]"
                        />
                    </div>

                    {/* Category Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text-muted ml-1">Categoría</label>
                        <div className="grid grid-cols-2 gap-3">
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setCategoryId(cat.id)}
                                    className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${categoryId === cat.id ? 'bg-primary border-primary text-white shadow-lg shadow-primary/25' : 'bg-surface-highlight/30 border-white/5 text-text-muted hover:bg-surface-highlight/50'}`}
                                >
                                    <span className="material-symbols-outlined text-xl">{cat.icon}</span>
                                    <span className="text-sm font-bold">{cat.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/25 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Guardando...' : (editingProduct ? 'Actualizar Producto' : 'Guardar Producto')}
                    </button>
                </form>
            </main>

            {isScannerOpen && (
                <BarcodeScannerModal
                    isOpen={isScannerOpen}
                    onClose={() => setIsScannerOpen(false)}
                    onDetected={handleBarcodeDetected}
                />
            )}
        </Layout>
    );
};