import React, { useState, useMemo } from 'react';
import type { Event, Client } from '../types';
import EventModal from './EventModal';
import { PlusIcon, PencilIcon, TrashIcon, SearchIcon } from './icons';

interface EventListProps {
  events: Event[];
  clients: Client[];
  onAddEvent: (event: Omit<Event, 'id'>) => void;
  onUpdateEvent: (event: Event) => void;
  onDeleteEvent: (eventId: string) => void;
}

const EventList: React.FC<EventListProps> = ({ events, clients, onAddEvent, onUpdateEvent, onDeleteEvent }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [filter, setFilter] = useState({ startDate: '', endDate: '' });
  const [searchTerm, setSearchTerm] = useState('');

  const handleOpenModal = (event: Event | null = null) => {
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingEvent(null);
    setIsModalOpen(false);
  };

  const handleSaveEvent = (event: Event | Omit<Event, 'id'>) => {
    if ('id' in event) {
      onUpdateEvent(event);
    } else {
      onAddEvent(event);
    }
    handleCloseModal();
  };
  
  const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c.name])), [clients]);

  const filteredEvents = useMemo(() => {
    return events
      .filter(event => {
        const eventDate = new Date(event.date);
        const startDate = filter.startDate ? new Date(filter.startDate) : null;
        const endDate = filter.endDate ? new Date(filter.endDate) : null;
        if(startDate) startDate.setHours(0,0,0,0);
        if(endDate) endDate.setHours(23,59,59,999);
        if (startDate && eventDate < startDate) return false;
        if (endDate && eventDate > endDate) return false;
        return true;
      })
      .filter(event => {
          if (!searchTerm) return true;
          const lowerSearchTerm = searchTerm.toLowerCase();
          const clientName = clientMap.get(event.clientId)?.toLowerCase() || '';
          return (
            event.eventName.toLowerCase().includes(lowerSearchTerm) ||
            clientName.includes(lowerSearchTerm) ||
            event.location.toLowerCase().includes(lowerSearchTerm)
          );
      });
  }, [events, filter, searchTerm, clientMap]);

  const formatCurrency = (value: number) => `Gs. ${Math.round(value).toLocaleString('es-PY')}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Eventos</h2>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 shadow-md"
        >
          <PlusIcon />
          Registrar Evento
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md flex flex-col md:flex-row flex-wrap items-center gap-4">
          <div className="relative w-full md:w-auto md:flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-gray-400"/>
            </div>
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar evento, cliente, lugar..." className="block w-full pl-10 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"/>
          </div>
          <div className="flex items-center gap-2">
            <input type="date" value={filter.startDate} onChange={e => setFilter({...filter, startDate: e.target.value})} className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"/>
            <span className="text-gray-500 dark:text-gray-300">-</span>
            <input type="date" value={filter.endDate} onChange={e => setFilter({...filter, endDate: e.target.value})} className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"/>
            <button onClick={() => setFilter({ startDate: '', endDate: '' })} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 text-sm font-medium">Limpiar</button>
          </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          {filteredEvents.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nombre del Evento</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cliente</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ingresos</th>
                   <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Gastos</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ganancia</th>
                  <th scope="col" className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredEvents.map(event => {
                    const totalExpenses = event.expenses.reduce((sum, exp) => sum + exp.amount, 0);
                    const profit = event.amountCharged - totalExpenses;
                    return (
                        <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{event.eventName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{new Date(event.date).toLocaleDateString('es-ES', { timeZone: 'UTC' })}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{clientMap.get(event.clientId) || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 dark:text-green-400">{formatCurrency(event.amountCharged)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600 dark:text-red-400">-{formatCurrency(totalExpenses)}</td>
                           <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-semibold ${profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {formatCurrency(profit)}
                            </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button onClick={() => handleOpenModal(event)} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 mr-4"><PencilIcon/></button>
                            <button onClick={() => onDeleteEvent(event.id)} className="text-red-600 dark:text-red-500 hover:text-red-800 dark:hover:text-red-400"><TrashIcon/></button>
                          </td>
                        </tr>
                    )
                })}
              </tbody>
            </table>
          ) : (
             <div className="text-center py-10 text-gray-500 dark:text-gray-400">No se encontraron eventos con los filtros actuales.</div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <EventModal
          event={editingEvent}
          clients={clients}
          onSave={handleSaveEvent}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default EventList;
