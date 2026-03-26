"use server";

import { redirect } from "next/navigation";
import { validarTrabajadorEmpresa } from "@/lib/services/resultados-postulaciones-service";

/**
 * Paso 1 del flujo resultados:
 * valida que el trabajador pertenezca a la empresa seleccionada y redirige.
 */
export async function resultadosSiguienteAction(formData: FormData) {
  const rutTrabajador = (formData.get("rutTrabajador") as string)?.trim() ?? "";
  const rutEmpresa = (formData.get("rutEmpresa") as string)?.trim() ?? "";

  if (!rutTrabajador || !rutEmpresa) {
    redirect("/resultados-sign-in?error=campos");
  }

  const pertenece = await validarTrabajadorEmpresa(rutTrabajador, rutEmpresa);
  if (!pertenece) {
    redirect("/resultados-sign-in?error=no-pertenece");
  }

  redirect(
    `/resultados/consulta?rut=${encodeURIComponent(rutTrabajador)}&empresaRut=${encodeURIComponent(rutEmpresa)}`
  );
}
