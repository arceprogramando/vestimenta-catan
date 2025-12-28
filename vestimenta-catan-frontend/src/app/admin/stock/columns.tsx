"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTableColumnHeader } from "@/components/ui/data-table"
import { Edit, Trash2 } from "lucide-react"

export interface Variante {
  id: string
  producto_id: number
  talle_id: string | null
  color_id: string
  cantidad: number
  producto: {
    id: number
    nombre: string
    genero: string
  }
  talle: { id: string; nombre: string } | null
  color: { id: string; nombre: string }
}

const generoLabels: Record<string, string> = {
  mujer: 'Mujer',
  hombre: 'Hombre',
  ninios: 'Ninos',
}

interface ColumnsConfig {
  onEdit: (variante: Variante) => void
  onDelete: (variante: Variante) => void
}

export const createColumns = ({
  onEdit,
  onDelete,
}: ColumnsConfig): ColumnDef<Variante>[] => [
  {
    id: "producto_nombre",
    accessorFn: (row) => row.producto.nombre,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Producto" />
    ),
    cell: ({ row }) => (
      <span className="font-medium">{row.original.producto.nombre}</span>
    ),
    filterFn: (row, id, value) => {
      const variante = row.original
      const searchValue = value.toLowerCase()
      return (
        variante.producto.nombre.toLowerCase().includes(searchValue) ||
        (variante.talle?.nombre.toLowerCase().includes(searchValue) ?? false) ||
        variante.color.nombre.toLowerCase().includes(searchValue)
      )
    },
  },
  {
    id: "genero",
    accessorFn: (row) => row.producto.genero,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Genero" />
    ),
    cell: ({ row }) => (
      <Badge variant="outline">
        {generoLabels[row.original.producto.genero] || row.original.producto.genero}
      </Badge>
    ),
    filterFn: (row, id, value) => {
      return value === row.original.producto.genero
    },
  },
  {
    id: "talle",
    accessorFn: (row) => row.talle?.nombre || '-',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Talle" />
    ),
    cell: ({ row }) => row.original.talle?.nombre || '-',
  },
  {
    id: "color",
    accessorFn: (row) => row.color.nombre,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Color" />
    ),
    cell: ({ row }) => (
      <span className="capitalize">{row.original.color.nombre}</span>
    ),
  },
  {
    accessorKey: "cantidad",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Cantidad" className="justify-end" />
    ),
    cell: ({ row }) => {
      const cantidad = row.getValue("cantidad") as number
      return (
        <div className="text-right">
          <Badge variant={cantidad < 5 ? 'destructive' : 'secondary'}>
            {cantidad}
          </Badge>
        </div>
      )
    },
  },
  {
    id: "acciones",
    header: () => <div className="text-right">Acciones</div>,
    cell: ({ row }) => {
      const variante = row.original
      return (
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(variante)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive"
            onClick={() => onDelete(variante)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    },
  },
]
