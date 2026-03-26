import { redirect } from "next/navigation";
import { tipoLoginActivo } from "@/lib/services/estado-service";
import {
  obtenerResultadosPorRut,
  validarTrabajadorEmpresa,
} from "@/lib/services/resultados-postulaciones-service";
import ResultadosConsultaClient from "./resultados-consulta-client";

type Props = {
  searchParams: Promise<{ rut?: string; empresaRut?: string }>;
};

export default async function ResultadosConsultaPage({ searchParams }: Props) {
  const tipo = await tipoLoginActivo();
  if (tipo !== "resultados") {
    if (tipo === "postulacion") redirect("/db-sign-in");
    redirect("/");
  }

  const { rut, empresaRut } = await searchParams;
  const rutTrabajador = rut?.trim() ?? "";
  const rutEmpresa = empresaRut?.trim() ?? "";

  if (!rutTrabajador || !rutEmpresa) {
    redirect("/resultados-sign-in?error=campos");
  }

  const pertenece = await validarTrabajadorEmpresa(rutTrabajador, rutEmpresa);
  if (!pertenece) {
    redirect("/resultados-sign-in?error=no-pertenece");
  }

  const rows = await obtenerResultadosPorRut(rutTrabajador);

  return (
    <div className="min-h-screen w-full bg-background px-4 py-10">
      <div className="mx-auto max-w-[1200px]">
        <ResultadosConsultaClient rows={rows} />
      </div>
    </div>
  );
}
