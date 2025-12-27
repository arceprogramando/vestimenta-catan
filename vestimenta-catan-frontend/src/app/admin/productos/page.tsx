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
import { Textarea } from '@/components/ui/textarea';
import {
  Loader2,
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  AlertTriangle,
} from 'lucide-react';
import { useRequireAdmin } from '@/hooks/use-auth';
import { api } from '@/lib/axios';
import { ProductImage } from '@/components/product-image';

interface Producto {
  id: number;
  nombre: string;
  descripcion: string | null;
  genero: 'mujer' | 'hombre' | 'ninios';
  thumbnail: string | null;
  precio: number | null;
  is_active: boolean;
  created_at: string;
  stock_total?: number;
}

const generoLabels: Record<string, string> = {
  mujer: 'Mujer',
  hombre: 'Hombre',
  ninios: 'Ninos',
};

const formatPrecio = (precio: number | null | undefined) => {
  if (precio === null || precio === undefined || isNaN(Number(precio))) return '-';
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(Number(precio));
};

export default function AdminProductosPage() {
  const { isAdmin, isHydrated } = useRequireAdmin();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroGenero, setFiltroGenero] = useState<string>('todos');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productoEditar, setProductoEditar] = useState<Producto | null>(null);
  const [productoEliminar, setProductoEliminar] = useState<Producto | null>(null);
  const [procesando, setProcesando] = useState(false);

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
      const response = await api.get<Producto[]>('/productos/stock-resumen');
      setProductos(response.data);
      setError(null);
    } catch (err) {
      setError('Error al cargar los productos');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin && isHydrated) {
      fetchProductos();
    }
  }, [isAdmin, isHydrated, fetchProductos]);

  const productosFiltrados = productos.filter((producto) => {
    if (filtroGenero !== 'todos' && producto.genero !== filtroGenero) {
      return false;
    }
    if (busqueda) {
      const searchLower = busqueda.toLowerCase();
      return (
        producto.nombre.toLowerCase().includes(searchLower) ||
        producto.descripcion?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const abrirModalCrear = () => {
    setProductoEditar(null);
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

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar productos..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filtroGenero} onValueChange={setFiltroGenero}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Genero" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="mujer">Mujer</SelectItem>
            <SelectItem value="hombre">Hombre</SelectItem>
            <SelectItem value="ninios">Ninos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabla de productos */}
      <Card>
        <CardHeader>
          <CardTitle>Productos ({productosFiltrados.length})</CardTitle>
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
          ) : productosFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay productos</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Genero</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productosFiltrados.map((producto) => (
                    <TableRow key={producto.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 relative rounded-md overflow-hidden bg-muted shrink-0">
                            <ProductImage
                              src={producto.thumbnail}
                              alt={producto.nombre}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-medium">{producto.nombre}</p>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {producto.descripcion || 'Sin descripcion'}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {generoLabels[producto.genero] || producto.genero}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatPrecio(producto.precio)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={
                            (producto.stock_total || 0) < 10
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {producto.stock_total || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => abrirModalEditar(producto)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => {
                              setProductoEliminar(producto);
                              setDeleteModalOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
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
