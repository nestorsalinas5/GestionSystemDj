export interface ExpenseItem {
  id: string;
  category: string;
  amount: number;
}

export interface Event {
  id: string;
  eventName: string;
  date: string; // ISO string format for consistency
  location: string;
  clientId: string; // Link to a client
  incomeCategory: string;
  amountCharged: number;
  expenses: ExpenseItem[];
  notes?: string;
}

export interface Client {
  id:string;
  name: string;
  phone?: string;
  email?: string;
}

export interface User {
  id: string;
  username: string;
  password?: string; // Should be hashed in a real app
  role: 'admin' | 'user';
  activeUntil: string; // ISO date string
  isActive: boolean;
  lastPaymentAmount?: number;
  subscriptionTier?: string;
}

export type View = 'dashboard' | 'events' | 'clients' | 'calendar' | 'reports' | 'adminDashboard';

export const INCOME_CATEGORIES = ["Boda", "Evento Privado", "Evento Corporativo", "Discoteca/Club", "Festival", "Otro"];
export const EXPENSE_CATEGORIES = ["Transporte", "Alquiler de Equipo", "Marketing", "Música", "Comida y Bebida", "Alojamiento", "Asistentes", "Otro"];
export const SUBSCRIPTION_TIERS = ["Mensual", "Trimestral", "Anual", "Vitalicio"];