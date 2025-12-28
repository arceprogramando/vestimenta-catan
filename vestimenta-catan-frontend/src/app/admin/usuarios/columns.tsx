"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTableColumnHeader } from "@/components/ui/data-table"
import { Edit, Eye, EyeOff } from "lucide-react"

export interface Usuario {
  id: number
  email: string
  nombre: string | null
  apellido: string | null
  rol: 'user' | 'empleado' | 'admin' | 'superadmin'
  provider: string
  is_active: boolean
  created_at: string
}

const rolConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  superadmin: { label: 'Super Admin', variant: 'destructive' },
  admin: { label: 'Admin', variant: 'default' },
  empleado: { label: 'Empleado', variant: 'secondary' },
  user: { label: 'Usuario', variant: 'outline' },
}

const maskEmail = (email: string): string => {
  const [local, domain] = email.split('@')
  if (!domain) return email
  const maskedLocal = local.length <= 2 ? local[0] + '*' : local[0] + '***' + local[local.length - 1]
  const domainParts = domain.split('.')
  const domainName = domainParts[0]
  const extension = domainParts.slice(1).join('.')
  const maskedDomain = domainName[0] + '***.' + extension
  return `${maskedLocal}@${maskedDomain}`
}

interface ColumnsConfig {
  currentUserId?: number
  isSuperAdmin: boolean
  emailsVisibles: Set<number>
  toggleEmailVisible: (id: number) => void
  onEdit: (usuario: Usuario) => void
}

export const createColumns = ({
  currentUserId,
  isSuperAdmin,
  emailsVisibles,
  toggleEmailVisible,
  onEdit,
}: ColumnsConfig): ColumnDef<Usuario>[] => [
  {
    accessorKey: "nombre",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Usuario" />
    ),
    cell: ({ row }) => {
      const usuario = row.original
      const esUsuarioActual = currentUserId === usuario.id
      return (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
            <span className="text-sm font-medium">
              {(usuario.nombre?.[0] || usuario.email[0]).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-medium">
              {usuario.nombre || usuario.apellido
                ? `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim()
                : 'Sin nombre'}
            </p>
            {esUsuarioActual && (
              <span className="text-xs text-muted-foreground">(Tu)</span>
            )}
          </div>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      const usuario = row.original
      const searchValue = value.toLowerCase()
      return (
        usuario.email.toLowerCase().includes(searchValue) ||
        (usuario.nombre?.toLowerCase().includes(searchValue) ?? false) ||
        (usuario.apellido?.toLowerCase().includes(searchValue) ?? false)
      )
    },
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    cell: ({ row }) => {
      const usuario = row.original
      const isVisible = emailsVisibles.has(usuario.id)
      return (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 shrink-0"
            onClick={() => toggleEmailVisible(usuario.id)}
            title={isVisible ? 'Ocultar email' : 'Mostrar email'}
          >
            {isVisible ? (
              <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </Button>
          <span className="text-sm font-mono truncate max-w-48">
            {isVisible ? usuario.email : maskEmail(usuario.email)}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: "provider",
    header: "Proveedor",
    cell: ({ row }) => (
      <Badge variant="outline" className="capitalize">
        {row.getValue("provider")}
      </Badge>
    ),
    filterFn: (row, id, value) => {
      return value === row.getValue(id)
    },
  },
  {
    accessorKey: "rol",
    header: "Rol",
    cell: ({ row }) => {
      const rol = row.getValue("rol") as string
      const config = rolConfig[rol] || rolConfig.user
      return <Badge variant={config.variant}>{config.label}</Badge>
    },
    filterFn: (row, id, value) => {
      return value === row.getValue(id)
    },
  },
  {
    id: "acciones",
    header: () => <div className="text-right">Acciones</div>,
    cell: ({ row }) => {
      const usuario = row.original
      const esUsuarioActual = currentUserId === usuario.id
      const puedeEditar = isSuperAdmin && !esUsuarioActual

      return (
        <div className="text-right">
          {puedeEditar ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(usuario)}
            >
              <Edit className="h-4 w-4 mr-1" />
              Cambiar rol
            </Button>
          ) : (
            <span className="text-sm text-muted-foreground">
              {esUsuarioActual ? 'No puedes editarte' : 'Sin permisos'}
            </span>
          )}
        </div>
      )
    },
  },
]
