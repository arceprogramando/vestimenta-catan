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
import { Loader2, Plus, Palette, AlertTriangle } from 'lucide-react';
import { useRequireAdmin } from '@/hooks/use-auth';
import { api } from '@/lib/axios';
import { DataTable } from '@/components/ui/data-table';
import { createColumns } from './columns';
import { Color } from '@/types/admin';

export default function AdminColoresPage() {
  const { isAdmin, isHydrated } = useRequireAdmin();
  const [colores, setColores] = useState<Color[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [colorEditar, setColorEditar] = useState<Color | null>(null);
  const [colorEliminar, setColorEliminar] = useState<Color | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [nombre, setNombre] = useState('');

  const fetchColores = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get<Color[]>('/colores');
      setColores(response.data);
      setError(null);
    } catch (err) {
      setError('Error al cargar los colores');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin && isHydrated) {
      fetchColores();
    }
  }, [isAdmin, isHydrated, fetchColores]);

  const abrirModalCrear = () => {
    setColorEditar(null);
    setNombre('');
    setModalOpen(true);
  };

  const abrirModalEditar = (color: Color) => {
    setColorEditar(color);
    setNombre(color.nombre);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!nombre.trim()) return;

    setProcesando(true);
    try {
      if (colorEditar) {
        await api.patch(`/colores/${colorEditar.id}`, { nombre: nombre.trim() });
      } else {
        await api.post('/colores', { nombre: nombre.trim() });
      }
      setModalOpen(false);
      fetchColores();
    } catch (err) {
      console.error('Error al guardar color:', err);
    } finally {
      setProcesando(false);
    }
  };

  const handleEliminar = async () => {
    if (!colorEliminar) return;

    setProcesando(true);
    try {
      await api.delete(`/colores/${colorEliminar.id}`);
      setDeleteModalOpen(false);
      setColorEliminar(null);
      fetchColores();
    } catch (err) {
      console.error('Error al eliminar color:', err);
    } finally {
      setProcesando(false);
    }
  };

  const columns = useMemo(() => createColumns({
    onEdit: abrirModalEditar,
    onDelete: (color) => {
      setColorEliminar(color);
      setDeleteModalOpen(true);
    },
  }), []);

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
          <h1 className="text-2xl font-bold">Gestion de Colores</h1>
          <p className="text-muted-foreground">Administra los colores disponibles</p>
        </div>
        <Button onClick={abrirModalCrear}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Color
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Colores</CardTitle>
          <CardDescription>Lista de colores para las variantes de productos</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={fetchColores}>Reintentar</Button>
            </div>
          ) : colores.length === 0 ? (
            <div className="text-center py-12">
              <Palette className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay colores registrados</p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={colores}
              searchKey="nombre"
              searchPlaceholder="Buscar color..."
            />
          )}
        </CardContent>
      </Card>

      {/* Modal Crear/Editar */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{colorEditar ? 'Editar Color' : 'Nuevo Color'}</DialogTitle>
            <DialogDescription>
              {colorEditar ? 'Modifica el nombre del color' : 'Ingresa el nombre del nuevo color'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Azul, Rojo, Negro..."
                autoFocus
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
            <Button onClick={handleSubmit} disabled={procesando || !nombre.trim()}>
              {procesando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {colorEditar ? 'Guardar' : 'Crear'}
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
              Eliminar Color
            </DialogTitle>
            <DialogDescription>
              Esta accion eliminara el color &quot;{colorEliminar?.nombre}&quot;.
              Si hay variantes usando este color, no se podra eliminar.
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
