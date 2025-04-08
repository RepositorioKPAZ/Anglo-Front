"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  ColumnFiltersState,
  getFilteredRowModel,
  VisibilityState,
  FilterFn,
  Row,
} from "@tanstack/react-table";

// Meta type extension for columns
declare module "@tanstack/react-table" {
  interface ColumnMeta<TData, TValue> {
    label?: string;
  }
}

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, Settings, Plus, RefreshCw } from "lucide-react";
import { exportToExcel } from "@/lib/utils/excel-export";
import { generatePassword } from "@/lib/utils/password-utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

// Import TableContext from nominas-columns
import { TableContext } from "@/components/tables/columns/nominas-columns";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchKeys?: string[];
  searchPlaceholder?: string;
  title?: string;
  showEntries?: boolean;
  enableHorizontalScroll?: boolean;
  enableColumnVisibility?: boolean;
  enableExport?: boolean;
  exportFileName?: string;
  agregarEmpresaAdmin?: boolean;
  refreshData?: () => Promise<void>;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchKeys,
  searchPlaceholder = "Buscar...",
  title,
  showEntries = true,
  enableHorizontalScroll = false,
  enableColumnVisibility = false,
  enableExport = false,
  exportFileName = "exported-data",
  agregarEmpresaAdmin = false,
  refreshData,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [pageSize, setPageSize] = useState(10);
  const [pageIndex, setPageIndex] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [globalFilter, setGlobalFilter] = useState("");
  const [newCompany, setNewCompany] = useState({
    Rut: "",
    Empresa: "",
    Operacion: "",
    Encargado: "",
    Mail: "",
    Telefono: "",
    Empresa_C: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Custom filter function for multi-column search
  const multiColumnFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
    // Get the list of columns to search
    const columnsToSearch: string[] = [];
    if (searchKey) columnsToSearch.push(searchKey);
    if (searchKeys) columnsToSearch.push(...searchKeys);

    if (!value || value === "") return true;

    // Return true if any of the specified columns match the search value
    return columnsToSearch.some((colId) => {
      const cellValue = row.getValue(colId);
      if (typeof cellValue === "string") {
        return cellValue.toLowerCase().includes(value.toLowerCase());
      }
      if (cellValue !== null && cellValue !== undefined) {
        return String(cellValue).toLowerCase().includes(value.toLowerCase());
      }
      return false;
    });
  };

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: multiColumnFilter,
    onPaginationChange: (updater) => {
      const newState =
        typeof updater === "function"
          ? updater(table.getState().pagination)
          : updater;
      setPageIndex(newState.pageIndex);
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter: searchValue,
      pagination: {
        pageSize: pageSize,
        pageIndex: pageIndex,
      },
    },
  });

  const handleExportToExcel = () => {
    exportToExcel(data, exportFileName);
  };

  const handleAddCompany = async () => {
    setIsSubmitting(true);
    setFormError(null);

    // Validate RUT format (simple format check)
    const rutRegex = /^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/;
    if (!rutRegex.test(newCompany.Rut)) {
      setFormError("El RUT debe tener el formato xx.xxx.xxx-x");
      setIsSubmitting(false);
      return;
    }

    // Validate email format (basic check)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newCompany.Mail)) {
      setFormError("El correo electrónico no tiene un formato válido");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/dashboard/empresas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newCompany),
      });

      const result = await response.json();
      console.log("Resultado Crear Empresa", result);
      if (!response.ok) {
        const errorMessage = result.error || "Error al agregar la empresa";
        setFormError(errorMessage);
        throw new Error(errorMessage);
      }

      toast.success("Empresa agregada correctamente");
      setDialogOpen(false);
      setNewCompany({
        Rut: "",
        Empresa: "",
        Operacion: "",
        Encargado: "",
        Mail: "",
        Telefono: "",
        Empresa_C: "",
      });
      // Refresh the page to show the new data
      window.location.reload();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al agregar la empresa"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <TableContext.Provider value={{ refreshData }}>
        {title && <h1 className="text-xl font-semibold mb-4">{title}</h1>}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            {showEntries && (
              <div className="flex items-center space-x-2">
                <div>Mostrar</div>
                <select
                  className="border rounded px-2 py-1 bg-white"
                  value={pageSize}
                  onChange={(e) => {
                    const newSize = parseInt(e.target.value);
                    setPageSize(newSize);
                    table.setPageSize(newSize);
                  }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <div>Entradas</div>
              </div>
            )}

            {enableColumnVisibility && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="ml-auto">
                    <Settings className="h-4 w-4 mr-2" />
                    Columnas
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="max-h-[400px] overflow-y-auto"
                >
                  {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => {
                      return (
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          className="capitalize"
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) =>
                            column.toggleVisibility(!!value)
                          }
                        >
                          {column.columnDef.meta?.label || column.id}
                        </DropdownMenuCheckboxItem>
                      );
                    })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {enableExport && (
              <Button
                variant="outline"
                onClick={handleExportToExcel}
                className="ml-auto"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            )}

            {refreshData && (
              <Button
                variant="outline"
                onClick={refreshData}
                className="ml-auto"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
            )}

            {agregarEmpresaAdmin && (
              <Dialog
                open={dialogOpen}
                onOpenChange={(open) => {
                  setDialogOpen(open);
                  if (!open) {
                    setFormError(null);
                  }
                }}
              >
                <Button
                  variant="outline"
                  onClick={() => {
                    setFormError(null);
                    setDialogOpen(true);
                  }}
                  className="ml-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Empresa
                </Button>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Agregar Nueva Empresa</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">RUT</label>
                      <Input
                        value={newCompany.Rut}
                        onChange={(e) =>
                          setNewCompany({ ...newCompany, Rut: e.target.value })
                        }
                        placeholder="Ingrese el RUT"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Nombre de la Empresa
                      </label>
                      <Input
                        value={newCompany.Empresa}
                        onChange={(e) =>
                          setNewCompany({
                            ...newCompany,
                            Empresa: e.target.value,
                          })
                        }
                        placeholder="Ingrese el nombre de la empresa"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Operación</label>
                      <Input
                        value={newCompany.Operacion}
                        onChange={(e) =>
                          setNewCompany({
                            ...newCompany,
                            Operacion: e.target.value,
                          })
                        }
                        placeholder="Ingrese la operación"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Encargado</label>
                      <Input
                        value={newCompany.Encargado}
                        onChange={(e) =>
                          setNewCompany({
                            ...newCompany,
                            Encargado: e.target.value,
                          })
                        }
                        placeholder="Ingrese el nombre del encargado"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email</label>
                      <Input
                        value={newCompany.Mail}
                        onChange={(e) =>
                          setNewCompany({ ...newCompany, Mail: e.target.value })
                        }
                        placeholder="Ingrese el email"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Teléfono</label>
                      <Input
                        value={newCompany.Telefono}
                        onChange={(e) =>
                          setNewCompany({
                            ...newCompany,
                            Telefono: e.target.value,
                          })
                        }
                        placeholder="Ingrese el teléfono"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Contraseña</label>
                      <Input
                        value={newCompany.Empresa_C}
                        readOnly
                        placeholder="La contraseña será generada automáticamente"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  {formError && (
                    <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md mt-2 text-sm">
                      {formError}
                    </div>
                  )}

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                      disabled={isSubmitting}
                    >
                      Cancelar
                    </Button>
                    <Button onClick={handleAddCompany} disabled={isSubmitting}>
                      {isSubmitting ? "Guardando..." : "Guardar"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {(searchKey || searchKeys) && (
            <div className="flex items-center justify-end space-x-2 pe-1 w-full">
              <div>Buscar:</div>
              <Input
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(event) => {
                  setSearchValue(event.target.value);
                }}
                className="max-w-md"
              />
            </div>
          )}
        </div>

        <div
          className={`rounded-md border w-full overflow-x-auto bg-white shadow-sm`}
        >
          <Table>
            <TableHeader className="bg-primary/90">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        key={header.id}
                        className="font-semibold text-white"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row, index) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={`${index % 2 === 0 ? "bg-white" : "bg-primary/5"} hover:bg-primary/10 transition-colors`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-3">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No hay información
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            Mostrando{" "}
            {table.getFilteredRowModel().rows.length > 0
              ? `${Math.min(table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1, table.getFilteredRowModel().rows.length)} to ${Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getFilteredRowModel().rows.length)} of ${table.getFilteredRowModel().rows.length}`
              : `0 a 0 de 0`}{" "}
            Entradas
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Siguiente
            </Button>
          </div>
        </div>
      </TableContext.Provider>
    </div>
  );
}
