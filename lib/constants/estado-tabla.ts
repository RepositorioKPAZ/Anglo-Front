/** Valores permitidos para la columna `Estado` de la tabla `estado`. */
export const ESTADO_TABLA_VALORES = [
  "Postulación",
  "Resultados",
  "Inactivo",
] as const;

export type EstadoTablaValor = (typeof ESTADO_TABLA_VALORES)[number];

export function isEstadoTablaValor(v: string): v is EstadoTablaValor {
  return (ESTADO_TABLA_VALORES as readonly string[]).includes(v);
}
