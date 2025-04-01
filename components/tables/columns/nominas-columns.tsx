"use client";

import { ColumnDef, Column, Row } from "@tanstack/react-table";
import {
  ArrowUpDown,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NominaRow } from "@/lib/types/user";
import { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// Helper function to create consistent column definitions
function createColumn(
  key: keyof NominaRow,
  header: string,
  width?: string,
  formatter?: (value: any) => ReactNode
) {
  return {
    accessorKey: key,
    header: ({ column }: { column: Column<NominaRow, unknown> }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-medium whitespace-nowrap"
        >
          {header}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }: { row: Row<NominaRow> }) => {
      const value = row.getValue(key as string);
      return (
        <div className={`${width ? width : ""}`}>
          {formatter ? formatter(value) : (value as ReactNode)}
        </div>
      );
    },
    enableHiding: true,
    meta: {
      label: header,
    },
  };
}

// Format currency values
const formatCurrency = (value: number) => {
  if (!value && value !== 0) return "";
  return `$${value.toLocaleString("es-CL")}`;
};

export const nominasColumns: ColumnDef<NominaRow>[] = [
  {
    accessorKey: "edit",
    header: ({ column }: { column: Column<NominaRow, unknown> }) => {
      return <div>Editar</div>;
    },
    cell: ({ row }: { row: Row<NominaRow> }) => {
      const [dialogOpen, setDialogOpen] = useState(false);
      const [editedData, setEditedData] = useState<Partial<NominaRow>>({});
      const [isLoading, setIsLoading] = useState(false);
      const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
      const [isDeleting, setIsDeleting] = useState(false);

      useEffect(() => {
        if (dialogOpen) {
          setEditedData(row.original);
        }
      }, [dialogOpen, row.original]);

      const handleInputChange = (
        key: keyof NominaRow,
        value: string | number
      ) => {
        setEditedData((prev) => ({
          ...prev,
          [key]: value,
        }));
      };

      const handleSave = async () => {
        try {
          // Use ID if available, otherwise use Rut as fallback
          const identifier =
            row.original.ID !== undefined ? row.original.ID : row.original.Rut;

          setIsLoading(true);
          const response = await fetch("/api/postulaciones/nominas", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              rowId: identifier,
              updatedData: editedData,
            }),
          });

          if (!response.ok) {
            throw new Error("Error al actualizar los datos");
          }

          toast.success("Datos actualizados correctamente");
          setDialogOpen(false);
        } catch (error) {
          console.error("Error saving changes:", error);
          toast.error("Error al actualizar los datos");
        } finally {
          setIsLoading(false);
        }
      };

      const handleDelete = async () => {
        try {
          // Use ID if available, otherwise use Rut as fallback
          const identifier =
            row.original.ID !== undefined ? row.original.ID : row.original.Rut;

          setIsDeleting(true);
          const response = await fetch("/api/postulaciones/nominas", {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              rowId: identifier,
            }),
          });

          if (!response.ok) {
            throw new Error("Error al eliminar la fila");
          }

          toast.success("Fila eliminada correctamente");
          setDeleteDialogOpen(false);
          setDialogOpen(false);
        } catch (error) {
          console.error("Error deleting row:", error);
          toast.error("Error al eliminar la fila");
        } finally {
          setIsDeleting(false);
        }
      };

      return (
        <div className="flex items-center justify-center space-x-2">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setDialogOpen(true)}
            >
              <span className="sr-only">Editar</span>
              <Pencil className="h-4 w-4" />
            </Button>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader className="pb-4 border-b">
                <DialogTitle className="text-2xl font-semibold">
                  Editar Postulación
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-6 mt-6">
                <div className="text-xl font-semibold text-primary">
                  Datos de la Empresa
                </div>
                <div className="grid grid-cols-2 gap-6">
                  {Object.entries(row.original).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex flex-col space-y-1.5 bg-secondary/30 p-3 rounded-lg"
                    >
                      <span className="text-sm font-medium text-primary">
                        {key}
                      </span>
                      <Input
                        value={
                          (editedData[key as keyof NominaRow] as string) || ""
                        }
                        onChange={(e) =>
                          handleInputChange(
                            key as keyof NominaRow,
                            e.target.value
                          )
                        }
                        className="mt-1"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-6">
                  <Button
                    variant="destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                    disabled={isLoading}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </Button>
                  <div className="flex space-x-4">
                    <Button
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                      disabled={isLoading}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={isLoading}
                      className="min-w-[100px]"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        "Guardar"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>¿Estás seguro?</DialogTitle>
                <DialogDescription>
                  Esta acción no se puede deshacer. Se eliminará permanentemente
                  la postulación de {row.original["Nombre Completo"]}.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(false)}
                  disabled={isDeleting}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="min-w-[100px]"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Eliminando...
                    </>
                  ) : (
                    "Eliminar"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      );
    },
    enableHiding: true,
    meta: {
      label: "Acciones",
    },
  },
  createColumn("Rut", "RUT", "w-32 text-center"),
  createColumn("Nombre Completo", "Nombre Completo", "min-w-[200px]"),
  createColumn("Email", "Email", "min-w-[200px]"),
  createColumn("Celular", "Celular", "w-32 text-center"),
  createColumn(
    "Remuneracion Mes 1",
    "Remuneración Mes 1",
    "min-w-[150px] text-center",
    formatCurrency
  ),
  createColumn(
    "Remuneracion Mes 2",
    "Remuneración Mes 2",
    "min-w-[150px] text-center",
    formatCurrency
  ),
  createColumn(
    "Remuneracion Mes 3",
    "Remuneración Mes 3",
    "min-w-[150px] text-center",
    formatCurrency
  ),
  createColumn("Nro Hijos", "N° Hijos", "w-32 text-center"),
  createColumn("Nombre Beneficiario", "Nombre Beneficiario", "min-w-[200px]"),
  createColumn("Rut Beneficiario", "RUT Beneficiario", "w-36 text-center"),
  createColumn(
    "Relacion con el Trabajador",
    "Relación con el Trabajador",
    "min-w-[180px] text-center"
  ),
  createColumn(
    "Edad del Beneficiario",
    "Edad del Beneficiario",
    "w-32 text-center"
  ),
  createColumn("Año Academico", "Año Académico", "w-32 text-center"),
  createColumn("Promedio de Notas", "Promedio de Notas", "w-36 text-center"),
  createColumn("Tipo Beca", "Tipo Beca", "w-32 text-center"),
  createColumn("Razon Social", "Razón Social", "min-w-[180px]"),
  createColumn("Rut Empresa", "RUT Empresa", "w-32 text-center"),
  createColumn("Operacion", "Operación", "w-32 text-center"),
  createColumn("Nro Contrato", "N° Contrato", "w-32 text-center"),
  createColumn(
    "Encargado Becas Estudio",
    "Encargado Becas Estudio",
    "min-w-[180px] text-center"
  ),
  createColumn("Mail Encargado", "Mail Encargado", "min-w-[180px]"),
  createColumn("Telefono Encargado", "Teléfono Encargado", "w-32 text-center"),
];
