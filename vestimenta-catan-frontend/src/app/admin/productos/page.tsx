'use client';

import { useEffect, useState, useCallback } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Package, AlertTriangle } from 'lucide-react';
import { useRequireAdmin } from '@/hooks/use-auth';
import { api } from '@/lib/axios';
import { AxiosError } from 'axios';
import { DataTable } from '@/components/ui/data-table';
import { createColumns } from './columns';
import { Producto } from '@/types/admin';
import type { PaginatedResponse } from '@/types/pagination';

const PAGE_SIZE = 20;

export default function AdminProductosPage() {
  const { isAdmin, isHydrated } = useRequireAdmin();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Paginación server-side
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [search, setSearch] = useState('');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productoEditar, setProductoEditar] = useState<Producto | null>(null);
  const [productoEliminar, setProductoEliminar] = useState<Producto | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    genero: 'mujer' as 'mujer' | 'hombre' | 'ninios',
    precio: '',
    thumbnail: '',
  });

  const fetchProductos = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        limit: String(pageSize),
        offset: String(currentPage * pageSize),
      });
      if (search) params.set('search', search);

      const response = await api.get<PaginatedResponse<Producto>>(`/productos?${params}`);
      setProductos(response.data.data);
      setTotalRows(response.data.meta.total);
      setError(null);
    } catch (err) {
      setError('Error al cargar los productos');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, search]);

  useEffect(() => {
    if (isAdmin && isHydrated) {
      fetchProductos();
    }
  }, [isAdmin, isHydrated, fetchProductos]);

  const abrirModalCrear = () => {
    setProductoEditar(null);
    setFormError(null);
    setFormData({
      nombre: '',
      descripcion: '',
      genero: 'mujer',
      precio: '',
      thumbnail: '',
    });
    setModalOpen(true);
  };

  const abrirModalEditar = (producto: Producto) => {
    setProductoEditar(producto);
    setFormError(null);
    setFormData({
      nombre: producto.nombre,
      descripcion: producto.descripcion || '',
      genero: producto.genero,
      precio: producto.precio?.toString() || '',
      thumbnail: producto.thumbnail || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    setProcesando(true);
    setFormError(null);
    try {
      const payload = {
        nombre: formData.nombre,
        descripcion: formData.descripcion || null,
        genero: formData.genero,
        precio: formData.precio ? parseFloat(formData.precio) : null,
        thumbnail: formData.thumbnail || null,
      };

      if (productoEditar) {
        await api.patch(`/productos/${productoEditar.id}`, payload);
      } else {
        await api.post('/productos', payload);
      }

      setModalOpen(false);
      fetchProductos();
    } catch (err) {
      console.error('Error al guardar producto:', err);
      if (err instanceof AxiosError && err.response?.data?.message) {
        setFormError(err.response.data.message);
      } else {
        setFormError('Error al guardar el producto. Intenta nuevamente.');
      }
    } finally {
      setProcesando(false);
    }
  };

  const handleEliminar = async () => {
    if (!productoEliminar) return;

    setProcesando(true);
    try {
      await api.delete(`/productos/${productoEliminar.id}`);
      setDeleteModalOpen(false);
      setProductoEliminar(null);
      fetchProductos();
    } catch (err) {
      console.error('Error al eliminar producto:', err);
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

  const columns = createColumns({
    onEdit: abrirModalEditar,
    onDelete: (producto) => {
      setProductoEliminar(producto);
      setDeleteModalOpen(true);
    },
  });

  const filterableColumns = [
    {
      id: 'genero',
      title: 'Genero',
      options: [
        { label: 'Mujer', value: 'mujer' },
        { label: 'Hombre', value: 'hombre' },
        { label: 'Ninos', value: 'ninios' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gestion de Productos</h1>
          <p className="text-muted-foreground">Administra el catalogo de productos</p>
        </div>
        <Button onClick={abrirModalCrear}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Producto
        </Button>
      </div>

      {/* Tabla de productos */}
      <Card>
        <CardHeader>
          <CardTitle>Productos</CardTitle>
          <CardDescription>Lista de productos del catalogo</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={fetchProductos}>Reintentar</Button>
            </div>
          ) : productos.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay productos</p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={productos}
              searchPlaceholder="Buscar productos..."
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
              {productoEditar ? 'Editar Producto' : 'Nuevo Producto'}
            </DialogTitle>
            <DialogDescription>
              {productoEditar
                ? 'Modifica los datos del producto'
                : 'Completa los datos para crear un nuevo producto'}
            </DialogDescription>
          </DialogHeader>
          {formError && (
            <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) =>
                  setFormData({ ...formData, nombre: e.target.value })
                }
                placeholder="Ej: Remera termica"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripcion</Label>
              <Textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) =>
                  setFormData({ ...formData, descripcion: e.target.value })
                }
                placeholder="Descripcion del producto"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="genero">Genero *</Label>
                <Select
                  value={formData.genero}
                  onValueChange={(value: 'mujer' | 'hombre' | 'ninios') =>
                    setFormData({ ...formData, genero: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mujer">Mujer</SelectItem>
                    <SelectItem value="hombre">Hombre</SelectItem>
                    <SelectItem value="ninios">Ninos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="precio">Precio</Label>
                <Input
                  id="precio"
                  type="number"
                  step="0.01"
                  value={formData.precio}
                  onChange={(e) =>
                    setFormData({ ...formData, precio: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="thumbnail">URL Imagen</Label>
              <Input
                id="thumbnail"
                value={formData.thumbnail}
                onChange={(e) =>
                  setFormData({ ...formData, thumbnail: e.target.value })
                }
                placeholder="/images/products/..."
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
            <Button onClick={handleSubmit} disabled={procesando || !formData.nombre}>
              {procesando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {productoEditar ? 'Guardar cambios' : 'Crear producto'}
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
              Eliminar Producto
            </DialogTitle>
            <DialogDescription>
              Esta accion eliminara permanentemente el producto &quot;{productoEliminar?.nombre}&quot;
              y todas sus variantes de stock. Esta accion no se puede deshacer.
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
