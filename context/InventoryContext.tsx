import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, Category } from '../types';
import { loadState, saveState } from '../utils/storage';

// Initial Categories
const INITIAL_CATEGORIES: Category[] = [
    { id: 'cat_food', name: 'Alimentos', icon: 'restaurant' },
    { id: 'cat_cleaning', name: 'Limpieza', icon: 'cleaning_services' },
    { id: 'cat_hygiene', name: 'Higiene Personal', icon: 'soap' },
    { id: 'cat_pets', name: 'Mascotas', icon: 'pets' },
];

// Mock initial data
const INITIAL_PRODUCTS: Product[] = [
    { id: '1', name: 'Yogurt Griego', quantity: 3, unit: 'unidades', expiryDate: '2023-10-25', categoryId: 'cat_food', status: 'expired', cost: 4.50, addedDate: new Date().toISOString() },
    { id: '2', name: 'Leche Entera', quantity: 2, unit: 'L', expiryDate: '2023-10-28', categoryId: 'cat_food', status: 'warning', cost: 2.40, addedDate: new Date().toISOString() },
];

interface InventoryContextType {
    products: Product[];
    categories: Category[];
    setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
    setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
    addProduct: (product: Product) => void;
    updateProduct: (product: Product) => void;
    deleteProduct: (id: string) => void;
    addCategory: (category: Category) => void;
    updateCategory: (category: Category) => void;
    deleteCategory: (id: string) => void;
    registerSyncCallback: (cb: (action: any) => void) => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [products, setProducts] = useState<Product[]>(() => loadState('products', INITIAL_PRODUCTS));
    const [categories, setCategories] = useState<Category[]>(() => loadState('categories', INITIAL_CATEGORIES));

    // Persistence
    useEffect(() => { saveState('products', products); }, [products]);
    useEffect(() => { saveState('categories', categories); }, [categories]);

    const syncCallbackRef = React.useRef<((action: any) => void) | null>(null);

    const registerSyncCallback = (cb: (action: any) => void) => {
        syncCallbackRef.current = cb;
    };

    const addProduct = (product: Product) => {
        setProducts(prev => [product, ...prev]);
        syncCallbackRef.current?.({ type: 'ADD_PRODUCT', payload: product });
    };

    const updateProduct = (updatedProduct: Product) => {
        setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
        syncCallbackRef.current?.({ type: 'UPDATE_PRODUCT', payload: updatedProduct });
    };

    const deleteProduct = (id: string) => {
        setProducts(prev => prev.filter(p => p.id !== id));
        syncCallbackRef.current?.({ type: 'DELETE_PRODUCT', payload: id });
    };

    const addCategory = (category: Category) => {
        setCategories(prev => [...prev, category]);
        syncCallbackRef.current?.({ type: 'ADD_CATEGORY', payload: category });
    };

    const updateCategory = (updatedCategory: Category) => {
        setCategories(prev => prev.map(c => c.id === updatedCategory.id ? updatedCategory : c));
        syncCallbackRef.current?.({ type: 'UPDATE_CATEGORY', payload: updatedCategory });
    };

    const deleteCategory = (id: string) => {
        setProducts(prev => prev.filter(p => p.categoryId !== id));
        setCategories(prev => prev.filter(c => c.id !== id));
        syncCallbackRef.current?.({ type: 'DELETE_CATEGORY', payload: id });
    };

    return (
        <InventoryContext.Provider value={{
            products, categories, setProducts, setCategories,
            addProduct, updateProduct, deleteProduct,
            addCategory, updateCategory, deleteCategory,
            registerSyncCallback
        }}>
            {children}
        </InventoryContext.Provider>
    );
};

export const useInventory = () => {
    const context = useContext(InventoryContext);
    if (!context) {
        throw new Error('useInventory must be used within an InventoryProvider');
    }
    return context;
};
