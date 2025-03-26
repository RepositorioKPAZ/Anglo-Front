"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export type PostulacionEmpresa = {
  rutEmpresa: string;
  nro: number;
  rut: string;
  nombreCompleto: string;
  rutBeneficiario: string;
  nombreBeneficiario: string;
  tipoBeca: string;
  promedioNotas: number;
};

export const postulacionesEmpresaColumns: ColumnDef<PostulacionEmpresa>[] = [
  {
    accessorKey: "nro",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-medium"
        >
          Nro.
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    enableHiding: true,
    meta: {
      label: "Nro.",
    },
  },
  {
    accessorKey: "rut",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-medium"
        >
          Rut
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    enableHiding: true,
    meta: {
      label: "Rut",
    },
  },
  {
    accessorKey: "nombreCompleto",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-medium"
        >
          Nombre Completo
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    enableHiding: true,
    meta: {
      label: "Nombre Completo",
    },
  },
  {
    accessorKey: "rutBeneficiario",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-medium"
        >
          Rut Beneficiario
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    enableHiding: true,
    meta: {
      label: "Rut Beneficiario",
    },
  },
  {
    accessorKey: "nombreBeneficiario",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-medium"
        >
          Nombre Beneficiario
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    enableHiding: true,
    meta: {
      label: "Nombre Beneficiario",
    },
  },
  {
    accessorKey: "tipoBeca",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-medium"
        >
          Tipo Beca
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    enableHiding: true,
    meta: {
      label: "Tipo Beca",
    },
  },
  {
    accessorKey: "promedioNotas",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-medium"
        >
          Promedio de Notas
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const value = parseFloat(row.getValue("promedioNotas"));
      return <div>{value.toFixed(1)}</div>;
    },
    enableHiding: true,
    meta: {
      label: "Promedio de Notas",
    },
  },
];
