"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import Spinner from "@/components/spinner";
import {
  formatEstadoCell,
  formatEstadoColumnHeader,
  getEstadoTableColumnKeys,
  getEstadoTableRowId,
  isActivoColumn,
  isEstadoCampoColumn,
  isEstadoDateColumn,
  isRowActivo,
  patchEstadoRowActivo,
} from "@/lib/utils/estado-display";
import { cn } from "@/lib/utils";
import { ESTADO_TABLA_VALORES } from "@/lib/constants/estado-tabla";

/** Botón en columna `activo`: solo texto Activo/Inactivo; verde si activo, rojo si inactivo. */
function EstadoActivoButton({
  rowId,
  activoValue,
  onUpdated,
}: {
  rowId: number;
  activoValue: unknown;
  onUpdated: (next: 0 | 1) => void;
}) {
  const active = isRowActivo(activoValue);
  const [pending, setPending] = useState(false);
  const { toast } = useToast();

  const handleClick = async () => {
    try {
      setPending(true);
      const res = await fetch("/api/dashboard/estado", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: rowId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo actualizar");
      }
      const next = (data.activo === 1 ? 1 : 0) as 0 | 1;
      onUpdated(next);
      toast({ title: data.message || "Actualizado" });
    } catch (e) {
      toast({
        title: e instanceof Error ? e.message : "Error al actualizar",
        variant: "destructive",
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      className={cn(
        "min-w-[96px] justify-center border-0 font-medium shadow-sm",
        pending &&
          "bg-muted text-muted-foreground hover:bg-muted hover:text-muted-foreground",
        !pending &&
          active &&
          "bg-emerald-600 text-white hover:bg-emerald-700 hover:text-white focus-visible:ring-emerald-500",
        !pending &&
          !active &&
          "bg-red-600 text-white hover:bg-red-700 hover:text-white focus-visible:ring-red-500"
      )}
      disabled={pending}
      onClick={handleClick}
      title={active ? "Clic para marcar inactivo" : "Clic para marcar activo"}
    >
      {pending ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
      ) : active ? (
        "Activo"
      ) : (
        "Inactivo"
      )}
    </Button>
  );
}

export default function EstadoAdminClient() {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [estado, setEstado] = useState<string>("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaTermino, setFechaTermino] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchRows = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/dashboard/estado");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al cargar estados");
      }
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!estado.trim()) {
      toast({
        title: "Seleccione un estado",
        variant: "destructive",
      });
      return;
    }
    try {
      setSaving(true);
      const res = await fetch("/api/dashboard/estado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estado: estado.trim(),
          fechaInicio: fechaInicio.trim() || undefined,
          fechaTermino: fechaTermino.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al crear");
      }
      toast({ title: data.message || "Estado creado" });
      setEstado("");
      setFechaInicio("");
      setFechaTermino("");
      await fetchRows();
    } catch (e) {
      toast({
        title: e instanceof Error ? e.message : "Error al crear",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const columns = useMemo(() => getEstadoTableColumnKeys(rows), [rows]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-2">
        <Spinner color="text-blue-500" />
        <p className="text-muted-foreground">Cargando estados…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-md"
        role="alert"
      >
        <strong className="font-semibold">Error: </strong>
        {error}
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Estados</h1>
        <p className="text-muted-foreground">
          Alta de registros en la tabla <code className="text-sm">estado</code>.
          Solo usuarios administradores.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-lg border bg-card p-6 space-y-4 shadow-sm"
      >
        <h2 className="text-lg font-semibold">Nuevo estado</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:items-end">
          <div className="space-y-2 sm:col-span-2">
            <label htmlFor="estado-campo" className="text-sm font-medium">
              Estado
            </label>
            <select
              id="estado-campo"
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              disabled={saving}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Seleccione…</option>
              {ESTADO_TABLA_VALORES.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="estado-fecha-inicio" className="text-sm font-medium">
              Fecha inicio
            </label>
            <Input
              id="estado-fecha-inicio"
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              disabled={saving}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="estado-fecha-termino" className="text-sm font-medium">
              Fecha término
            </label>
            <Input
              id="estado-fecha-termino"
              type="date"
              value={fechaTermino}
              onChange={(e) => setFechaTermino(e.target.value)}
              disabled={saving}
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-4 flex justify-start">
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando…" : "Crear registro"}
            </Button>
          </div>
        </div>
      </form>

      <div className="rounded-lg border bg-card overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b bg-muted/40">
          <h2 className="text-lg font-semibold">Registros actuales</h2>
        </div>
        <div className="overflow-x-auto overflow-y-visible">
          {rows.length === 0 ? (
            <p className="p-6 text-muted-foreground text-sm">
              No hay filas en la tabla o aún no se han creado registros.
            </p>
          ) : (
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="text-left font-medium p-3 whitespace-nowrap"
                    >
                      {formatEstadoColumnHeader(col)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const rowId = getEstadoTableRowId(row);
                  return (
                    <tr
                      key={rowId != null ? `estado-${rowId}` : `estado-idx-${i}`}
                      className="border-b last:border-0 hover:bg-muted/20"
                    >
                      {columns.map((col) => {
                        if (isActivoColumn(col)) {
                          if (rowId === null) {
                            return (
                              <td key={col} className="p-3 text-muted-foreground">
                                —
                              </td>
                            );
                          }
                          return (
                            <td key={col} className="p-3 align-middle">
                              <EstadoActivoButton
                                rowId={rowId}
                                activoValue={row[col]}
                                onUpdated={(next) => {
                                  setRows((prev) =>
                                    prev.map((r) =>
                                      getEstadoTableRowId(r) === rowId
                                        ? patchEstadoRowActivo(r, next)
                                        : r
                                    )
                                  );
                                }}
                              />
                            </td>
                          );
                        }
                        return (
                          <td
                            key={col}
                            className={`p-3 align-top ${
                              isEstadoDateColumn(col) || isEstadoCampoColumn(col)
                                ? "whitespace-nowrap min-w-[140px]"
                                : "max-w-[240px] truncate"
                            }`}
                          >
                            {formatEstadoCell(col, row[col])}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
