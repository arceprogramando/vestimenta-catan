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
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  AlertTriangle,
} from 'lucide-react';
import { useRequireAdmin } from '@/hooks/use-auth';
import { api } from '@/lib/axios';

interface Variante {
  id: string;
  producto_id: number;
  talle_id: string | null;
  color_id: string;
  cantidad: number;
  producto: {
    id: number;
    nombre: string;
    genero: string;
  };
  talle: { id: string; nombre: string } | null;
  color: { id: string; nombre: string };
}

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

export default function AdminStockPage() {
  const { isAdmin, isHydrated } = useRequireAdmin();
  const [variantes, setVariantes] = useState<Variante[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [talles, setTalles] = useState<Talle[]>([]);
  const [colores, setColores] = useState<Color[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroProducto, setFiltroProducto] = useState<string>('todos');

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

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [variantesRes, productosRes, tallesRes, coloresRes] = await Promise.all([
        api.get<Variante[]>('/producto-variantes'),
        api.get<Producto[]>('/productos'),
        api.get<Talle[]>('/talles'),
        api.get<Color[]>('/colores'),
      ]);
      setVariantes(variantesRes.data);
      setProductos(productosRes.data);
      setTalles(tallesRes.data);
      setColores(coloresRes.data);
      setError(null);
    } catch (err) {
      setError('Error al cargar los datos');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin && isHydrated) {
      fetchData();
    }
  }, [isAdmin, isHydrated, fetchData]);

  const variantesFiltradas = variantes.filter((variante) => {
    if (filtroProducto !== 'todos' && variante.producto_id.toString() !== filtroProducto) {
      return false;
    }
    if (busqueda) {
      const searchLower = busqueda.toLowerCase();
      return (
        variante.producto.nombre.toLowerCase().includes(searchLower) ||
        variante.talle?.nombre.toLowerCase().includes(searchLower) ||
        variante.color.nombre.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

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
      fetchData();
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
      fetchData();
    } catch (err) {
      console.error('Error al eliminar variante:', err);
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

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por producto, talle, color..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filtroProducto} onValueChange={setFiltroProducto}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Producto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los productos</SelectItem>
            {productos.map((p) => (
              <SelectItem key={p.id} value={p.id.toString()}>
                {p.nombre} ({p.genero})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle>Variantes ({variantesFiltradas.length})</CardTitle>
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
              <Button onClick={fetchData}>Reintentar</Button>
            </div>
          ) : variantesFiltradas.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay variantes</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Genero</TableHead>
                    <TableHead>Talle</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {variantesFiltradas.map((variante) => (
                    <TableRow key={variante.id}>
                      <TableCell className="font-medium">
                        {variante.producto.nombre}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{variante.producto.genero}</Badge>
                      </TableCell>
                      <TableCell>{variante.talle?.nombre || '-'}</TableCell>
                      <TableCell className="capitalize">{variante.color.nombre}</TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={variante.cantidad < 5 ? 'destructive' : 'secondary'}
                        >
                          {variante.cantidad}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => abrirModalEditar(variante)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => {
                              setVarianteEliminar(variante);
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
                      value={formData.talle_id}
                      onValueChange={(value) =>
                        setFormData({ ...formData, talle_id: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sin talle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Sin talle</SelectItem>
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
