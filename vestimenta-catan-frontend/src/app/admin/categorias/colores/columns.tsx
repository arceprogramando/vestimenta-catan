"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { DataTableColumnHeader } from "@/components/ui/data-table"
import { Edit, Trash2 } from "lucide-react"

export interface Color {
  id: number
  nombre: string
  is_active: boolean
  created_at: string
}

interface ColumnsConfig {
  onEdit: (color: Color) => void
  onDelete: (color: Color) => void
}

export const createColumns = ({
  onEdit,
  onDelete,
}: ColumnsConfig): ColumnDef<Color>[] => [
  {
    accessorKey: "id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="ID" />
    ),
    cell: ({ row }) => (
      <span className="font-mono text-sm">{row.getValue("id")}</span>
    ),
  },
  {
    accessorKey: "nombre",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nombre" />
    ),
    cell: ({ row }) => (
      <span className="font-medium capitalize">{row.getValue("nombre")}</span>
    ),
    filterFn: (row, id, value) => {
      return (row.getValue(id) as string).toLowerCase().includes(value.toLowerCase())
    },
  },
  {
    id: "acciones",
    header: () => <div className="text-right">Acciones</div>,
    cell: ({ row }) => {
      const color = row.original
      return (
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(color)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive"
            onClick={() => onDelete(color)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    },
  },
]
