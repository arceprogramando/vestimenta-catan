"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTableColumnHeader } from "@/components/ui/data-table"
import { ProductImage } from "@/components/product-image"
import { Edit, Trash2 } from "lucide-react"
import { Producto } from "@/types/admin"

const generoLabels: Record<string, string> = {
  mujer: 'Mujer',
  hombre: 'Hombre',
  ninios: 'Ninos',
}

const formatPrecio = (precio: number | null | undefined) => {
  if (precio === null || precio === undefined || isNaN(Number(precio))) return '-'
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(Number(precio))
}

interface ColumnsConfig {
  onEdit: (producto: Producto) => void
  onDelete: (producto: Producto) => void
}

export const createColumns = ({
  onEdit,
  onDelete,
}: ColumnsConfig): ColumnDef<Producto>[] => [
  {
    accessorKey: "nombre",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Producto" />
    ),
    cell: ({ row }) => {
      const producto = row.original
      return (
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
      )
    },
    filterFn: (row, id, value) => {
      const producto = row.original
      const searchValue = value.toLowerCase()
      return (
        producto.nombre.toLowerCase().includes(searchValue) ||
        (producto.descripcion?.toLowerCase().includes(searchValue) ?? false)
      )
    },
  },
  {
    accessorKey: "genero",
    header: "Genero",
    cell: ({ row }) => (
      <Badge variant="outline">
        {generoLabels[row.getValue("genero") as string] || row.getValue("genero")}
      </Badge>
    ),
    filterFn: (row, id, value) => {
      return value === row.getValue(id)
    },
  },
  {
    accessorKey: "precio",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Precio" className="justify-end" />
    ),
    cell: ({ row }) => (
      <div className="text-right">
        {formatPrecio(row.getValue("precio"))}
      </div>
    ),
  },
  {
    accessorKey: "stock_total",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Stock" className="justify-end" />
    ),
    cell: ({ row }) => {
      const stock = row.getValue("stock_total") as number || 0
      return (
        <div className="text-right">
          <Badge variant={stock < 10 ? 'destructive' : 'secondary'}>
            {stock}
          </Badge>
        </div>
      )
    },
  },
  {
    id: "acciones",
    header: () => <div className="text-right">Acciones</div>,
    cell: ({ row }) => {
      const producto = row.original
      return (
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(producto)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive"
            onClick={() => onDelete(producto)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    },
  },
]
