import React, { useState, useMemo, useRef } from 'react';
import type { Event, Client } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ReportGeneratorProps {
  events: Event[];
  clients: Client[];
}

const ReportGenerator: React.FC<ReportGeneratorProps> = ({ events, clients }) => {
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const todayISO = today.toISOString().split('T')[0];
  
  const [filter, setFilter] = useState({ startDate: firstDayOfMonth, endDate: todayISO });
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c.name])), [clients]);

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      const startDate = filter.startDate ? new Date(filter.startDate) : null;
      const endDate = filter.endDate ? new Date(filter.endDate) : null;
      if(startDate) startDate.setHours(0,0,0,0);
      if(endDate) endDate.setHours(23,59,59,999);

      if (startDate && eventDate < startDate) return false;
      if (endDate && eventDate > endDate) return false;
      return true;
    }).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events, filter]);
  
  const formatCurrency = (value: number) => `Gs. ${Math.round(value).toLocaleString('es-PY')}`;

  const summary = useMemo(() => {
    const totalCharged = filteredEvents.reduce((sum, event) => sum + event.amountCharged, 0);
    const totalExpenses = filteredEvents.reduce((sum, event) => sum + event.expenses.reduce((s, e) => s + e.amount, 0), 0);
    const netProfit = totalCharged - totalExpenses;
    return {
      eventCount: filteredEvents.length,
      totalCharged,
      totalExpenses,
      netProfit,
    };
  }, [filteredEvents]);

  const topStats = useMemo(() => {
    const clientFrequency = new Map<string, number>();
    filteredEvents.forEach(e => {
        clientFrequency.set(e.clientId, (clientFrequency.get(e.clientId) || 0) + 1);
    });
    const topClients = Array.from(clientFrequency.entries())
        .sort((a,b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id, count]) => ({name: clientMap.get(id) || 'N/A', count}));

    const topEvents = filteredEvents
        .map(e => ({
            name: e.eventName,
            profit: e.amountCharged - e.expenses.reduce((s, ex) => s + ex.amount, 0)
        }))
        .sort((a, b) => b.profit - a.profit)
        .slice(0, 5);

    return { topClients, topEvents };
  }, [filteredEvents, clientMap]);

  
  const getReportTitle = () => {
    const start = new Date(filter.startDate).toLocaleDateString('es-ES', { timeZone: 'UTC' });
    const end = new Date(filter.endDate).toLocaleDateString('es-ES', { timeZone: 'UTC' });
    return `Reporte del ${start} al ${end}`;
  };

  const exportToPDF = async () => {
    if (!printRef.current) return;
    setIsGeneratingPDF(true);

    const canvas = await html2canvas(printRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const ratio = canvasWidth / canvasHeight;
    const width = pdfWidth - 40; // with margin
    const height = width / ratio;

    pdf.addImage(imgData, 'PNG', 20, 20, width, height);
    pdf.save(`Reporte_GestionSystemDj_${filter.startDate}_${filter.endDate}.pdf`);

    setIsGeneratingPDF(false);
  };
  
  return (
    <>
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Generar Reportes</h2>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col sm:flex-row gap-6 items-center">
            <div className="flex items-center gap-2">
                <label className="text-gray-700 dark:text-gray-300">Desde:</label>
                <input type="date" value={filter.startDate} onChange={e => setFilter({...filter, startDate: e.target.value})} className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md p-2 text-gray-900 dark:text-white"/>
            </div>
             <div className="flex items-center gap-2">
                <label className="text-gray-700 dark:text-gray-300">Hasta:</label>
                <input type="date" value={filter.endDate} onChange={e => setFilter({...filter, endDate: e.target.value})} className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md p-2 text-gray-900 dark:text-white"/>
            </div>
            <div className="flex-grow"></div>
            <div className="flex gap-4">
                 <button onClick={exportToPDF} disabled={isGeneratingPDF} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-red-400">
                  {isGeneratingPDF ? 'Generando...' : 'Exportar a PDF'}
                 </button>
            </div>
        </div>
      </div>
      
      {/* Off-screen Printable Report Area for PDF generation */}
      <div className="absolute -left-[9999px] top-auto" aria-hidden="true">
        <div ref={printRef} className="bg-white text-black p-10 font-sans" style={{width: '800px'}}>
            {/* PDF Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #e5e7eb', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <div style={{display: 'flex', alignItems: 'center'}}>
                     <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 18V5H5V18H9ZM19 18V5H15V18H19ZM14 18V12H10V18H14Z" fill="#4f46e5"/>
                    </svg>
                    <h1 style={{fontSize: '2rem', fontWeight: 'bold', marginLeft: '0.5rem'}}>GestionSystem<span style={{color: '#6366f1'}}>Dj</span></h1>
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#374151' }}>Reporte Financiero</h2>
            </div>
            <p style={{fontSize: '1.125rem', marginBottom: '2rem', color: '#4b5563'}}>Período: {new Date(filter.startDate).toLocaleDateString('es-ES', { timeZone: 'UTC' })} - {new Date(filter.endDate).toLocaleDateString('es-ES', { timeZone: 'UTC' })}</p>

            {/* PDF Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem', fontSize: '0.875rem' }}>
                 <div style={{ border: '1px solid #e5e7eb', padding: '1rem', borderRadius: '0.5rem' }}>
                    <h4 style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: '0.5rem' }}>Resumen</h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#4b5563' }}>
                        <li><strong>Eventos:</strong> {summary.eventCount}</li>
                        <li><strong>Ingresos:</strong> {formatCurrency(summary.totalCharged)}</li>
                        <li><strong>Gastos:</strong> {formatCurrency(summary.totalExpenses)}</li>
                        <li style={{ fontWeight: 'bold', marginTop: '0.25rem', paddingTop: '0.25rem', borderTop: '1px solid #e5e7eb', color: '#111827' }}><strong>Ganancia:</strong> {formatCurrency(summary.netProfit)}</li>
                    </ul>
                </div>
                <div style={{ border: '1px solid #e5e7eb', padding: '1rem', borderRadius: '0.5rem' }}>
                    <h4 style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: '0.5rem' }}>Top Clientes</h4>
                    <ol style={{ paddingLeft: '1.2rem', margin: 0 }}>
                        {topStats.topClients.map(c => <li key={c.name}><strong>{c.name}</strong> ({c.count} eventos)</li>)}
                    </ol>
                </div>
                <div style={{ border: '1px solid #e5e7eb', padding: '1rem', borderRadius: '0.5rem' }}>
                    <h4 style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: '0.5rem' }}>Top Eventos</h4>
                    <ol style={{ paddingLeft: '1.2rem', margin: 0 }}>
                        {topStats.topEvents.map(e => <li key={e.name}><strong>{e.name}</strong> ({formatCurrency(e.profit)})</li>)}
                    </ol>
                </div>
            </div>

            {/* PDF Table */}
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Detalles de Eventos</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
                    <tr style={{ backgroundColor: '#f3f4f6' }}>
                        <th style={{ border: '1px solid #d1d5db', padding: '0.5rem', textAlign: 'left' }}>Fecha</th>
                        <th style={{ border: '1px solid #d1d5db', padding: '0.5rem', textAlign: 'left' }}>Evento</th>
                        <th style={{ border: '1px solid #d1d5db', padding: '0.5rem', textAlign: 'left' }}>Cliente</th>
                        <th style={{ border: '1px solid #d1d5db', padding: '0.5rem', textAlign: 'right' }}>Ingresos</th>
                        <th style={{ border: '1px solid #d1d5db', padding: '0.5rem', textAlign: 'right' }}>Gastos</th>
                        <th style={{ border: '1px solid #d1d5db', padding: '0.5rem', textAlign: 'right' }}>Ganancia</th>
                    </tr>
                </thead>
                <tbody>
                {filteredEvents.map(event => {
                    const totalExpenses = event.expenses.reduce((s, e) => s + e.amount, 0);
                    const profit = event.amountCharged - totalExpenses;
                    return (
                        <tr key={event.id} style={{borderBottom: '1px solid #e5e7eb'}}>
                            <td style={{ border: '1px solid #d1d5db', padding: '0.5rem' }}>{new Date(event.date).toLocaleDateString('es-ES', { timeZone: 'UTC' })}</td>
                            <td style={{ border: '1px solid #d1d5db', padding: '0.5rem' }}>{event.eventName}</td>
                            <td style={{ border: '1px solid #d1d5db', padding: '0.5rem' }}>{clientMap.get(event.clientId)}</td>
                            <td style={{ border: '1px solid #d1d5db', padding: '0.5rem', textAlign: 'right' }}>{formatCurrency(event.amountCharged)}</td>
                            <td style={{ border: '1px solid #d1d5db', padding: '0.5rem', textAlign: 'right' }}>-{formatCurrency(totalExpenses)}</td>
                            <td style={{ border: '1px solid #d1d5db', padding: '0.5rem', textAlign: 'right', fontWeight: '600' }}>{formatCurrency(profit)}</td>
                        </tr>
                    );
                })}
                </tbody>
            </table>
        </div>
      </div>
    </>
  );
};

export default ReportGenerator;