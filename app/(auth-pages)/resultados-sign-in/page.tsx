import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import multibienLogo from "@/lib/images/multibien-logo.webp";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";
import { FormMessage, Message } from "@/components/form-message";
import { tipoLoginActivo } from "@/lib/services/estado-service";
import { companyService } from "@/lib/services/company-service";
import { resultadosSiguienteAction } from "@/app/resultados-auth-actions";
import ResultadosCompanySelector from "@/components/resultados-company-selector";
import type { User } from "@/lib/types/user";

export default async function ResultadosSignInPage(props: {
  searchParams: Promise<Message & { error?: string }>;
}) {
  const searchParams = await props.searchParams;
  const tipo = await tipoLoginActivo();

  if (tipo === "ninguno") {
    redirect("/");
  }
  if (tipo === "postulacion") {
    redirect("/db-sign-in");
  }

  let empresas: User[] = [];
  try {
    empresas = await companyService.getAllCompanies();
  } catch {
    empresas = [];
  }
  const empresasOrdenadas = [...empresas].sort((a, b) =>
    (a.Empresa || "").localeCompare(b.Empresa || "", "es", {
      sensitivity: "base",
    })
  );

  return (
    <form className="flex-1 flex flex-col min-w-64">
      <div className="flex justify-start mb-4">
        <Link href={"/"}>
          <Image
            src={multibienLogo}
            alt="Multibien Logo"
            width={90}
            height={30}
            priority
          />
        </Link>
      </div>
      <h1 className="text-2xl font-medium">Resultados de postulaciones</h1>
      <p className="text-sm text-muted-foreground mt-2">
        Ingrese los siguientes datos:
      </p>
      <div className="flex flex-col gap-4 mt-8">
        <div className="flex flex-col gap-2">
          <Label htmlFor="rutTrabajador">Rut del Trabajador</Label>
          <Input
            id="rutTrabajador"
            name="rutTrabajador"
            placeholder="Ej. 12.345.678-9"
            required
            autoComplete="off"
          />
        </div>
        <ResultadosCompanySelector companies={empresasOrdenadas} />
        <SubmitButton
          pendingText="Cargando..."
          formAction={resultadosSiguienteAction}
          className="bg-accent text-accent-foreground"
        >
          Siguiente
        </SubmitButton>
        <FormMessage message={searchParams} />
        {searchParams?.error === "campos" && (
          <p className="text-sm text-destructive">
            Debe completar el RUT del trabajador y seleccionar una empresa.
          </p>
        )}
        {searchParams?.error === "no-pertenece" && (
          <p className="text-sm text-destructive">
            El RUT del trabajador no pertenece a la empresa seleccionada.
          </p>
        )}
      </div>
    </form>
  );
}
