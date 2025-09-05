import React, { useState, useEffect, useCallback } from 'react';
import type { Event, View, Client, User } from './types';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import EventList from './components/EventList';
import ReportGenerator from './components/ReportGenerator';
import ClientList from './components/ClientList';
import CalendarView from './components/CalendarView';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import PasswordModal from './components/PasswordModal';

// 🔹 Detecta automáticamente la URL del backend
const getApiUrl = () => {
  if (window.location.hostname === 'localhost') {
    return 'http://localhost:3001/api'; // desarrollo local
  }
  return 'https://gestionsystemdj-backend.onrender.com/api'; // producción en GitHub Pages
};

const API_URL = getApiUrl();

const App: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [view, setView] = useState<View>('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('theme') as 'light' | 'dark') || 'dark');
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  useEffect(() => {
    document.documentElement.className = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  const fetchUserData = async (userId: string, userRole: string) => {
    try {
      if (userRole === 'admin') {
        const res = await fetch(`${API_URL}/users`);
        setUsers(await res.json());
      } else {
        const eventsRes = await fetch(`${API_URL}/events?userId=${userId}`);
        setEvents(await eventsRes.json());
        const clientsRes = await fetch(`${API_URL}/clients?userId=${userId}`);
        setClients(await clientsRes.json());
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const handleLogin = async (username: string, password?: string) => {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setAuthError(data.message || "Error al iniciar sesión.");
        return;
      }
      setAuthError(null);
      setCurrentUser(data.user);
      await fetchUserData(data.user.id, data.user.role);
      setView(data.user.role === 'admin' ? 'adminDashboard' : 'dashboard');
    } catch (error) {
      setAuthError("No se pudo conectar con el servidor.");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setEvents([]);
    setClients([]);
  };

  const addEvent = useCallback(async (event: Omit<Event, 'id'>) => {
    if (!currentUser) return;
    const res = await fetch(`${API_URL}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...event, user_id: currentUser.id }),
    });
    if (res.ok) await fetchUserData(currentUser.id, currentUser.role);
  }, [currentUser]);

  const addClient = useCallback(async (client: Omit<Client, 'id'>) => {
    if (!currentUser) return;
    const res = await fetch(`${API_URL}/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...client, user_id: currentUser.id }),
    });
    if (res.ok) await fetchUserData(currentUser.id, currentUser.role);
  }, [currentUser]);

  const renderView = () => {
    if (!currentUser) return null;
    if (currentUser.role === 'admin') return <AdminDashboard users={users} onAddUser={() => {}} onUpdateUser={() => {}} />;
    switch (view) {
      case 'dashboard': return <Dashboard events={events} />;
      case 'events': return <EventList events={events} clients={clients} onAddEvent={addEvent} onUpdateEvent={() => {}} onDeleteEvent={() => {}} />;
      case 'clients': return <ClientList clients={clients} onAddClient={addClient} onUpdateClient={() => {}} onDeleteClient={() => {}} />;
      case 'calendar': return <CalendarView events={events} clients={clients} />;
      case 'reports': return <ReportGenerator events={events} clients={clients} />;
      default: return <Dashboard events={events} />;
    }
  };

  if (!currentUser) return <Login onLogin={handleLogin} error={authError} />;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-sans transition-colors duration-300">
      <Header
        user={currentUser}
        currentView={view}
        setView={setView}
        theme={theme}
        setTheme={setTheme}
        onExport={() => {
          const dataStr = JSON.stringify({ events, clients });
          const blob = new Blob([dataStr], { type: "application/json" });
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = `backup_${currentUser.username}.json`;
          link.click();
        }}
        onImport={() => alert('La importación debe manejarse a través del backend.')}
        onLogout={handleLogout}
        onOpenPasswordModal={() => setIsPasswordModalOpen(true)}
      />
      <main className="p-4 sm:p-6 md:p-8">{renderView()}</main>
      {isPasswordModalOpen && <PasswordModal onSave={() => {}} onClose={() => setIsPasswordModalOpen(false)} />}
    </div>
  );
};

export default App;
