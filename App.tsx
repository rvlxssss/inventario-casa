
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Inventory } from './pages/Inventory';
import { AddProduct } from './pages/AddProduct';
import { Profile } from './pages/Profile';
import { ManageAccess } from './pages/ManageAccess';
import { ShoppingList } from './pages/ShoppingList';
import { Product, Category, User } from './types';

// Initial Categories
const INITIAL_CATEGORIES: Category[] = [
    { id: 'cat_food', name: 'Alimentos', icon: 'restaurant' },
    { id: 'cat_cleaning', name: 'Limpieza', icon: 'cleaning_services' },
    { id: 'cat_hygiene', name: 'Higiene Personal', icon: 'soap' },
    { id: 'cat_pets', name: 'Mascotas', icon: 'pets' },
];

// Mock initial data linked to category IDs
const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'Yogurt Griego', quantity: 3, unit: 'unidades', expiryDate: '2023-10-25', categoryId: 'cat_food', status: 'expired' },
  { id: '2', name: 'Leche Entera', quantity: 2, unit: 'unidades', expiryDate: '2023-10-28', categoryId: 'cat_food', status: 'warning' },
  { id: '3', name: 'Huevos', quantity: 12, unit: 'unidades', expiryDate: '2023-11-10', categoryId: 'cat_food', status: 'ok' },
  { id: '4', name: 'Arroz', quantity: 1000, unit: 'g', expiryDate: '2024-06-01', categoryId: 'cat_food', status: 'ok' },
  { id: '5', name: 'Detergente', quantity: 1, unit: 'L', expiryDate: '', categoryId: 'cat_cleaning', status: 'ok' },
  { id: '6', name: 'Limpiador Multiuso', quantity: 750, unit: 'ml', expiryDate: '', categoryId: 'cat_cleaning', status: 'ok' },
];

const INITIAL_MEMBERS: User[] = [
    { id: '1', name: 'Ana García', email: 'ana.garcia@email.com', avatarUrl: '', role: 'owner', isCurrentUser: true },
    { id: '2', name: 'Ana Gómez', email: 'ana.gomez@email.com', avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDLNA3YZOo9mbFhzDJkLsgSzsYpVuPOzvFpYnEEoEwE69N76rYiMcFXllwRHIK7JANcAFumOCEIXgQPdDFjsOkAttniX5er7ZVINowYSqy01Vy_g8cLqfMz-tltajfkAkVN48jripHGh_GxFrxufiXE2xCCYl8G58zVz1eMFc6D_dwNgHv502bhG4DS3T5_SXhRxsBoGvKngaF5NwekYADaH2maYp6Lc80o2-zF55QKeK3O_n_mce9ulVetIc6hyn9DyYvSE7lFoEs', role: 'editor' },
];

// Helper to load from local storage
const loadState = <T,>(key: string, fallback: T): T => {
  const saved = localStorage.getItem(key);
  return saved ? JSON.parse(saved) : fallback;
};

const App: React.FC = () => {
  // State with persistence
  const [products, setProducts] = useState<Product[]>(() => loadState('products', INITIAL_PRODUCTS));
  const [categories, setCategories] = useState<Category[]>(() => loadState('categories', INITIAL_CATEGORIES));
  const [members, setMembers] = useState<User[]>(() => loadState('members', INITIAL_MEMBERS));
  const [isAuthenticated, setIsAuthenticated] = useState(() => loadState('isAuthenticated', false));

  // Persistence Effects
  useEffect(() => { localStorage.setItem('products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('categories', JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem('members', JSON.stringify(members)); }, [members]);
  useEffect(() => { localStorage.setItem('isAuthenticated', JSON.stringify(isAuthenticated)); }, [isAuthenticated]);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  // Product Handlers
  const addProduct = (newProduct: Product) => {
    setProducts(prev => [newProduct, ...prev]);
  };

  const updateProduct = (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const deleteProduct = (productId: string) => {
      setProducts(prev => prev.filter(p => p.id !== productId));
  };

  // Category Handlers
  const addCategory = (category: Category) => {
    setCategories(prev => [...prev, category]);
  };

  const updateCategory = (updatedCategory: Category) => {
    setCategories(prev => prev.map(c => c.id === updatedCategory.id ? updatedCategory : c));
  };

  const deleteCategory = (categoryId: string) => {
    if (window.confirm('¿Seguro que quieres eliminar esta categoría? Se borrarán los productos asociados.')) {
        setProducts(prev => prev.filter(p => p.categoryId !== categoryId));
        setCategories(prev => prev.filter(c => c.id !== categoryId));
    }
  };

  // Member Handlers
  const updateMembers = (newMembers: User[]) => {
      setMembers(newMembers);
  };

  return (
    <Router>
      <div className="bg-background-light dark:bg-background-dark min-h-screen text-slate-900 dark:text-white font-display">
        <Routes>
          <Route path="/" element={!isAuthenticated ? <Login onLogin={handleLogin} /> : <Navigate to="/inventory" />} />
          <Route 
            path="/inventory" 
            element={isAuthenticated ? 
                <Inventory 
                    products={products} 
                    categories={categories}
                    onUpdateProduct={updateProduct} 
                    onDeleteProduct={deleteProduct}
                    onAddCategory={addCategory}
                    onUpdateCategory={updateCategory}
                    onDeleteCategory={deleteCategory}
                /> : <Navigate to="/" />} 
            />
          <Route 
            path="/shopping-list" 
            element={isAuthenticated ? 
                <ShoppingList 
                    products={products} 
                    categories={categories}
                    onUpdateProduct={updateProduct} 
                /> : <Navigate to="/" />} 
            />
          <Route 
            path="/add" 
            element={isAuthenticated ? 
                <AddProduct 
                    categories={categories}
                    onAdd={addProduct} 
                /> : <Navigate to="/" />} 
            />
          <Route path="/profile" element={isAuthenticated ? <Profile onLogout={handleLogout} /> : <Navigate to="/" />} />
          <Route 
            path="/access" 
            element={isAuthenticated ? 
                <ManageAccess 
                    members={members} 
                    onUpdateMembers={updateMembers} 
                /> : <Navigate to="/" />} 
            />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
