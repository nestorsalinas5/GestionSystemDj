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

const App: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const [events, setEvents] = useState<Event[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [view, setView] = useState<View>('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('GestionSystemDjTheme') as 'light' | 'dark') || 'dark';
  });
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // --- Theme and Users Initialization ---
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('GestionSystemDjTheme', theme);
  }, [theme]);

  useEffect(() => {
    try {
      const storedUsers = localStorage.getItem('GestionSystemDjUsers');
      if (storedUsers) {
        setUsers(JSON.parse(storedUsers));
      } else {
        // First time setup: create admin user
        const adminId = crypto.randomUUID();
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 3650); // Valid for 10 years
        const adminUser: User = {
          id: adminId,
          username: 'admin',
          password: 'admin', // In a real app, this MUST be hashed.
          role: 'admin',
          activeUntil: tomorrow.toISOString(),
          isActive: true,
          subscriptionTier: 'Admin',
        };
        setUsers([adminUser]);
        localStorage.setItem('GestionSystemDjUsers', JSON.stringify([adminUser]));
      }
    } catch (error) {
      console.error("Failed to initialize users", error);
    }
  }, []);

  // --- Auth and Data Management ---
  const handleLogin = (username: string, password?: string) => {
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) {
      setAuthError("Usuario o contraseña incorrectos.");
      return;
    }
    
    if (!user.isActive) {
      setAuthError("Su cuenta ha sido desactivada. Contacte al administrador.");
      return;
    }

    const now = new Date();
    const activeUntil = new Date(user.activeUntil);
    if (now > activeUntil) {
      setAuthError("Su suscripción ha expirado. Contacte al administrador.");
      return;
    }

    setAuthError(null);
    setCurrentUser(user);
    
    // Load user-specific data
    try {
      const storedData = localStorage.getItem(`GestionSystemDjData_${user.id}`);
      if (storedData) {
        const { events: userEvents, clients: userClients } = JSON.parse(storedData);
        setEvents(userEvents || []);
        setClients(userClients || []);
      } else {
        setEvents([]);
        setClients([]);
      }
    } catch (error) {
      console.error("Failed to parse user data from localStorage", error);
      setEvents([]);
      setClients([]);
    }

    setView(user.role === 'admin' ? 'adminDashboard' : 'dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setEvents([]);
    setClients([]);
  };
  
  const updateUserData = (data: { events: Event[]; clients: Client[] }) => {
    if (!currentUser) return;
    try {
      localStorage.setItem(`GestionSystemDjData_${currentUser.id}`, JSON.stringify(data));
    } catch (error) {
      console.error("Failed to save user data to localStorage", error);
    }
  };

  // --- User Management (Admin) ---
  const addUser = (user: Omit<User, 'id'>) => {
    setUsers(prevUsers => {
      const newUser = { ...user, id: crypto.randomUUID() };
      const updatedUsers = [...prevUsers, newUser];
      localStorage.setItem('GestionSystemDjUsers', JSON.stringify(updatedUsers));
      return updatedUsers;
    });
  };

  const updateUser = (updatedUser: Partial<User> & { id: string }) => {
     setUsers(prevUsers => {
      const updatedUsers = prevUsers.map(u => u.id === updatedUser.id ? { ...u, ...updatedUser } : u);
      localStorage.setItem('GestionSystemDjUsers', JSON.stringify(updatedUsers));
      return updatedUsers;
    });
  };
  
  const handleChangePassword = (password: string) => {
    if (currentUser) {
      updateUser({ id: currentUser.id, password });
      setIsPasswordModalOpen(false);
      alert("Contraseña actualizada con éxito.");
    }
  };

  // --- Event handlers ---
  const addEvent = useCallback((event: Omit<Event, 'id'>) => {
    setEvents(prevEvents => {
      const newEvent = { ...event, id: crypto.randomUUID() };
      const updatedEvents = [...prevEvents, newEvent].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      updateUserData({ events: updatedEvents, clients });
      return updatedEvents;
    });
  }, [clients, currentUser]);

  const updateEvent = useCallback((updatedEvent: Event) => {
    setEvents(prevEvents => {
      const updatedEvents = prevEvents.map(event =>
        event.id === updatedEvent.id ? updatedEvent : event
      ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      updateUserData({ events: updatedEvents, clients });
      return updatedEvents;
    });
  }, [clients, currentUser]);

  const deleteEvent = useCallback((eventId: string) => {
    setEvents(prevEvents => {
      const updatedEvents = prevEvents.filter(event => event.id !== eventId);
      updateUserData({ events: updatedEvents, clients });
      return updatedEvents;
    });
  }, [clients, currentUser]);

  // --- Client handlers ---
  const addClient = useCallback((client: Omit<Client, 'id'>) => {
    setClients(prevClients => {
      const newClient = { ...client, id: crypto.randomUUID() };
      const updatedClients = [...prevClients, newClient];
      updateUserData({ events, clients: updatedClients });
      return updatedClients;
    });
  }, [events, currentUser]);
  
  const updateClient = useCallback((updatedClient: Client) => {
    setClients(prevClients => {
      const updatedClients = prevClients.map(c => c.id === updatedClient.id ? updatedClient : c);
      updateUserData({ events, clients: updatedClients });
      return updatedClients;
    });
  }, [events, currentUser]);

  const deleteClient = useCallback((clientId: string) => {
    if (events.some(e => e.clientId === clientId)) {
        alert("No se puede eliminar un cliente que está asociado a uno o más eventos.");
        return;
    }
    setClients(prevClients => {
      const updatedClients = prevClients.filter(c => c.id !== clientId);
      updateUserData({ events, clients: updatedClients });
      return updatedClients;
    });
  }, [events, currentUser]);

  // --- Data Import/Export ---
  const handleExportData = () => {
    if (!currentUser) return;
    const dataStr = JSON.stringify({ events, clients });
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `GestionSystemDj_${currentUser.username}_Backup_${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
        fileReader.readAsText(e.target.files[0], "UTF-8");
        fileReader.onload = e => {
            try {
                const importedData = JSON.parse(e.target?.result as string);
                if (importedData.events && importedData.clients) {
                    setEvents(importedData.events);
                    setClients(importedData.clients);
                    updateUserData(importedData);
                    alert("Datos importados con éxito!");
                } else {
                    alert("El archivo no tiene el formato correcto.");
                }
            } catch (error) {
                alert("Error al leer el archivo de importación.");
                console.error(error);
            }
        };
    }
  };

  const renderView = () => {
    if (!currentUser) return null;
    if (currentUser.role === 'admin') {
       return <AdminDashboard users={users.filter(u => u.role !== 'admin')} onAddUser={addUser} onUpdateUser={updateUser} />;
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
        onImport={handleImportData}
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