import React, { useState, useMemo } from 'react';
import type { Event, Client } from '../types';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';

interface CalendarViewProps {
    events: Event[];
    clients: Client[];
}

const CalendarView: React.FC<CalendarViewProps> = ({ events, clients }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    
    const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c.name])), [clients]);

    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 for Sunday, 1 for Monday, etc.
    const daysInMonth = lastDayOfMonth.getDate();

    const changeMonth = (offset: number) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
        setSelectedDate(null);
    };
    
    const eventsByDate = useMemo(() => {
        const map = new Map<string, Event[]>();
        events.forEach(event => {
            const dateKey = new Date(event.date).toISOString().split('T')[0];
            if (!map.has(dateKey)) {
                map.set(dateKey, []);
            }
            map.get(dateKey)!.push(event);
        });
        return map;
    }, [events]);
    
    const selectedDateEvents = useMemo(() => {
        if (!selectedDate) return [];
        const dateKey = selectedDate.toISOString().split('T')[0];
        return eventsByDate.get(dateKey) || [];
    }, [selectedDate, eventsByDate]);

    const calendarDays = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
        calendarDays.push(<div key={`empty-start-${i}`} className="border-r border-b border-gray-200 dark:border-gray-700"></div>);
    }
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const dateKey = date.toISOString().split('T')[0];
        const dayEvents = eventsByDate.get(dateKey) || [];
        const isToday = new Date().toISOString().split('T')[0] === dateKey;
        const isSelected = selectedDate?.toISOString().split('T')[0] === dateKey;

        calendarDays.push(
            <div key={day} onClick={() => setSelectedDate(date)} className={`p-2 border-r border-b border-gray-200 dark:border-gray-700 relative cursor-pointer transition-colors ${isSelected ? 'bg-indigo-100 dark:bg-indigo-900/50' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}>
                <time dateTime={dateKey} className={`font-semibold ${isToday ? 'bg-indigo-600 text-white rounded-full flex items-center justify-center h-8 w-8' : 'text-gray-900 dark:text-white'}`}>
                    {day}
                </time>
                {dayEvents.length > 0 && (
                    <div className="absolute bottom-1 right-1 flex space-x-1">
                        {dayEvents.slice(0, 3).map((_, index) => (
                             <div key={index} className="h-2 w-2 bg-indigo-500 rounded-full"></div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    const formatCurrency = (value: number) => `Gs. ${Math.round(value).toLocaleString('es-PY')}`;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><ChevronLeftIcon /></button>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {currentDate.toLocaleString('es', { month: 'long', year: 'numeric' })}
                    </h2>
                    <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><ChevronRightIcon /></button>
                </div>
                <div className="grid grid-cols-7 text-center font-semibold text-gray-600 dark:text-gray-400 text-xs">
                    {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => <div key={day} className="py-2">{day}</div>)}
                </div>
                <div className="grid grid-cols-7 h-[60vh] border-t border-l border-gray-200 dark:border-gray-700">
                    {calendarDays}
                </div>
            </div>
            <div className="lg:col-span-1">
                 <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg h-full">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">
                       Eventos del {selectedDate ? selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) : 'día seleccionado'}
                    </h3>
                    {selectedDateEvents.length > 0 ? (
                        <ul className="space-y-4 max-h-[70vh] overflow-y-auto">
                           {selectedDateEvents.map(event => {
                               const totalExpenses = event.expenses.reduce((s, e) => s + e.amount, 0);
                               const profit = event.amountCharged - totalExpenses;
                               return (
                                    <li key={event.id} className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md">
                                        <p className="font-bold text-indigo-600 dark:text-indigo-400">{event.eventName}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-300">Cliente: {clientMap.get(event.clientId) || 'N/A'}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-300">Lugar: {event.location}</p>
                                        <div className="text-xs mt-2 flex justify-between">
                                            <span className="text-green-600 dark:text-green-400">Ingreso: {formatCurrency(event.amountCharged)}</span>
                                            <span className={`font-semibold ${profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>Ganancia: {formatCurrency(profit)}</span>
                                        </div>
                                    </li>
                               );
                           })}
                        </ul>
                    ) : (
                        <p className="text-center text-gray-500 dark:text-gray-400 mt-10">No hay eventos para este día.</p>
                    )}
                 </div>
            </div>
        </div>
    );
};

export default CalendarView;
