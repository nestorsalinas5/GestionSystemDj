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

// URL de tu backend.
const API_URL = 'http://localhost:3001/api';

const App: React.FC = () => {
  // El estado ahora se inicializa vacío, el backend es la fuente de verdad.
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

  // --- Función para obtener todos los datos del usuario logueado ---
  const fetchUserData = async (userId: string, userRole: string) => {
    try {
      if (userRole === 'admin') {
        const usersResponse = await fetch(`${API_URL}/users`);
        setUsers(await usersResponse.json());
      } else {
        const eventsResponse = await fetch(`${API_URL}/events?userId=${userId}`);
        setEvents(await eventsResponse.json());
        const clientsResponse = await fetch(`${API_URL}/clients?userId=${userId}`);
        setClients(await clientsResponse.json());
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  // --- Auth y Data Management ---
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

  // --- User Management (Admin) ---
  const addUser = async (user: Omit<User, 'id'>) => {
    // Lógica para llamar al backend y añadir usuario, luego actualizar el estado
  };
  const updateUser = async (updatedUser: Partial<User> & { id: string }) => {
    // Lógica para llamar al backend y actualizar usuario
  };
  const handleChangePassword = (password: string) => {
    // Lógica para llamar al backend y cambiar la contraseña
  };

  // --- Event handlers ---
  const addEvent = useCallback(async (event: Omit<Event, 'id'>) => {
    if (!currentUser) return;
    const response = await fetch(`${API_URL}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...event, user_id: currentUser.id })
    });
    if (response.ok) {
        await fetchUserData(currentUser.id, currentUser.role); // Recargamos los datos
    }
  }, [currentUser]);

  const updateEvent = useCallback(async (updatedEvent: Event) => {
    // Lógica para llamar a la API y actualizar el evento
  }, [currentUser]);

  const deleteEvent = useCallback(async (eventId: string) => {
    // Lógica para llamar a la API y borrar el evento
  }, [currentUser]);

  // --- Client handlers ---
  const addClient = useCallback(async (client: Omit<Client, 'id'>) => {
    if (!currentUser) return;
     const response = await fetch(`${API_URL}/clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...client, user_id: currentUser.id })
    });
    if (response.ok) {
        await fetchUserData(currentUser.id, currentUser.role); // Recargamos los datos
    }
  }, [currentUser]);

  const updateClient = useCallback(async (updatedClient: Client) => {
    // Lógica para llamar a la API y actualizar el cliente
  }, [currentUser]);

  const deleteClient = useCallback(async (clientId: string) => {
    // Lógica para llamar a la API y borrar el cliente
  }, [currentUser, events]);
  
  // El import/export ahora debería ser una función del backend,
  // pero mantenemos la lógica por si se quiere un backup local.
  const handleExportData = () => {
    const dataStr = JSON.stringify({ events, clients });
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `backup_${currentUser?.username}.json`;
    link.click();
  };

  const renderView = () => {
    if (!currentUser) return null;
    if (currentUser.role === 'admin') {
      return <AdminDashboard users={users} onAddUser={addUser} onUpdateUser={updateUser} />;
    }
    switch (view) {
      case 'dashboard': return <Dashboard events={events} />;
      case 'events': return <EventList events={events} clients={clients} onAddEvent={addEvent} onUpdateEvent={updateEvent} onDeleteEvent={deleteEvent} />;
      case 'clients': return <ClientList clients={clients} onAddClient={addClient} onUpdateClient={updateClient} onDeleteClient={deleteClient} />;
      case 'calendar': return <CalendarView events={events} clients={clients} />;
      case 'reports': return <ReportGenerator events={events} clients={clients} />;
      default: return <Dashboard events={events} />;
    }
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} error={authError} />;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-sans transition-colors duration-300">
      <Header 
        user={currentUser}
        currentView={view} 
        setView={setView}
        theme={theme}
        setTheme={setTheme}
        onExport={handleExportData}
        onImport={() => alert('La importación debe manejarse a través del backend.')}
        onLogout={handleLogout}
        onOpenPasswordModal={() => setIsPasswordModalOpen(true)}
      />
      <main className="p-4 sm:p-6 md:p-8">
        {renderView()}
      </main>
      {isPasswordModalOpen && (
        <PasswordModal 
          onSave={handleChangePassword}
          onClose={() => setIsPasswordModalOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
