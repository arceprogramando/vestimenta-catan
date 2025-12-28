"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  searchPlaceholder?: string
  filterableColumns?: {
    id: string
    title: string
    options: { label: string; value: string }[]
  }[]
  pageSize?: number
  // Server-side pagination props
  serverSide?: boolean
  totalRows?: number
  currentPage?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  onSearchChange?: (search: string) => void
  isLoading?: boolean
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Buscar...",
  filterableColumns = [],
  pageSize: initialPageSize = 10,
  // Server-side props
  serverSide = false,
  totalRows = 0,
  currentPage = 0,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
  isLoading = false,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [localPageSize, setLocalPageSize] = React.useState(initialPageSize)
  const [searchValue, setSearchValue] = React.useState("")

  // Debounce para búsqueda server-side
  const searchTimeoutRef = React.useRef<NodeJS.Timeout>(undefined)

  const handleSearchChange = React.useCallback((value: string) => {
    setSearchValue(value)
    if (serverSide && onSearchChange) {
      // Clear previous timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
      // Debounce 300ms
      searchTimeoutRef.current = setTimeout(() => {
        onSearchChange(value)
        onPageChange?.(0) // Reset to first page on search
      }, 300)
    }
  }, [serverSide, onSearchChange, onPageChange])

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  const pageCount = serverSide
    ? Math.ceil(totalRows / localPageSize)
    : undefined

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: serverSide ? undefined : getPaginationRowModel(),
    getSortedRowModel: serverSide ? undefined : getSortedRowModel(),
    getFilteredRowModel: serverSide ? undefined : getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    manualPagination: serverSide,
    manualFiltering: serverSide,
    pageCount: serverSide ? pageCount : undefined,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      ...(serverSide && {
        pagination: {
          pageIndex: currentPage,
          pageSize: localPageSize,
        },
      }),
    },
    initialState: {
      pagination: {
        pageSize: initialPageSize,
      },
    },
  })

  // Handlers para server-side
  const handlePageSizeChange = (size: number) => {
    setLocalPageSize(size)
    if (serverSide) {
      onPageSizeChange?.(size)
      onPageChange?.(0) // Reset to first page
    } else {
      table.setPageSize(size)
    }
  }

  const handlePreviousPage = () => {
    if (serverSide) {
      onPageChange?.(currentPage - 1)
    } else {
      table.previousPage()
    }
  }

  const handleNextPage = () => {
    if (serverSide) {
      onPageChange?.(currentPage + 1)
    } else {
      table.nextPage()
    }
  }

  const handleFirstPage = () => {
    if (serverSide) {
      onPageChange?.(0)
    } else {
      table.setPageIndex(0)
    }
  }

  const handleLastPage = () => {
    if (serverSide) {
      onPageChange?.((pageCount || 1) - 1)
    } else {
      table.setPageIndex(table.getPageCount() - 1)
    }
  }

  const canPreviousPage = serverSide ? currentPage > 0 : table.getCanPreviousPage()
  const canNextPage = serverSide
    ? currentPage < (pageCount || 1) - 1
    : table.getCanNextPage()

  const displayedPageIndex = serverSide ? currentPage : table.getState().pagination.pageIndex
  const displayedPageSize = serverSide ? localPageSize : table.getState().pagination.pageSize
  const displayedPageCount = serverSide ? (pageCount || 1) : (table.getPageCount() || 1)
  const displayedTotalRows = serverSide ? totalRows : table.getFilteredRowModel().rows.length

  const hasActiveFilters = columnFilters.length > 0

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          {(searchKey || (serverSide && onSearchChange)) && (
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={serverSide ? searchValue : (table.getColumn(searchKey!)?.getFilterValue() as string) ?? ""}
                onChange={(event) => {
                  if (serverSide) {
                    handleSearchChange(event.target.value)
                  } else if (searchKey) {
                    table.getColumn(searchKey)?.setFilterValue(event.target.value)
                  }
                }}
                className="pl-8"
              />
            </div>
          )}

          {filterableColumns.map((column) => {
            const tableColumn = table.getColumn(column.id)
            if (!tableColumn) return null

            const selectedValue = tableColumn.getFilterValue() as string

            return (
              <Select
                key={column.id}
                value={selectedValue ?? "all"}
                onValueChange={(value) =>
                  tableColumn.setFilterValue(value === "all" ? undefined : value)
                }
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder={column.title} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {column.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )
          })}

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setColumnFilters([])}
              className="h-9 px-2 lg:px-3"
            >
              Limpiar
              <X className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="ml-auto">
              Columnas <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <span className="text-muted-foreground">Cargando...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No se encontraron resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          Mostrando {displayedPageIndex * displayedPageSize + 1} a{" "}
          {Math.min(
            (displayedPageIndex + 1) * displayedPageSize,
            displayedTotalRows
          )}{" "}
          de {displayedTotalRows} registros
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={`${displayedPageSize}`}
            onValueChange={(value) => handlePageSizeChange(Number(value))}
          >
            <SelectTrigger className="h-8 w-17.5">
              <SelectValue placeholder={displayedPageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 50, 100].map((size) => (
                <SelectItem key={size} value={`${size}`}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={handleFirstPage}
              disabled={!canPreviousPage || isLoading}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={handlePreviousPage}
              disabled={!canPreviousPage || isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm px-2">
              {displayedPageIndex + 1} / {displayedPageCount}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={handleNextPage}
              disabled={!canNextPage || isLoading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={handleLastPage}
              disabled={!canNextPage || isLoading}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: import("@tanstack/react-table").Column<TData, TValue>
  title: string
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={className}>{title}</div>
  }

  return (
    <div className={cn("flex", className)}>
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 data-[state=open]:bg-accent"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        {title}
        {column.getIsSorted() === "desc" ? (
          <ChevronDown className="ml-2 h-4 w-4" />
        ) : column.getIsSorted() === "asc" ? (
          <ChevronDown className="ml-2 h-4 w-4 rotate-180" />
        ) : (
          <ChevronDown className="ml-2 h-4 w-4 opacity-30" />
        )}
      </Button>
    </div>
  )
}
