
import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Inventory } from './pages/Inventory';
import { AddProduct } from './pages/AddProduct';
import { Profile } from './pages/Profile';
import { ManageAccess } from './pages/ManageAccess';
import { ShoppingList } from './pages/ShoppingList';
import { Product, Category } from './types';

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
  { id: '4', name: 'Arroz', quantity: 1, unit: 'kg', expiryDate: '2024-06-01', categoryId: 'cat_food', status: 'ok' },
  { id: '5', name: 'Detergente', quantity: 1, unit: 'L', expiryDate: '', categoryId: 'cat_cleaning', status: 'ok' },
  { id: '6', name: 'Limpiador Multiuso', quantity: 750, unit: 'ml', expiryDate: '', categoryId: 'cat_cleaning', status: 'ok' },
  { id: '7', name: 'Pan de Molde', quantity: 0, unit: 'unidades', expiryDate: '', categoryId: 'cat_food', status: 'ok' },
];

const App: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  const addProduct = (newProduct: Product) => {
    setProducts(prev => [newProduct, ...prev]);
  };

  const updateProduct = (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  // Category Handlers
  const addCategory = (category: Category) => {
    setCategories(prev => [...prev, category]);
  };

  const updateCategory = (updatedCategory: Category) => {
    setCategories(prev => prev.map(c => c.id === updatedCategory.id ? updatedCategory : c));
  };

  const deleteCategory = (categoryId: string) => {
    // Cascade delete: remove products in this category (or we could move them to 'uncategorized')
    // For this example, we'll keep products but they might disappear from view if view depends on category list.
    // Better approach: Delete products associated with it.
    if (window.confirm('¿Seguro que quieres eliminar esta categoría? Se borrarán los productos asociados.')) {
        setProducts(prev => prev.filter(p => p.categoryId !== categoryId));
        setCategories(prev => prev.filter(c => c.id !== categoryId));
    }
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
          <Route path="/access" element={isAuthenticated ? <ManageAccess /> : <Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
