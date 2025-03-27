"use client";

import { ColumnDef, Column, Row } from "@tanstack/react-table";
import { ArrowUpDown, Eye, EyeOff, Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NominaRow } from "@/lib/utils/excel-reader";
import { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
                      <span className="text-sm text-muted-foreground">
                        {value !== null && typeof value === "object"
                          ? JSON.stringify(value)
                          : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
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
