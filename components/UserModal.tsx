import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import { SUBSCRIPTION_TIERS } from '../types';

interface UserModalProps {
  user: User | null;
  onSave: (userData: User | Omit<User, 'id'>) => void;
  onClose: () => void;
}

const UserModal: React.FC<UserModalProps> = ({ user, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    activeUntil: new Date().toISOString().split('T')[0],
    subscriptionTier: SUBSCRIPTION_TIERS[0],
    lastPaymentAmount: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        password: '', // Always clear password field on open
        activeUntil: new Date(user.activeUntil).toISOString().split('T')[0],
        subscriptionTier: user.subscriptionTier || SUBSCRIPTION_TIERS[0],
        lastPaymentAmount: user.lastPaymentAmount?.toString() || '',
      });
    } else {
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        setFormData(prev => ({
            ...prev,
            username: '',
            password: '',
            activeUntil: nextMonth.toISOString().split('T')[0],
            subscriptionTier: SUBSCRIPTION_TIERS[0],
            lastPaymentAmount: '',
        }));
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const baseUserData = {
      username: formData.username,
      activeUntil: new Date(formData.activeUntil).toISOString(),
      subscriptionTier: formData.subscriptionTier,
      lastPaymentAmount: parseInt(formData.lastPaymentAmount, 10) || 0,
    };

    if (user) { // Editing existing user
      const updatedUser: Partial<User> & { id: string } = {
        ...baseUserData,
        id: user.id,
      };
      if (formData.password) {
        updatedUser.password = formData.password;
      }
      // FIX: Argument of type 'Partial<User> & { id: string; }' is not assignable to parameter of type 'User'.
      // The onSave prop expects a full User object.
      // We merge the existing user data with the updated fields to create a full User object.
      onSave({ ...user, ...updatedUser });
    } else { // Creating new user
        if (!formData.password) {
            alert("La contraseña es obligatoria para nuevos usuarios.");
            return;
        }
        if (!formData.username) {
            alert("El nombre de usuario es obligatorio.");
            return;
        }
      onSave({ 
        ...baseUserData,
        password: formData.password,
        role: 'user' as const,
        isActive: true,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg">
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{user ? 'Editar Usuario' : 'Añadir Nuevo Usuario'}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre de Usuario</label>
              <input type="text" name="username" id="username" value={formData.username} onChange={handleChange} required disabled={!!user} className="mt-1 block w-full bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"/>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{user ? 'Nueva Contraseña (opcional)' : 'Contraseña'}</label>
              <input type="password" name="password" id="password" value={formData.password} onChange={handleChange} required={!user} className="mt-1 block w-full bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
            </div>
            <div className="md:col-span-2">
              <label htmlFor="activeUntil" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Suscripción Activa Hasta</label>
              <input type="date" name="activeUntil" id="activeUntil" value={formData.activeUntil} onChange={handleChange} required className="mt-1 block w-full bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
            </div>
             <div>
                <label htmlFor="subscriptionTier" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Plan Contratado</label>
                <select name="subscriptionTier" id="subscriptionTier" value={formData.subscriptionTier} onChange={handleChange} className="mt-1 block w-full bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                    {SUBSCRIPTION_TIERS.map(tier => <option key={tier} value={tier}>{tier}</option>)}
                </select>
            </div>
             <div>
                <label htmlFor="lastPaymentAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Monto Pagado (Gs.)</label>
                <input type="number" name="lastPaymentAmount" id="lastPaymentAmount" value={formData.lastPaymentAmount} onChange={handleChange} min="0" step="1" className="mt-1 block w-full bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
            </div>
          </div>
          
          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700 mt-6">
            <button type="button" onClick={onClose} className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-800 focus:ring-indigo-500">
              Cancelar
            </button>
            <button type="submit" className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-800 focus:ring-indigo-500">
              Guardar Usuario
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal;