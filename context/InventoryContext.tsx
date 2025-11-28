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
    expenses: Record<string, number>;
    addExpense: (amount: number) => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [products, setProducts] = useState<Product[]>(() => loadState('products', INITIAL_PRODUCTS));
    const [categories, setCategories] = useState<Category[]>(() => loadState('categories', INITIAL_CATEGORIES));
    const [expenses, setExpenses] = useState<Record<string, number>>(() => loadState('expenses', {}));

    // Persistence
    useEffect(() => { saveState('products', products); }, [products]);
    useEffect(() => { saveState('categories', categories); }, [categories]);
    useEffect(() => { saveState('expenses', expenses); }, [expenses]);

    const syncCallbackRef = React.useRef<((action: any) => void) | null>(null);

    const registerSyncCallback = (cb: (action: any) => void) => {
        syncCallbackRef.current = cb;
    };

    const addExpense = (amount: number) => {
        const date = new Date();
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
        setExpenses(prev => ({
            ...prev,
            [key]: (prev[key] || 0) + amount
        }));
        // We could sync expenses too, but let's keep it local or simple for now. 
        // If we want to sync, we need a SYNC_EXPENSE action.
    };

    const addProduct = (product: Product) => {
        setProducts(prev => [product, ...prev]);
        if (product.cost) {
            addExpense(product.cost);
        }
        syncCallbackRef.current?.({ type: 'ADD_PRODUCT', payload: product });
    };

    const updateProduct = (updatedProduct: Product) => {
        setProducts(prev => {
            const oldProduct = prev.find(p => p.id === updatedProduct.id);

            // Logic to update cost and expenses if quantity changed
            let finalProduct = { ...updatedProduct };

            if (oldProduct) {
                // If quantity increased
                if (updatedProduct.quantity > oldProduct.quantity) {
                    const diff = updatedProduct.quantity - oldProduct.quantity;
                    // Calculate unit cost from old product
                    // If old quantity was 0, we can't calculate unit cost from it.
                    // We rely on the fact that if quantity was 0, hopefully cost was 0 or we use the last known unit cost?
                    // For simplicity, if oldQuantity > 0, unitCost = oldCost / oldQuantity.
                    // If oldQuantity === 0, we assume the user is just adding back stock. 
                    // If the user didn't update the cost in the UI, we might be in trouble.
                    // But typically +/- buttons are used for small adjustments.

                    let unitCost = 0;
                    if (oldProduct.quantity > 0 && oldProduct.cost) {
                        unitCost = oldProduct.cost / oldProduct.quantity;
                    } else if (updatedProduct.cost && updatedProduct.quantity > 0) {
                        // If it was 0, maybe the new product has a cost set? 
                        // If coming from +/- button, updatedProduct.cost is same as oldProduct.cost (which might be 0 or residual).
                        // Let's assume if quantity was 0, we can't guess the price unless we store unitPrice.
                        // For now, let's only do this if oldQuantity > 0.
                        unitCost = 0;
                    }

                    if (unitCost > 0) {
                        const addedCost = unitCost * diff;
                        addExpense(addedCost);
                        // Update total cost of the product
                        finalProduct.cost = (oldProduct.cost || 0) + addedCost;
                    }
                }
                // If quantity decreased
                else if (updatedProduct.quantity < oldProduct.quantity) {
                    // We don't refund expenses.
                    // But we should decrease the asset value (product.cost).
                    const diff = oldProduct.quantity - updatedProduct.quantity;
                    let unitCost = 0;
                    if (oldProduct.quantity > 0 && oldProduct.cost) {
                        unitCost = oldProduct.cost / oldProduct.quantity;
                    }
                    if (unitCost > 0) {
                        finalProduct.cost = Math.max(0, (oldProduct.cost || 0) - (unitCost * diff));
                    }
                }
            }

            return prev.map(p => p.id === finalProduct.id ? finalProduct : p);
        });
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
            registerSyncCallback,
            expenses, addExpense
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
