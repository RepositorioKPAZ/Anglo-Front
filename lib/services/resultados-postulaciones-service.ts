import { db } from "@/lib/db";

export type ResultadoPostulacionRow = {
  "Rut Trabajador": string;
  "Nombre Trabajador": string;
  "Nombre Beneficiario": string;
  Observaciones: string;
  Resultado: string;
  "Rut Beneficiario": string;
  "Relación": string;
  "Tipo Beca": string;
  "Razón Social": string;
  Puntaje: string;
};

function normalizeKey(key: string): string {
  return key
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function getValueByCandidates(
  row: Record<string, unknown>,
  candidates: string[]
): string {
  const keys = Object.keys(row);
  for (const candidate of candidates) {
    const wanted = normalizeKey(candidate);
    const found = keys.find((k) => normalizeKey(k) === wanted);
    if (found) {
      const val = row[found];
      return val == null ? "" : String(val);
    }
  }
  return "";
}

async function resolveRutTrabajadorColumn(): Promise<string> {
  const columns = await db.query<Array<{ Field: string }>>(
    "SHOW COLUMNS FROM `resultadospostulaciones`"
  );
  const candidateNames = ["RutTrabajador", "Rut_Trabajador", "Rut Trabajador", "Rut"];
  for (const c of candidateNames) {
    const found = columns.find((col) => normalizeKey(col.Field) === normalizeKey(c));
    if (found) return found.Field;
  }
  throw new Error(
    "No se encontró columna de RUT trabajador en resultadospostulaciones"
  );
}

async function resolveEmpresaColumn(): Promise<string> {
  const columns = await db.query<Array<{ Field: string }>>(
    "SHOW COLUMNS FROM `resultadospostulaciones`"
  );
  const candidateNames = ["RutEmpresa", "Rut_Empresa", "Rut Empresa", "EmpresaRut"];
  for (const c of candidateNames) {
    const found = columns.find(
      (col) => normalizeKey(col.Field) === normalizeKey(c)
    );
    if (found) return found.Field;
  }
  throw new Error(
    "No se encontró columna de RUT empresa en resultadospostulaciones"
  );
}

export async function validarTrabajadorEmpresa(
  rutTrabajador: string,
  rutEmpresa: string
): Promise<boolean> {
  const rutColumn = await resolveRutTrabajadorColumn();
  const empresaColumn = await resolveEmpresaColumn();
  const rows = await db.query<Array<{ ok: number }>>(
    `SELECT 1 AS ok
     FROM \`resultadospostulaciones\`
     WHERE \`${rutColumn}\` = ? AND \`${empresaColumn}\` = ?
     LIMIT 1`,
    [rutTrabajador, rutEmpresa]
  );
  return Array.isArray(rows) && rows.length > 0;
}

export async function obtenerResultadosPorRut(
  rutTrabajador: string
): Promise<ResultadoPostulacionRow[]> {
  const rutColumn = await resolveRutTrabajadorColumn();
  const rawRows = await db.query<Record<string, unknown>[]>(
    `SELECT * FROM \`resultadospostulaciones\` WHERE \`${rutColumn}\` = ?`,
    [rutTrabajador]
  );

  return (rawRows ?? []).map((r) => ({
    "Rut Trabajador": getValueByCandidates(r, ["RutTrabajador", "Rut_Trabajador", "Rut Trabajador", "Rut"]),
    "Nombre Trabajador": getValueByCandidates(r, ["NombreTrabajador", "Nombre_Trabajador", "Nombre Trabajador"]),
    "Nombre Beneficiario": getValueByCandidates(r, ["NombreBeneficiario", "Nombre_Beneficiario", "Nombre Beneficiario"]),
    Observaciones: getValueByCandidates(r, ["Resultado"]),
    Resultado: getValueByCandidates(r, ["Resultado"]),
    "Rut Beneficiario": getValueByCandidates(r, ["RutBeneficiario", "Rut_Beneficiario", "Rut Beneficiario"]),
    "Relación": getValueByCandidates(r, ["Relacion", "Relación"]),
    "Tipo Beca": getValueByCandidates(r, ["TipoBeca", "Tipo_Beca", "Tipo Beca"]),
    "Razón Social": getValueByCandidates(r, ["RazonSocial", "Razón Social", "Razon_Social"]),
    Puntaje: getValueByCandidates(r, ["Puntaje"]),
  }));
}
