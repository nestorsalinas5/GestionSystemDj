import React, { useState, useRef, useEffect } from 'react';
import type { View, User } from '../types';
import { CalendarIcon, ChartBarIcon, DocumentTextIcon, UsersIcon, SunIcon, MoonIcon, DownloadIcon, UploadIcon, MenuIcon, LogoutIcon, KeyIcon, ExclamationIcon } from './icons';

interface HeaderProps {
  user: User;
  currentView: View;
  setView: (view: View) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLogout: () => void;
  onOpenPasswordModal: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, currentView, setView, theme, setTheme, onExport, onImport, onLogout, onOpenPasswordModal }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  const adminNavItems = [
    { view: 'adminDashboard' as View, label: 'Gestión Usuarios', icon: <KeyIcon /> },
  ];

  const userNavItems = [
    { view: 'dashboard' as View, label: 'Panel', icon: <ChartBarIcon /> },
    { view: 'events' as View, label: 'Eventos', icon: <CalendarIcon /> },
    { view: 'clients' as View, label: 'Clientes', icon: <UsersIcon /> },
    { view: 'calendar' as View, label: 'Calendario', icon: <CalendarIcon className="h-6 w-6" /> },
    { view: 'reports' as View, label: 'Reportes', icon: <DocumentTextIcon /> },
  ];

  const navItems = user.role === 'admin' ? adminNavItems : userNavItems;

  const getButtonClass = (view: View) => {
    const baseClass = "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-900 focus:ring-indigo-500";
    if (currentView === view) {
      return `${baseClass} bg-indigo-600 text-white`;
    }
    return `${baseClass} text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white`;
  };

  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuRef]);

  const getSubscriptionWarning = () => {
    if (user.role !== 'user') return null;

    const now = new Date();
    const expiryDate = new Date(user.activeUntil);
    const daysRemaining = (expiryDate.getTime() - now.getTime()) / (1000 * 3600 * 24);

    if (daysRemaining > 7) return null;

    let message;
    let colorClass;

    if (daysRemaining <= 0) {
      message = "Su suscripción ha expirado.";
      colorClass = "bg-red-500 text-white";
    } else if (daysRemaining <= 2) {
      message = `¡Su suscripción vence en ${Math.ceil(daysRemaining)} día(s)!`;
      colorClass = "bg-red-400 text-red-900";
    } else {
      message = `Su suscripción vence en ${Math.ceil(daysRemaining)} días.`;
      colorClass = "bg-amber-400 text-amber-900";
    }

    return (
      <div className={`w-full text-center p-2 text-sm font-semibold ${colorClass} flex items-center justify-center gap-2`}>
        <ExclamationIcon />
        {message}
      </div>
    );
  };

  return (
    <>
      <header className="bg-white dark:bg-gray-800 shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-wider">
                GestionSystem<span className="text-indigo-500 dark:text-indigo-400">Dj</span>
              </h1>
              <div className="ml-4 text-sm text-gray-500 dark:text-gray-400 capitalize hidden sm:block">
                <span>{user.role === 'admin' ? '(Admin)' : `(${user.username})`}</span>
                {user.role === 'user' && (
                  <span className="ml-2 text-xs">
                    Activo hasta: {new Date(user.activeUntil).toLocaleDateString('es-ES')}
                  </span>
                )}
              </div>
            </div>
            <nav className="hidden md:flex items-center space-x-2">
              {navItems.map(item => (
                <button key={item.view} onClick={() => setView(item.view)} className={getButtonClass(item.view)}>
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
            <div className="flex items-center gap-3">
              <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
              </button>
              <div className="relative" ref={menuRef}>
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  <MenuIcon />
                </button>
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-700 rounded-md shadow-lg py-1 z-50 ring-1 ring-black ring-opacity-5">
                    {user.role === 'admin' && (
                      <button onClick={onOpenPasswordModal} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600">
                        <KeyIcon /> Cambiar Contraseña
                      </button>
                    )}
                    {user.role === 'user' && (
                      <>
                        <button onClick={handleImportClick} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600">
                          <UploadIcon /> Importar Datos
                        </button>
                        <button onClick={onExport} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600">
                          <DownloadIcon /> Exportar Datos
                        </button>
                      </>
                    )}
                    <div className="my-1 h-px bg-gray-200 dark:bg-gray-600"></div>
                    <button onClick={onLogout} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600">
                      <LogoutIcon /> Cerrar Sesión
                    </button>
                    <input type="file" ref={importInputRef} onChange={onImport} className="hidden" accept=".json" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Mobile Nav */}
        <div className="md:hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-2 flex justify-around">
          {navItems.map(item => (
            <button key={`mobile-${item.view}`} onClick={() => setView(item.view)} className={`${getButtonClass(item.view)} flex-col h-16 w-16`}>
              {item.icon}
              <span className="text-xs">{item.label}</span>
            </button>
          ))}
        </div>
      </header>
      {getSubscriptionWarning()}
    </>
  );
};

export default Header;