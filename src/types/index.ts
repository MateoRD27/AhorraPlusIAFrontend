// types/index.ts

// 
// API RESPONSE TYPES
// 
export interface ApiResponse<T> {
  success?: boolean;
  data: T;
  message?: string;
  status?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 
// USER TYPES
// 
export interface User {
  id: string | number;
  name: string;
  email: string;
  role?: 'user' | 'admin';
  joinDate?: string;
  status?: 'Activo' | 'Inactivo' | 'Suspendido';
  plan?: 'Free' | 'Premium' | 'Enterprise';
  totalTransactions?: number;
  balance?: number;
  lastActivity?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

// 
// INCOME TYPES
// 
export interface Income {
  idIncome: number;
  amount: number;
  date: string; // LocalDate -> YYYY-MM-DD
  source: string;
  description?: string;
  creationDate?: string;
  modificationDate?: string;
}

// DTO para crear/actualizar ingresos
export interface IncomeDTO {
  amount: number;
  date: string;
  source: string;
  description?: string;
}

// 
// EXPENSE TYPES
// 
export enum PaymentMethod {
  EFECTIVO = 'EFECTIVO',
  TRANSFERENCIA = 'TRANSFERENCIA',
  TARJETA_CREDITO = 'TARJETA_CREDITO',
  TARJETA_DEBITO = 'TARJETA_DEBITO'
}

export interface Expense {
  idExpense: number;
  amount: number;
  date: string;
  method: PaymentMethod | string;
  description?: string;
  anomalous: boolean;
  overlimit: boolean;
  creationDate?: string;
  modificationDate?: string;
}

// DTO para crear/actualizar gastos
export interface ExpenseDTO {
  amount: number;
  date: string;
  method: string;
  description?: string;
}

// 
// TRANSACTION TYPES (UNION)
// 
export type Transaction = 
  | (Income & { type: 'income' }) 
  | (Expense & { type: 'expense' });

// 
// RECOMMENDATION TYPES
// 
export enum RecommendationStatus {
  SUGERIDA = 'SUGERIDA',
  ACEPTADA = 'ACEPTADA',
  RECHAZADA = 'RECHAZADA',
  COMPLETADA = 'COMPLETADA'
}

export interface RecommendationDTO {
  id: number;
  userId?: number;
  message?: string;
  content?: string;
  estado?: string;
  status?: RecommendationStatus;
  fechaCreacion?: string;
  creationDate?: string;
  modificationDate?: string;
  fueUtil?: boolean | null;
}

// 
// SAVINGS GOAL TYPES
// 
// Actualizamos la interfaz para que coincida con tu Backend (SavingGoalDTO)
export interface SavingsGoal {
  idGoal: number; // El backend usa 'idGoal', no 'id'
  name: string;
  targetAmount: number;
  currentAmount: number;
  startDate?: string; 
  endDate: string;    
  priority: 'HIGH' | 'MEDIUM' | 'LOW'; 
  frequency?: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'ANNUALLY';
  status?: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELED' | 'EXPIRED';
  
  // Campos visuales que el backend NO tiene (los manejaremos en el front)
  icon?: string; 
  color?: string;
}

// 
// SUPPORT TICKET TYPES
// 
export interface TicketResponse {
  author: string;
  message: string;
  date: string;
  isAdmin: boolean;
}

export interface Ticket {
  id: number;
  userId?: string;
  userName?: string;
  type: string;
  subject: string;
  description?: string;
  status: 'Pendiente' | 'En proceso' | 'Resuelto';
  priority?: 'Baja' | 'Media' | 'Alta';
  date: string;
  responses?: TicketResponse[];
}

// 
// DASHBOARD & STATISTICS TYPES
// 
export interface DashboardStats {
  // Financiero
  totalBalance?: number;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  savingsRate?: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsGoals?: number;
  
  // Cambios porcentuales
  incomeChange?: number;
  expenseChange?: number;
}

export interface AdminStats {
  totalUsers: number;
  activeTickets: number;
  monthlyRevenue: number;
  dailyActivity: number;
  pendingTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
}

// 
// CHART DATA TYPES
// 
export interface ChartData {
  month?: string;
  day?: string;
  date?: string;
  income?: number;
  expenses?: number;
  amount?: number;
  category?: string;
  value?: number;
  name?: string;
}

// 
// UTILITY TYPES
// 
export interface DateRange {
  start: string;
  end: string;
}

export interface FilterOptions {
  dateRange?: DateRange;
  category?: string;
  method?: PaymentMethod | string;
  minAmount?: number;
  maxAmount?: number;
}

// 
// FORM TYPES
// 
export interface IncomeFormData {
  amount: string;
  source: string;
  date: string;
  description: string;
}

export interface ExpenseFormData {
  amount: string;
  method: string;
  date: string;
  description: string;
}