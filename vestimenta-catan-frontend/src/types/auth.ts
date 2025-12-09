export interface User {
  id: number;
  email: string;
  nombre: string | null;
  apellido: string | null;
  rol: 'user' | 'admin';
  created_at: string;
  provider?: string;
  avatar_url?: string | null;
}

export interface AuthResponse {
  accessToken: string;
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
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
