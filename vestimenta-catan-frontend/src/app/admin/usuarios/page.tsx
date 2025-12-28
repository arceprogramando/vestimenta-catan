'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Label } from '@/components/ui/label';
import { Loader2, Users, Shield } from 'lucide-react';
import { useRequireAdmin, useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/axios';
import { DataTable } from '@/components/ui/data-table';
import { createColumns, Usuario } from './columns';

const rolConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  superadmin: { label: 'Super Admin', variant: 'destructive' },
  admin: { label: 'Admin', variant: 'default' },
  empleado: { label: 'Empleado', variant: 'secondary' },
  user: { label: 'Usuario', variant: 'outline' },
};

export default function AdminUsuariosPage() {
  const { isAdmin, isHydrated } = useRequireAdmin();
  const { isSuperAdmin, user: currentUser } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const columns = createColumns({
    currentUserId: currentUser?.id,
    isSuperAdmin,
    emailsVisibles,
    toggleEmailVisible,
    onEdit: abrirModalEditar,
  });

  const filterableColumns = [
    {
      id: 'rol',
      title: 'Rol',
      options: [
        { label: 'Super Admin', value: 'superadmin' },
        { label: 'Admin', value: 'admin' },
        { label: 'Empleado', value: 'empleado' },
        { label: 'Usuario', value: 'user' },
      ],
    },
    {
      id: 'provider',
      title: 'Proveedor',
      options: [
        { label: 'Google', value: 'google' },
        { label: 'Local', value: 'local' },
      ],
    },
  ];

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

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle>Usuarios</CardTitle>
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
          ) : usuarios.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay usuarios</p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={usuarios}
              searchKey="nombre"
              searchPlaceholder="Buscar por nombre o email..."
              filterableColumns={filterableColumns}
            />
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
