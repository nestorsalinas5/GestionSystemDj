import React, { useState, useMemo } from 'react';
import type { User } from '../types';
import UserModal from './UserModal';
import { PlusIcon, PencilIcon, UsersIcon, KeyIcon } from './icons';

interface AdminDashboardProps {
  users: User[];
  onAddUser: (user: Omit<User, 'id'>) => void;
  onUpdateUser: (user: Partial<User> & { id: string }) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ users, onAddUser, onUpdateUser }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const handleOpenModal = (user: User | null = null) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingUser(null);
    setIsModalOpen(false);
  };

  const handleSaveUser = (userData: User | Omit<User, 'id'>) => {
    if ('id' in userData) {
      onUpdateUser(userData);
    } else {
      onAddUser(userData);
    }
    handleCloseModal();
  };
  
  const handleToggleActive = (user: User) => {
    onUpdateUser({ id: user.id, isActive: !user.isActive });
  };
  
  const formatCurrency = (value: number | undefined) => {
    if (typeof value !== 'number') return '-';
    return `Gs. ${Math.round(value).toLocaleString('es-PY')}`;
  }

  const stats = useMemo(() => {
    const now = new Date();
    const activeUsers = users.filter(u => u.isActive && new Date(u.activeUntil) > now).length;
    return {
        total: users.length,
        active: activeUsers,
        inactive: users.length - activeUsers,
    };
  }, [users]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Panel de Administrador</h2>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 shadow-md"
        >
          <PlusIcon />
          Añadir Usuario
        </button>
      </div>

       <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total de Usuarios</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                </div>
                <div className="p-3 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-500"><UsersIcon /></div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Usuarios Activos</p>
                    <p className="text-3xl font-bold text-green-500">{stats.active}</p>
                </div>
                 <div className="p-3 rounded-full bg-green-100 dark:bg-green-900 text-green-500"><KeyIcon /></div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Usuarios Inactivos</p>
                    <p className="text-3xl font-bold text-red-500">{stats.inactive}</p>
                </div>
                 <div className="p-3 rounded-full bg-red-100 dark:bg-red-900 text-red-500"><KeyIcon /></div>
            </div>
       </div>

      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          {users.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Usuario</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Suscripción Vence</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Plan</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Último Pago</th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Estado</th>
                  <th scope="col" className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {users.map(user => {
                    const isSubscriptionActive = new Date(user.activeUntil) > new Date();
                    const statusText = user.isActive ? (isSubscriptionActive ? 'Activo' : 'Vencido') : 'Inactivo';
                    const statusColorClass = user.isActive ? (isSubscriptionActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200') : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
                    
                    return (
                        <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{user.username}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{new Date(user.activeUntil).toLocaleDateString('es-ES')}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{user.subscriptionTier || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{formatCurrency(user.lastPaymentAmount)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                <div className="flex items-center justify-center gap-2">
                                     <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={user.isActive} onChange={() => handleToggleActive(user)} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                                    </label>
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColorClass}`}>
                                        {statusText}
                                    </span>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button onClick={() => handleOpenModal(user)} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"><PencilIcon/></button>
                            </td>
                        </tr>
                    )
                })}
              </tbody>
            </table>
          ) : (
             <div className="text-center py-10 text-gray-500 dark:text-gray-400">No hay usuarios registrados.</div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <UserModal
          user={editingUser}
          onSave={handleSaveUser}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default AdminDashboard;