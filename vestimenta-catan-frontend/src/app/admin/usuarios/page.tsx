'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import {
  Loader2,
  Search,
  Edit,
  Users,
  Shield,
  Mail,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useRequireAdmin, useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/axios';

interface Usuario {
  id: number;
  email: string;
  nombre: string | null;
  apellido: string | null;
  rol: 'user' | 'empleado' | 'admin' | 'superadmin';
  provider: string;
  is_active: boolean;
  created_at: string;
}

const rolConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  superadmin: { label: 'Super Admin', variant: 'destructive' },
  admin: { label: 'Admin', variant: 'default' },
  empleado: { label: 'Empleado', variant: 'secondary' },
  user: { label: 'Usuario', variant: 'outline' },
};

// Funcion para ocultar parcialmente el email (modo streamer)
const maskEmail = (email: string): string => {
  const [local, domain] = email.split('@');
  if (!domain) return email;

  // Mostrar primera letra + asteriscos + ultima letra antes del @
  const maskedLocal = local.length <= 2
    ? local[0] + '*'
    : local[0] + '***' + local[local.length - 1];

  // Mostrar primera letra del dominio + asteriscos + extension
  const domainParts = domain.split('.');
  const domainName = domainParts[0];
  const extension = domainParts.slice(1).join('.');
  const maskedDomain = domainName[0] + '***.' + extension;

  return `${maskedLocal}@${maskedDomain}`;
};

export default function AdminUsuariosPage() {
  const { isAdmin, isHydrated } = useRequireAdmin();
  const { isSuperAdmin, user: currentUser } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState<string>('todos');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [usuarioEditar, setUsuarioEditar] = useState<Usuario | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [nuevoRol, setNuevoRol] = useState<string>('user');

  // Modo streamer - ocultar emails (por usuario individual)
  const [emailsVisibles, setEmailsVisibles] = useState<Set<number>>(new Set());

  const toggleEmailVisible = (userId: number) => {
    setEmailsVisibles((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const fetchUsuarios = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get<Usuario[]>('/usuarios');
      setUsuarios(response.data);
      setError(null);
    } catch (err) {
      setError('Error al cargar los usuarios');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin && isHydrated) {
      fetchUsuarios();
    }
  }, [isAdmin, isHydrated, fetchUsuarios]);

  const usuariosFiltrados = usuarios.filter((usuario) => {
    if (filtroRol !== 'todos' && usuario.rol !== filtroRol) {
      return false;
    }
    if (busqueda) {
      const searchLower = busqueda.toLowerCase();
      return (
        usuario.email.toLowerCase().includes(searchLower) ||
        usuario.nombre?.toLowerCase().includes(searchLower) ||
        usuario.apellido?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const abrirModalEditar = (usuario: Usuario) => {
    setUsuarioEditar(usuario);
    setNuevoRol(usuario.rol);
    setModalOpen(true);
  };

  const handleCambiarRol = async () => {
    if (!usuarioEditar) return;

    setProcesando(true);
    try {
      await api.patch(`/usuarios/${usuarioEditar.id}`, { rol: nuevoRol });
      setModalOpen(false);
      fetchUsuarios();
    } catch (err) {
      console.error('Error al cambiar rol:', err);
    } finally {
      setProcesando(false);
    }
  };

  if (!isHydrated || !isAdmin) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Stats
  const admins = usuarios.filter((u) => u.rol === 'admin' || u.rol === 'superadmin').length;
  const empleados = usuarios.filter((u) => u.rol === 'empleado').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gestion de Usuarios</h1>
          <p className="text-muted-foreground">Administra los usuarios y sus roles</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Usuarios</CardDescription>
            <CardTitle className="text-3xl">{usuarios.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Administradores</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{admins}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Empleados</CardDescription>
            <CardTitle className="text-3xl text-green-600">{empleados}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por email o nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filtroRol} onValueChange={setFiltroRol}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="superadmin">Super Admin</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="empleado">Empleado</SelectItem>
            <SelectItem value="user">Usuario</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle>Usuarios ({usuariosFiltrados.length})</CardTitle>
          <CardDescription>Lista de usuarios registrados</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={fetchUsuarios}>Reintentar</Button>
            </div>
          ) : usuariosFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay usuarios</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usuariosFiltrados.map((usuario) => {
                    const config = rolConfig[usuario.rol] || rolConfig.user;
                    const esUsuarioActual = currentUser?.id === usuario.id;
                    const puedeEditar = isSuperAdmin && !esUsuarioActual;

                    return (
                      <TableRow key={usuario.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                              <span className="text-sm font-medium">
                                {(usuario.nombre?.[0] || usuario.email[0]).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">
                                {usuario.nombre || usuario.apellido
                                  ? `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim()
                                  : 'Sin nombre'}
                              </p>
                              {esUsuarioActual && (
                                <span className="text-xs text-muted-foreground">(Tu)</span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 shrink-0"
                              onClick={() => toggleEmailVisible(usuario.id)}
                              title={emailsVisibles.has(usuario.id) ? 'Ocultar email' : 'Mostrar email'}
                            >
                              {emailsVisibles.has(usuario.id) ? (
                                <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                              ) : (
                                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                            </Button>
                            <span className="text-sm font-mono w-48 inline-block overflow-hidden text-ellipsis whitespace-nowrap">
                              {emailsVisibles.has(usuario.id) ? usuario.email : maskEmail(usuario.email)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {usuario.provider}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={config.variant}>{config.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {puedeEditar ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => abrirModalEditar(usuario)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Cambiar rol
                            </Button>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              {esUsuarioActual ? 'No puedes editarte' : 'Sin permisos'}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Cambiar Rol */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Cambiar Rol
            </DialogTitle>
            <DialogDescription>
              Cambia el rol de {usuarioEditar?.nombre || usuarioEditar?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Rol actual</Label>
              <Badge variant={rolConfig[usuarioEditar?.rol || 'user'].variant}>
                {rolConfig[usuarioEditar?.rol || 'user'].label}
              </Badge>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nuevoRol">Nuevo rol</Label>
              <Select value={nuevoRol} onValueChange={setNuevoRol}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuario</SelectItem>
                  <SelectItem value="empleado">Empleado</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="superadmin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              disabled={procesando}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCambiarRol}
              disabled={procesando || nuevoRol === usuarioEditar?.rol}
            >
              {procesando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
