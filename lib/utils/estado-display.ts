import { format, isValid, parse } from "date-fns";
import { es } from "date-fns/locale";
import {
  ESTADO_TABLA_VALORES,
  isEstadoTablaValor,
} from "@/lib/constants/estado-tabla";

const COLUMN_LABELS: Record<string, string> = {
  id: "ID",
  idestado: "ID estado",
  nombre: "Nombre",
  estado: "Estado",
  activo: "Activo",
  fechainicio: "Fecha inicio",
  fechatermino: "Fecha término",
};

const DATE_COLUMN_KEYS = new Set(["fechainicio", "fechatermino"]);

/** Columna de tipo enum Estado (Postulación / Resultados / Inactivo). */
const ESTADO_CAMPO_KEYS = new Set(["estado"]);

export function formatEstadoColumnHeader(key: string): string {
  return COLUMN_LABELS[key.toLowerCase()] ?? key;
}

function parseDbDate(value: unknown): Date | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) {
    return isValid(value) ? value : null;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const s = value.trim();
    // DATE puro sin hora: evitar desfase UTC al interpretar como medianoche local
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      const d = parse(s, "yyyy-MM-dd", new Date());
      return isValid(d) ? d : null;
    }
    const normalized = s.includes("T") ? s : s.replace(" ", "T");
    const d = new Date(normalized);
    return isValid(d) ? d : null;
  }
  if (typeof value === "number") {
    const d = new Date(value);
    return isValid(d) ? d : null;
  }
  return null;
}

/** Formato legible para celdas de fecha (tabla estado). */
export function formatEstadoDateValue(value: unknown): string | null {
  const d = parseDbDate(value);
  if (!d) return null;
  const startOfDay =
    d.getHours() === 0 &&
    d.getMinutes() === 0 &&
    d.getSeconds() === 0 &&
    d.getMilliseconds() === 0;
  if (startOfDay) {
    return format(d, "d 'de' MMMM yyyy", { locale: es });
  }
  return format(d, "d 'de' MMMM yyyy · HH:mm", { locale: es });
}

export function isEstadoDateColumn(columnKey: string): boolean {
  return DATE_COLUMN_KEYS.has(columnKey.toLowerCase());
}

export function isEstadoCampoColumn(columnKey: string): boolean {
  return ESTADO_CAMPO_KEYS.has(columnKey.toLowerCase());
}

export function isActivoColumn(columnKey: string): boolean {
  return columnKey.toLowerCase() === "activo";
}

/** Interpreta valor de columna `activo` (BIT/TINYINT/boolean/string). */
export function isRowActivo(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof Buffer !== "undefined" && Buffer.isBuffer(value)) {
    return value.length > 0 && value[0] === 1;
  }
  const s = String(value).trim().toLowerCase();
  return s === "1" || s === "true" || s === "si" || s === "sí" || s === "yes";
}

function parseIdValue(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "bigint") {
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }
  if (typeof raw === "string" && /^\d+$/.test(raw.trim())) {
    return parseInt(raw.trim(), 10);
  }
  return null;
}

/**
 * ID numérico del registro para PATCH/UPDATE.
 * Prioriza `idEstado` (PK en tabla estado) y cae en `id` si existiera.
 */
export function getEstadoTableRowId(row: Record<string, unknown>): number | null {
  const idEstadoKey = Object.keys(row).find(
    (k) => k.toLowerCase() === "idestado"
  );
  if (idEstadoKey) {
    const n = parseIdValue(row[idEstadoKey]);
    if (n !== null) return n;
  }
  const idKey = Object.keys(row).find((k) => k.toLowerCase() === "id");
  if (idKey) {
    const n = parseIdValue(row[idKey]);
    if (n !== null) return n;
  }
  return null;
}

const COLUMN_ORDER_HINTS = [
  "idestado",
  "id",
  "estado",
  "fechainicio",
  "fechatermino",
  "activo",
  "nombre",
];

/**
 * Une las claves de todas las filas (evita perder columnas si la primera fila no las trae)
 * y ordena de forma estable.
 */
export function getEstadoTableColumnKeys(
  rows: Record<string, unknown>[]
): string[] {
  if (rows.length === 0) {
    return [
      "idEstado",
      "Estado",
      "FechaInicio",
      "FechaTermino",
      "activo",
    ];
  }
  const keys = new Set<string>();
  rows.forEach((r) => Object.keys(r).forEach((k) => keys.add(k)));
  const list = Array.from(keys);
  const score = (k: string) => {
    const i = COLUMN_ORDER_HINTS.indexOf(k.toLowerCase());
    return i === -1 ? 100 : i;
  };
  return list.sort(
    (a, b) => score(a) - score(b) || a.localeCompare(b, "es")
  );
}

export function patchEstadoRowActivo(
  row: Record<string, unknown>,
  newVal: 0 | 1
): Record<string, unknown> {
  const key =
    Object.keys(row).find((k) => k.toLowerCase() === "activo") ?? "activo";
  return { ...row, [key]: newVal };
}

/** Texto mostrado en grilla para la columna Estado (valida y unifica etiquetas). */
export function formatEstadoCampoValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  const s = String(value).trim();
  if (!s) return "—";
  if (isEstadoTablaValor(s)) return s;
  const normalized = s.toLowerCase();
  const match = ESTADO_TABLA_VALORES.find(
    (v) => v.toLowerCase() === normalized
  );
  return match ?? s;
}

/** Nombre del tipo de estado (columna Estado) para mostrar en el botón de activo. */
export function getEstadoNombreFromRow(row: Record<string, unknown>): string {
  const key = Object.keys(row).find((k) => k.toLowerCase() === "estado");
  if (!key) return "—";
  return formatEstadoCampoValue(row[key]);
}

export function formatEstadoCell(columnKey: string, value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object" && !(value instanceof Date)) {
    return JSON.stringify(value);
  }
  if (isEstadoDateColumn(columnKey)) {
    const formatted = formatEstadoDateValue(value);
    return formatted ?? String(value);
  }
  if (isEstadoCampoColumn(columnKey)) {
    return formatEstadoCampoValue(value);
  }
  if (isActivoColumn(columnKey)) {
    return isRowActivo(value) ? "Activo" : "Inactivo";
  }
  return String(value);
}
