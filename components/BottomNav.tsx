
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Spacer to prevent content being hidden behind the fixed nav */}
      <div className="h-24 w-full" />
      
      {/* Floating Action Button */}
      <div className="fixed bottom-6 left-0 right-0 z-30 flex justify-center pointer-events-none">
        <button 
            onClick={() => navigate('/add')}
            className="pointer-events-auto flex h-16 w-16 cursor-pointer items-center justify-center rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-[0_8px_16px_rgba(0,0,0,0.3)] transition-transform duration-200 ease-in-out hover:scale-105 active:scale-95 border-4 border-background-light dark:border-background-dark"
        >
            <span className="material-symbols-outlined text-4xl font-light">add</span>
        </button>
      </div>

      {/* Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 h-20 bg-white/95 dark:bg-[#191919]/95 backdrop-blur-md shadow-[0_-1px_4px_rgba(0,0,0,0.05)] z-20 border-t border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-5 h-full px-2">
            
            {/* 1. Inventory */}
            <button 
            onClick={() => navigate('/inventory')}
            className={`flex flex-col items-center justify-center col-span-1 transition-colors ${isActive('/inventory') ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-600'}`}
            >
            <span className={`material-symbols-outlined ${isActive('/inventory') ? 'fill-current' : ''}`}>inventory_2</span>
            <span className="text-[10px] mt-1 font-bold">Inventario</span>
            </button>

            {/* 2. Shopping List */}
            <button 
            onClick={() => navigate('/shopping-list')}
            className={`flex flex-col items-center justify-center col-span-1 transition-colors ${isActive('/shopping-list') ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-600'}`}
            >
            <span className={`material-symbols-outlined ${isActive('/shopping-list') ? 'fill-current' : ''}`}>shopping_cart</span>
            <span className="text-[10px] mt-1 font-bold">Lista</span>
            </button>

            {/* 3. Empty Slot for FAB */}
            <div className="col-span-1 pointer-events-none" />

            {/* 4. Placeholder (Community/Recipes?) - Just spacer for now, or maybe duplicate access? */}
             <button 
               onClick={() => navigate('/access')}
               className={`flex flex-col items-center justify-center col-span-1 transition-colors ${isActive('/access') ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-600'}`}
            >
               <span className={`material-symbols-outlined ${isActive('/access') ? 'fill-current' : ''}`}>group</span>
               <span className="text-[10px] mt-1 font-bold">Familia</span>
            </button>

            {/* 5. Profile */}
            <button 
            onClick={() => navigate('/profile')}
            className={`flex flex-col items-center justify-center col-span-1 transition-colors ${isActive('/profile') ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-600'}`}
            >
            <span className={`material-symbols-outlined ${isActive('/profile') ? 'fill-current' : ''}`}>person</span>
            <span className="text-[10px] mt-1 font-bold">Perfil</span>
            </button>
        </div>
      </div>
    </>
  );
};
