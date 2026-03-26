import { db } from "@/lib/db";
import {
  isEstadoTablaValor,
  type EstadoTablaValor,
} from "@/lib/constants/estado-tabla";

function isTruthyActivo(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v === 1;
  const s = String(v).trim().toLowerCase();
  return s === "1" || s === "true" || s === "si" || s === "sí" || s === "yes";
}

/**
 * Tabla `estado`: columnas `Estado`, `FechaInicio`, `FechaTermino`, `activo`.
 * `Estado` solo admite: Postulación, Resultados, Inactivo.
 * `activo`: 1 = activo, 0 = inactivo (TINYINT/BIT).
 */
export async function listEstados(): Promise<Record<string, unknown>[]> {
  const rows = await db.query<Record<string, unknown>[]>(
    "SELECT * FROM `estado` ORDER BY 1 ASC"
  );
  return rows ?? [];
}

export async function createEstado(
  estado: EstadoTablaValor,
  fechaInicio: string | null,
  fechaTermino: string | null
): Promise<number | undefined> {
  if (!isEstadoTablaValor(estado)) {
    throw new Error("Valor de Estado no permitido");
  }
  const result = await db.query<{ insertId?: number }>(
    "INSERT INTO `estado` (`Estado`, `FechaInicio`, `FechaTermino`, `activo`) VALUES (?, ?, ?, 1)",
    [estado, fechaInicio, fechaTermino]
  );
  return result?.insertId;
}

/** Invierte `activo` y devuelve el nuevo valor (0 o 1). PK: `idEstado`. */
export async function toggleEstadoActivo(id: number): Promise<0 | 1> {
  const rows = await db.query<{ activo: unknown }[]>(
    "SELECT `activo` FROM `estado` WHERE `idEstado` = ? LIMIT 1",
    [id]
  );
  if (!rows?.length) {
    throw new Error("Registro no encontrado");
  }
  const next: 0 | 1 = isTruthyActivo(rows[0].activo) ? 0 : 1;
  await db.query("UPDATE `estado` SET `activo` = ? WHERE `idEstado` = ?", [
    next,
    id,
  ]);
  return next;
}

function fechaHoyYYYYMMDDLocal(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Qué flujo de ingreso corresponde según ventanas vigentes en `estado`.
 * Prioridad: si hay **Postulación** vigente → login empresa (db-sign-in).
 * Si no, pero hay **Resultados** vigente → login resultados (trabajador + empresa).
 */
export async function tipoLoginActivo(): Promise<
  "postulacion" | "resultados" | "ninguno"
> {
  try {
    const hoy = fechaHoyYYYYMMDDLocal();
    const rows = await db.query<{ Estado: string | null }[]>(
      `SELECT TRIM(\`Estado\`) AS Estado FROM \`estado\`
       WHERE (\`activo\` = 1 OR \`activo\` = TRUE)
         AND \`FechaInicio\` IS NOT NULL
         AND \`FechaTermino\` IS NOT NULL
         AND DATE(\`FechaInicio\`) <= ?
         AND DATE(\`FechaTermino\`) >= ?`,
      [hoy, hoy]
    );
    if (!Array.isArray(rows) || rows.length === 0) {
      return "ninguno";
    }
    const labels = new Set(
      rows
        .map((r) => (r.Estado != null ? String(r.Estado).trim() : ""))
        .filter(Boolean)
    );
    if (labels.has("Postulación")) return "postulacion";
    if (labels.has("Resultados")) return "resultados";
    return "ninguno";
  } catch (e) {
    console.error("tipoLoginActivo:", e);
    return "ninguno";
  }
}

/** Hay al menos una ventana Postulación o Resultados vigente (para mostrar ingreso en home). */
export async function hayVentanaIngresoHabilitada(): Promise<boolean> {
  return (await tipoLoginActivo()) !== "ninguno";
}
