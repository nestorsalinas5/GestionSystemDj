import React, { useState, useEffect } from 'react';
import type { Event, Client, ExpenseItem } from '../types';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../types';
import { PlusIcon, TrashIcon } from './icons';

interface EventModalProps {
  event: Event | null;
  clients: Client[];
  onSave: (eventData: Event | Omit<Event, 'id'>) => void;
  onClose: () => void;
}

const EventModal: React.FC<EventModalProps> = ({ event, clients, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    eventName: '',
    date: '',
    location: '',
    clientId: '',
    incomeCategory: INCOME_CATEGORIES[0],
    amountCharged: '',
    notes: '',
  });
  const [expenses, setExpenses] = useState<Omit<ExpenseItem, 'id'>[]>([]);

  useEffect(() => {
    if (event) {
      setFormData({
        eventName: event.eventName,
        date: event.date.split('T')[0],
        location: event.location,
        clientId: event.clientId,
        incomeCategory: event.incomeCategory,
        amountCharged: String(Math.round(event.amountCharged)),
        notes: event.notes || '',
      });
      setExpenses(event.expenses.map(({id, ...rest}) => rest));
    } else {
       const today = new Date().toISOString().split('T')[0];
       setFormData(prev => ({...prev, date: today}));
       setExpenses([{category: EXPENSE_CATEGORIES[0], amount: 0}]);
    }
  }, [event]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleExpenseChange = (index: number, field: 'category' | 'amount', value: string | number) => {
    const newExpenses = [...expenses];
    if (field === 'amount') {
        newExpenses[index][field] = Number(value) || 0;
    } else {
        newExpenses[index][field] = value as string;
    }
    setExpenses(newExpenses);
  };
  
  const addExpense = () => {
      setExpenses([...expenses, { category: EXPENSE_CATEGORIES[0], amount: 0 }]);
  };

  const removeExpense = (index: number) => {
      setExpenses(expenses.filter((_, i) => i !== index));
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId) {
        alert("Por favor, seleccione un cliente.");
        return;
    }
    const eventData = {
      ...formData,
      date: new Date(formData.date).toISOString(),
      amountCharged: parseInt(formData.amountCharged, 10) || 0,
      expenses: expenses.map(exp => ({...exp, id: crypto.randomUUID()})),
    };
    
    if (event) {
      onSave({ ...eventData, id: event.id });
    } else {
      onSave(eventData);
    }
  };
  
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{event ? 'Editar Evento' : 'Registrar Nuevo Evento'}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="eventName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre del Evento</label>
              <input type="text" name="eventName" id="eventName" value={formData.eventName} onChange={handleChange} required className="mt-1 block w-full bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
            </div>
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha</label>
              <input type="date" name="date" id="date" value={formData.date} onChange={handleChange} required className="mt-1 block w-full bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
            </div>
             <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Lugar</label>
              <input type="text" name="location" id="location" value={formData.location} onChange={handleChange} required className="mt-1 block w-full bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
            </div>
            <div>
              <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cliente</label>
              <select name="clientId" id="clientId" value={formData.clientId} onChange={handleChange} required className="mt-1 block w-full bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                <option value="" disabled>Seleccione un cliente</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="incomeCategory" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Categoría de Ingreso</label>
              <select name="incomeCategory" id="incomeCategory" value={formData.incomeCategory} onChange={handleChange} required className="mt-1 block w-full bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                 {INCOME_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label htmlFor="amountCharged" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Monto Cobrado (Gs.)</label>
              <input type="number" name="amountCharged" id="amountCharged" value={formData.amountCharged} onChange={handleChange} required min="0" step="1" className="mt-1 block w-full bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
            </div>
          </div>
          
          <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Gastos</h3>
              {expenses.map((expense, index) => (
                  <div key={index} className="grid grid-cols-12 gap-3 items-center">
                      <div className="col-span-6">
                         <select value={expense.category} onChange={e => handleExpenseChange(index, 'category', e.target.value)} className="w-full bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                            {EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                         </select>
                      </div>
                       <div className="col-span-5">
                          <input type="number" min="0" step="1" value={expense.amount} onChange={e => handleExpenseChange(index, 'amount', e.target.value)} placeholder="Monto (Gs.)" className="w-full bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                       </div>
                       <div className="col-span-1">
                          <button type="button" onClick={() => removeExpense(index)} className="text-red-500 hover:text-red-700 dark:hover:text-red-400"><TrashIcon /></button>
                       </div>
                  </div>
              ))}
              <div className="flex justify-between items-center pt-2">
                <button type="button" onClick={addExpense} className="flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                    <PlusIcon className="h-4 w-4" /> Añadir Gasto
                </button>
                <div className="font-semibold text-gray-800 dark:text-gray-200">Total Gastos: Gs. {totalExpenses.toLocaleString('es-PY')}</div>
              </div>
          </div>
          
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Observaciones / Notas</label>
            <textarea name="notes" id="notes" value={formData.notes} onChange={handleChange} rows={3} className="mt-1 block w-full bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"></textarea>
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={onClose} className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-800 focus:ring-indigo-500">
              Cancelar
            </button>
            <button type="submit" className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-800 focus:ring-indigo-500">
              Guardar Evento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;