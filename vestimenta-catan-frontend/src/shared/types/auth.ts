export type UserRole = 'user' | 'empleado' | 'admin' | 'superadmin';

export interface User {
  id: number;
  email: string;
  nombre: string | null;
  apellido: string | null;
  rol: UserRole;
  rol_id?: number;
  permisos?: string[];
  created_at: string;
  provider?: string;
  avatar_url?: string | null;
}

export interface AuthResponse {
  expiresIn: number;
  tokenType: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  nombre?: string;
  apellido?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
