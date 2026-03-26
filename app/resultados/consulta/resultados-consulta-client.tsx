"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ResultadoPostulacionRow } from "@/lib/services/resultados-postulaciones-service";

const COLUMNS: Array<keyof ResultadoPostulacionRow> = [
  "Rut Trabajador",
  "Nombre Trabajador",
  "Nombre Beneficiario",
  "Observaciones",
  "Resultado",
  "Rut Beneficiario",
  "Relación",
  "Tipo Beca",
  "Razón Social",
  "Puntaje",
];

type Props = {
  rows: ResultadoPostulacionRow[];
};

export default function ResultadosConsultaClient({ rows }: Props) {
  const [pageSize, setPageSize] = useState<number>(10);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      COLUMNS.some((c) => String(r[c] ?? "").toLowerCase().includes(q))
    );
  }, [rows, query]);

  const visibleRows = filtered.slice(0, pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-4xl font-semibold text-primary">Resultado de mis Postulaciones</h1>
        <Button asChild variant="outline">
          <Link href="/">Salir</Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="flex items-end gap-3">
          <Label htmlFor="page-size" className="text-sm text-muted-foreground">
            Mostrar
          </Label>
          <select
            id="page-size"
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={String(pageSize)}
            onChange={(e) => setPageSize(parseInt(e.target.value, 10))}
          >
            {[2, 5, 10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <span className="text-sm text-muted-foreground">Entradas</span>
        </div>
        <div className="flex items-center gap-3">
          <Label htmlFor="buscar-resultados">Buscar:</Label>
          <Input
            id="buscar-resultados"
            placeholder="Buscar por nombre, RUT, tipo de beca..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-[320px]"
          />
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              {COLUMNS.map((c) => (
                <TableHead key={c} className="whitespace-nowrap">
                  {c}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COLUMNS.length} className="text-center text-muted-foreground">
                  No se encontraron resultados.
                </TableCell>
              </TableRow>
            ) : (
              visibleRows.map((row, idx) => (
                <TableRow key={idx}>
                  {COLUMNS.map((c) => (
                    <TableCell key={c} className="align-top">
                      {row[c] || "—"}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-sm text-muted-foreground">
        Mostrando 1 a {visibleRows.length} de {filtered.length} Entradas
      </p>

      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        Si usted resultó beneficiado, debe consultar en Recursos Humanos de su Empresa por la fecha de pago de este beneficio.
      </div>
    </div>
  );
}
