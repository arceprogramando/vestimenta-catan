'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Package, AlertTriangle } from 'lucide-react';
import { useRequireAdmin } from '@/hooks/use-auth';
import { api } from '@/lib/axios';
import { DataTable } from '@/components/ui/data-table';
import { createColumns, Variante } from './columns';
import type { PaginatedResponse } from '@/types/pagination';

interface Producto {
  id: number;
  nombre: string;
  genero: string;
}

interface Talle {
  id: number;
  nombre: string;
}

interface Color {
  id: number;
  nombre: string;
}

const PAGE_SIZE = 20;

export default function AdminStockPage() {
  const { isAdmin, isHydrated } = useRequireAdmin();
  const [variantes, setVariantes] = useState<Variante[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [talles, setTalles] = useState<Talle[]>([]);
  const [colores, setColores] = useState<Color[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Paginación server-side
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [search, setSearch] = useState('');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [varianteEditar, setVarianteEditar] = useState<Variante | null>(null);
  const [varianteEliminar, setVarianteEliminar] = useState<Variante | null>(null);
  const [procesando, setProcesando] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    producto_id: '',
    talle_id: '',
    color_id: '',
    cantidad: '0',
  });

  // Fetch lookups (sin paginación)
  const fetchLookups = useCallback(async () => {
    try {
      const [productosRes, tallesRes, coloresRes] = await Promise.all([
        api.get<PaginatedResponse<Producto>>('/productos'),
        api.get<Talle[]>('/talles'),
        api.get<Color[]>('/colores'),
      ]);
      setProductos(productosRes.data.data);
      setTalles(tallesRes.data);
      setColores(coloresRes.data);
    } catch (err) {
      console.error('Error al cargar lookups:', err);
    }
  }, []);

  // Fetch variantes con paginación
  const fetchVariantes = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        limit: String(pageSize),
        offset: String(currentPage * pageSize),
      });
      if (search) params.set('search', search);

      const response = await api.get<PaginatedResponse<Variante>>(`/producto-variantes?${params}`);
      setVariantes(response.data.data);
      setTotalRows(response.data.meta.total);
      setError(null);
    } catch (err) {
      setError('Error al cargar los datos');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, search]);

  // Initial load
  useEffect(() => {
    if (isAdmin && isHydrated) {
      fetchLookups();
    }
  }, [isAdmin, isHydrated, fetchLookups]);

  // Fetch variantes cuando cambian los parámetros
  useEffect(() => {
    if (isAdmin && isHydrated) {
      fetchVariantes();
    }
  }, [isAdmin, isHydrated, fetchVariantes]);

  const abrirModalCrear = () => {
    setVarianteEditar(null);
    setFormData({
      producto_id: productos[0]?.id.toString() || '',
      talle_id: '',
      color_id: colores[0]?.id.toString() || '',
      cantidad: '0',
    });
    setModalOpen(true);
  };

  const abrirModalEditar = (variante: Variante) => {
    setVarianteEditar(variante);
    setFormData({
      producto_id: variante.producto_id.toString(),
      talle_id: variante.talle_id || '',
      color_id: variante.color_id,
      cantidad: variante.cantidad.toString(),
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    setProcesando(true);
    try {
      const payload = {
        producto_id: parseInt(formData.producto_id),
        talle_id: formData.talle_id ? parseInt(formData.talle_id) : null,
        color_id: parseInt(formData.color_id),
        cantidad: parseInt(formData.cantidad),
      };

      if (varianteEditar) {
        await api.patch(`/producto-variantes/${varianteEditar.id}`, { cantidad: payload.cantidad });
      } else {
        await api.post('/producto-variantes', payload);
      }

      setModalOpen(false);
      fetchVariantes();
    } catch (err) {
      console.error('Error al guardar variante:', err);
    } finally {
      setProcesando(false);
    }
  };

  const handleEliminar = async () => {
    if (!varianteEliminar) return;

    setProcesando(true);
    try {
      await api.delete(`/producto-variantes/${varianteEliminar.id}`);
      setDeleteModalOpen(false);
      setVarianteEliminar(null);
      fetchVariantes();
    } catch (err) {
      console.error('Error al eliminar variante:', err);
    } finally {
      setProcesando(false);
    }
  };

  const columns = useMemo(() => createColumns({
    onEdit: abrirModalEditar,
    onDelete: (variante) => {
      setVarianteEliminar(variante);
      setDeleteModalOpen(true);
    },
  }), []);

  const filterableColumns = useMemo(() => [
    {
      id: 'genero',
      title: 'Genero',
      options: [
        { label: 'Mujer', value: 'mujer' },
        { label: 'Hombre', value: 'hombre' },
        { label: 'Ninos', value: 'ninios' },
      ],
    },
  ], []);

  if (!isHydrated || !isAdmin) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Stats
  const stockTotal = variantes.reduce((acc, v) => acc + v.cantidad, 0);
  const stockBajo = variantes.filter((v) => v.cantidad < 5).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gestion de Stock</h1>
          <p className="text-muted-foreground">Administra las variantes y cantidades</p>
        </div>
        <Button onClick={abrirModalCrear}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Variante
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Variantes Totales</CardDescription>
            <CardTitle className="text-3xl">{variantes.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Stock Total</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stockTotal}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Stock Bajo (&lt;5)</CardDescription>
            <CardTitle className="text-3xl text-red-600">{stockBajo}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle>Variantes</CardTitle>
          <CardDescription>Stock por producto, talle y color</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={fetchVariantes}>Reintentar</Button>
            </div>
          ) : variantes.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay variantes</p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={variantes}
              searchPlaceholder="Buscar por producto, talle, color..."
              filterableColumns={filterableColumns}
              serverSide
              totalRows={totalRows}
              currentPage={currentPage}
              onPageChange={(page) => setCurrentPage(page)}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(0);
              }}
              onSearchChange={(value) => {
                setSearch(value);
                setCurrentPage(0);
              }}
              isLoading={isLoading}
              pageSize={pageSize}
            />
          )}
        </CardContent>
      </Card>

      {/* Modal Crear/Editar */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {varianteEditar ? 'Editar Stock' : 'Nueva Variante'}
            </DialogTitle>
            <DialogDescription>
              {varianteEditar
                ? 'Modifica la cantidad en stock'
                : 'Crea una nueva combinacion de producto, talle y color'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!varianteEditar && (
              <>
                <div className="space-y-2">
                  <Label>Producto *</Label>
                  <Select
                    value={formData.producto_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, producto_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar producto" />
                    </SelectTrigger>
                    <SelectContent>
                      {productos.map((p) => (
                        <SelectItem key={p.id} value={p.id.toString()}>
                          {p.nombre} ({p.genero})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Talle</Label>
                    <Select
                      value={formData.talle_id || 'none'}
                      onValueChange={(value) =>
                        setFormData({ ...formData, talle_id: value === 'none' ? '' : value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sin talle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin talle</SelectItem>
                        {talles.map((t) => (
                          <SelectItem key={t.id} value={t.id.toString()}>
                            {t.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Color *</Label>
                    <Select
                      value={formData.color_id}
                      onValueChange={(value) =>
                        setFormData({ ...formData, color_id: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar color" />
                      </SelectTrigger>
                      <SelectContent>
                        {colores.map((c) => (
                          <SelectItem key={c.id} value={c.id.toString()}>
                            {c.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="cantidad">Cantidad *</Label>
              <Input
                id="cantidad"
                type="number"
                min="0"
                value={formData.cantidad}
                onChange={(e) =>
                  setFormData({ ...formData, cantidad: e.target.value })
                }
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
            <Button onClick={handleSubmit} disabled={procesando}>
              {procesando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {varianteEditar ? 'Guardar' : 'Crear'}
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
              Eliminar Variante
            </DialogTitle>
            <DialogDescription>
              Esta accion eliminara permanentemente esta variante de stock.
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
            <Button
              variant="destructive"
              onClick={handleEliminar}
              disabled={procesando}
            >
              {procesando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
