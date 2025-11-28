import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, Category, Transaction } from '../types';
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
    transactions: Transaction[];
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [products, setProducts] = useState<Product[]>(() => loadState('products', INITIAL_PRODUCTS));
    const [categories, setCategories] = useState<Category[]>(() => loadState('categories', INITIAL_CATEGORIES));
    const [expenses, setExpenses] = useState<Record<string, number>>(() => loadState('expenses', {}));
    const [transactions, setTransactions] = useState<Transaction[]>(() => loadState('transactions', []));

    // Persistence
    useEffect(() => { saveState('products', products); }, [products]);
    useEffect(() => { saveState('categories', categories); }, [categories]);
    useEffect(() => { saveState('expenses', expenses); }, [expenses]);
    useEffect(() => { saveState('transactions', transactions); }, [transactions]);

    const syncCallbackRef = React.useRef<((action: any) => void) | null>(null);

    const registerSyncCallback = (cb: (action: any) => void) => {
        syncCallbackRef.current = cb;
    };

    const addTransaction = (type: 'expense' | 'usage', product: Product, quantity: number, amount: number) => {
        const transaction: Transaction = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            date: new Date().toISOString(),
            type,
            productId: product.id,
            productName: product.name,
            quantity,
            amount
        };
        setTransactions(prev => [transaction, ...prev]);

        // Update monthly expenses total if it's an expense
        if (type === 'expense') {
            const date = new Date();
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            setExpenses(prev => ({
                ...prev,
                [key]: (prev[key] || 0) + amount
            }));
        }
    };

    // Legacy support for direct expense adding (if needed)
    const addExpense = (amount: number) => {
        const date = new Date();
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        setExpenses(prev => ({
            ...prev,
            [key]: (prev[key] || 0) + amount
        }));
    };

    const addProduct = (product: Product) => {
        setProducts(prev => [product, ...prev]);
        if (product.cost && product.cost > 0) {
            addTransaction('expense', product, product.quantity, product.cost);
        }
        syncCallbackRef.current?.({ type: 'ADD_PRODUCT', payload: product });
    };

    const updateProduct = (updatedProduct: Product) => {
        setProducts(prev => {
            const oldProduct = prev.find(p => p.id === updatedProduct.id);
            let finalProduct = { ...updatedProduct };

            if (oldProduct) {
                const diff = updatedProduct.quantity - oldProduct.quantity;

                // Quantity Increased -> Expense
                if (diff > 0) {
                    let addedCost = 0;

                    // Scenario A: User updated cost explicitly
                    if (updatedProduct.cost !== undefined && oldProduct.cost !== undefined && updatedProduct.cost > oldProduct.cost) {
                        addedCost = updatedProduct.cost - oldProduct.cost;
                    }
                    // Scenario B: User didn't update cost field, infer unit cost
                    else if (oldProduct.cost && oldProduct.quantity > 0) {
                        const unitCost = oldProduct.cost / oldProduct.quantity;
                        addedCost = unitCost * diff;
                        finalProduct.cost = (oldProduct.cost || 0) + addedCost;
                    }

                    if (addedCost > 0) {
                        addTransaction('expense', finalProduct, diff, addedCost);
                    }
                }
                // Quantity Decreased -> Usage
                else if (diff < 0) {
                    const consumedQty = Math.abs(diff);
                    let consumedValue = 0;

                    if (oldProduct.cost && oldProduct.quantity > 0) {
                        const unitCost = oldProduct.cost / oldProduct.quantity;
                        consumedValue = unitCost * consumedQty;
                        finalProduct.cost = Math.max(0, oldProduct.cost - consumedValue);
                    }

                    addTransaction('usage', finalProduct, consumedQty, consumedValue);
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
            expenses, addExpense,
            transactions
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
