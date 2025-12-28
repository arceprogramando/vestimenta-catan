"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTableColumnHeader } from "@/components/ui/data-table"
import { Eye } from "lucide-react"

export interface AuditLog {
  id: string
  tabla: string
  registro_id: string
  accion: string
  usuario_email: string | null
  datos_antes: Record<string, unknown> | null
  datos_despues: Record<string, unknown> | null
  campos_modificados: string[] | null
  ip_address: string | null
  created_at: string
}

const accionConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  CREATE: { label: 'Crear', variant: 'default' },
  UPDATE: { label: 'Actualizar', variant: 'secondary' },
  DELETE: { label: 'Eliminar', variant: 'destructive' },
  RESTORE: { label: 'Restaurar', variant: 'outline' },
}

const formatFecha = (fecha: string) => {
  return new Date(fecha).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface ColumnsConfig {
  onVerDetalle: (log: AuditLog) => void
}

export const createColumns = ({
  onVerDetalle,
}: ColumnsConfig): ColumnDef<AuditLog>[] => [
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Fecha" />
    ),
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        {formatFecha(row.getValue("created_at"))}
      </span>
    ),
  },
  {
    accessorKey: "usuario_email",
    header: "Usuario",
    cell: ({ row }) => (
      <span className="text-sm">
        {row.getValue("usuario_email") || 'Sistema'}
      </span>
    ),
    filterFn: (row, id, value) => {
      const log = row.original
      const searchValue = value.toLowerCase()
      return (
        log.tabla.toLowerCase().includes(searchValue) ||
        log.registro_id.includes(searchValue) ||
        (log.usuario_email?.toLowerCase().includes(searchValue) ?? false)
      )
    },
  },
  {
    accessorKey: "accion",
    header: "Accion",
    cell: ({ row }) => {
      const accion = row.getValue("accion") as string
      const config = accionConfig[accion] || { label: accion, variant: 'outline' as const }
      return <Badge variant={config.variant}>{config.label}</Badge>
    },
    filterFn: (row, id, value) => {
      return value === row.getValue(id)
    },
  },
  {
    accessorKey: "tabla",
    header: "Tabla",
    cell: ({ row }) => (
      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
        {row.getValue("tabla")}
      </code>
    ),
    filterFn: (row, id, value) => {
      return value === row.getValue(id)
    },
  },
  {
    accessorKey: "registro_id",
    header: "Registro ID",
    cell: ({ row }) => (
      <span className="font-mono text-sm">{row.getValue("registro_id")}</span>
    ),
  },
  {
    id: "acciones",
    header: () => <div className="text-right">Detalle</div>,
    cell: ({ row }) => {
      const log = row.original
      return (
        <div className="text-right">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onVerDetalle(log)}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      )
    },
  },
]
