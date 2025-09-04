import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import type { Event } from '../types';
import StatCard from './StatCard';
import { CashIcon, UsersIcon, CalendarIcon, TrendingUpIcon } from './icons';

interface DashboardProps {
  events: Event[];
}

const Dashboard: React.FC<DashboardProps> = ({ events }) => {
  const now = new Date();
  
  const formatCurrency = (value: number) => `Gs. ${Math.round(value).toLocaleString('es-PY')}`;

  const monthlyData = useMemo(() => {
    const data = new Map<string, { income: number, expense: number, count: number }>();
    events.forEach(event => {
        const eventDate = new Date(event.date);
        const monthKey = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}`;
        const current = data.get(monthKey) || { income: 0, expense: 0, count: 0 };
        const totalExpenses = event.expenses.reduce((sum, exp) => sum + exp.amount, 0);
        data.set(monthKey, {
            income: current.income + event.amountCharged,
            expense: current.expense + totalExpenses,
            count: current.count + 1,
        });
    });
    return data;
  }, [events]);
  
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() -1, 1);
  const lastMonthKey = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;
  
  const currentMonthStats = monthlyData.get(currentMonthKey) || { income: 0, expense: 0, count: 0 };
  const lastMonthStats = monthlyData.get(lastMonthKey) || { income: 0, expense: 0, count: 0 };

  const netProfit = currentMonthStats.income - currentMonthStats.expense;
  const lastMonthNetProfit = lastMonthStats.income - lastMonthStats.expense;

  const profitChange = lastMonthNetProfit !== 0 ? ((netProfit - lastMonthNetProfit) / Math.abs(lastMonthNetProfit)) * 100 : netProfit > 0 ? 100 : 0;

  const monthlyEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate.getFullYear() === now.getFullYear() && eventDate.getMonth() === now.getMonth();
  });

  const incomeByCategory = monthlyEvents.reduce((acc, event) => {
    acc[event.incomeCategory] = (acc[event.incomeCategory] || 0) + event.amountCharged;
    return acc;
  }, {} as Record<string, number>);

  const expenseByCategory = monthlyEvents.flatMap(e => e.expenses).reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);
  
  const incomePieData = Object.entries(incomeByCategory).map(([name, value]) => ({ name, value }));
  const expensePieData = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value }));
  
  const trendData = useMemo(() => {
    const data = [];
    for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const monthData = monthlyData.get(key) || { income: 0, expense: 0 };
        data.push({
            name: d.toLocaleString('es', { month: 'short', year: '2-digit'}),
            Ganancia: monthData.income - monthData.expense,
        });
    }
    return data;
  }, [monthlyData]);
  
  const COLORS = ['#4f46e5', '#8b5cf6', '#a78bfa', '#c4b5fd', '#6366f1'];
  const EXPENSE_COLORS = ['#ef4444', '#f87171', '#fca5a5', '#fecaca', '#dc2626'];

  // FIX: Add a check to see if dark mode is enabled to style the tooltip correctly.
  const isDarkMode = typeof window !== 'undefined' && document.documentElement.classList.contains('dark');


  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Panel Mensual ({now.toLocaleString('es', { month: 'long', year: 'numeric' })})</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Eventos del Mes" value={currentMonthStats.count} icon={<CalendarIcon />} />
        <StatCard title="Ingresos del Mes" value={formatCurrency(currentMonthStats.income)} icon={<CashIcon />} />
        <StatCard title="Gastos del Mes" value={formatCurrency(currentMonthStats.expense)} icon={<UsersIcon />} />
        <StatCard title="Ganancia Neta" value={formatCurrency(netProfit)} icon={<TrendingUpIcon />} 
          trend={{ value: profitChange, label: 'vs mes anterior' }}
          color={netProfit >= 0 ? 'text-green-500' : 'text-red-500'} />
      </div>

       <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Tendencia de Ganancias (Últimos 12 meses)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-gray-700" />
              <XAxis dataKey="name" tick={{ fill: 'currentColor' }} className="text-gray-600 dark:text-gray-400 text-xs" />
              <YAxis tickFormatter={(value) => new Intl.NumberFormat('es-PY').format(Number(value))} tick={{ fill: 'currentColor' }} className="text-gray-600 dark:text-gray-400 text-xs" />
              {/* FIX: The 'dark' property is not a valid CSS property and was causing a compilation error. Replaced with a check for the dark theme class on the root element to apply styles conditionally. */}
              <Tooltip
                contentStyle={{
                  backgroundColor: isDarkMode ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                  border: '1px solid #9ca3af',
                }}
                itemStyle={{ color: isDarkMode ? '#f3f4f6' : '#1f2937' }}
                labelStyle={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend />
              <Line type="monotone" dataKey="Ganancia" stroke="#4f46e5" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }}/>
            </LineChart>
          </ResponsiveContainer>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Ingresos por Categoría</h3>
          {incomePieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={incomePieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {incomePieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : ( <div className="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">No hay ingresos este mes.</div> )}
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Gastos por Categoría</h3>
          {expensePieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={expensePieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {expensePieData.map((entry, index) => <Cell key={`cell-${index}`} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : ( <div className="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">No hay gastos este mes.</div> )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;