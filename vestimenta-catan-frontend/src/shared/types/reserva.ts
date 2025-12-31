export type EstadoReserva = 'pendiente' | 'confirmado' | 'cancelado' | 'completado';

export interface ReservaProducto {
  id: number;
  nombre: string;
  descripcion: string | null;
  genero: string;
  thumbnail: string | null;
  precio: number | null;
}

export interface ReservaTalle {
  id: number;
  nombre: string;
  orden: number | null;
}

export interface ReservaColor {
  id: number;
  nombre: string;
}

export interface ReservaVariante {
  id: number;
  cantidad: number;
  producto: ReservaProducto | null;
  talle: ReservaTalle | null;
  color: ReservaColor | null;
}

export interface ReservaUsuario {
  id: number;
  email: string;
  nombre: string | null;
  apellido: string | null;
}

export interface Reserva {
  id: number;
  variante_id: number;
  usuario_id: number | null;
  cantidad: number;
  estado: EstadoReserva;
  fecha_reserva: string;
  notas: string | null;
  telefono_contacto: string | null;
  // Precios
  precio_unitario: number | null;
  precio_total: number | null;
  // Tracking de estados
  fecha_confirmacion: string | null;
  confirmado_por: string | null;
  fecha_cancelacion: string | null;
  cancelado_por: string | null;
  motivo_cancelacion: string | null;
  // Auditoría
  created_at: string;
  updated_at: string;
  is_active: boolean;
  // Relaciones
  variante: ReservaVariante | null;
  usuario: ReservaUsuario | null;
}

export interface CreateReservaDto {
  variante_id: number;
  cantidad: number;
  notas?: string;
  telefono_contacto?: string;
}

export interface UpdateReservaDto {
  variante_id?: number;
  cantidad?: number;
  estado?: EstadoReserva;
  notas?: string;
  telefono_contacto?: string;
  motivo_cancelacion?: string;
}
