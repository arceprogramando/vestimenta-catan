'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Ruler, AlertTriangle } from 'lucide-react';
import { useRequireAdmin } from '@/hooks/use-auth';
import { api } from '@/lib/axios';
import { DataTable } from '@/components/ui/data-table';
import { createColumns } from './columns';
import { Talle } from '@/types/admin';

export default function AdminTallesPage() {
  const { isAdmin, isHydrated } = useRequireAdmin();
  const [talles, setTalles] = useState<Talle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [talleEditar, setTalleEditar] = useState<Talle | null>(null);
  const [talleEliminar, setTalleEliminar] = useState<Talle | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [formData, setFormData] = useState({ nombre: '', orden: '' });

  const fetchTalles = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get<Talle[]>('/talles');
      setTalles(response.data);
      setError(null);
    } catch (err) {
      setError('Error al cargar los talles');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin && isHydrated) {
      fetchTalles();
    }
  }, [isAdmin, isHydrated, fetchTalles]);

  const abrirModalCrear = () => {
    setTalleEditar(null);
    setFormData({ nombre: '', orden: '' });
    setModalOpen(true);
  };

  const abrirModalEditar = (talle: Talle) => {
    setTalleEditar(talle);
    setFormData({
      nombre: talle.nombre,
      orden: talle.orden?.toString() || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.nombre.trim()) return;

    setProcesando(true);
    try {
      const payload = {
        nombre: formData.nombre.trim(),
        orden: formData.orden ? parseInt(formData.orden) : null,
      };

      if (talleEditar) {
        await api.patch(`/talles/${talleEditar.id}`, payload);
      } else {
        await api.post('/talles', payload);
      }
      setModalOpen(false);
      fetchTalles();
    } catch (err) {
      console.error('Error al guardar talle:', err);
    } finally {
      setProcesando(false);
    }
  };

  const handleEliminar = async () => {
    if (!talleEliminar) return;

    setProcesando(true);
    try {
      await api.delete(`/talles/${talleEliminar.id}`);
      setDeleteModalOpen(false);
      setTalleEliminar(null);
      fetchTalles();
    } catch (err) {
      console.error('Error al eliminar talle:', err);
    } finally {
      setProcesando(false);
    }
  };

  const columns = useMemo(() => createColumns({
    onEdit: abrirModalEditar,
    onDelete: (talle) => {
      setTalleEliminar(talle);
      setDeleteModalOpen(true);
    },
  }), []);

  // Ordenar por campo orden
  const tallesOrdenados = useMemo(() => {
    return [...talles].sort((a, b) => {
      if (a.orden === null && b.orden === null) return 0;
      if (a.orden === null) return 1;
      if (b.orden === null) return -1;
      return a.orden - b.orden;
    });
  }, [talles]);

  if (!isHydrated || !isAdmin) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gestion de Talles</h1>
          <p className="text-muted-foreground">Administra los talles disponibles</p>
        </div>
        <Button onClick={abrirModalCrear}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Talle
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Talles</CardTitle>
          <CardDescription>Lista de talles para las variantes de productos</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={fetchTalles}>Reintentar</Button>
            </div>
          ) : talles.length === 0 ? (
            <div className="text-center py-12">
              <Ruler className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay talles registrados</p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={tallesOrdenados}
              searchKey="nombre"
              searchPlaceholder="Buscar talle..."
            />
          )}
        </CardContent>
      </Card>

      {/* Modal Crear/Editar */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{talleEditar ? 'Editar Talle' : 'Nuevo Talle'}</DialogTitle>
            <DialogDescription>
              {talleEditar ? 'Modifica los datos del talle' : 'Ingresa los datos del nuevo talle'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: S, M, L, XL, 38, 40..."
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orden">Orden (para ordenar en listas)</Label>
              <Input
                id="orden"
                type="number"
                value={formData.orden}
                onChange={(e) => setFormData({ ...formData, orden: e.target.value })}
                placeholder="Ej: 1, 2, 3..."
              />
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
            <Button onClick={handleSubmit} disabled={procesando || !formData.nombre.trim()}>
              {procesando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {talleEditar ? 'Guardar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Eliminar */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Eliminar Talle
            </DialogTitle>
            <DialogDescription>
              Esta accion eliminara el talle &quot;{talleEliminar?.nombre}&quot;.
              Si hay variantes usando este talle, no se podra eliminar.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
              disabled={procesando}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleEliminar} disabled={procesando}>
              {procesando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
