import { signOutAction } from "@/app/db-auth-actions";
import Link from "next/link";
import { Button } from "./ui/button";
import { getAuthUser } from "@/app/db-auth-actions";

type HeaderAuthProps = {
  /** Si el visitante no tiene sesión, ¿mostrar el botón Ingresar? (p. ej. según ventana en tabla estado). Por defecto true. */
  mostrarIngresoInvitado?: boolean;
  /** Destino del botón Ingresar (postulación vs resultados). Por defecto login empresa. */
  hrefIngreso?: string;
};

export default async function AuthButton({
  mostrarIngresoInvitado = true,
  hrefIngreso = "/db-sign-in",
}: HeaderAuthProps) {
  const user = await getAuthUser();

  return user ? (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium">{user.Empresa}</span>
        <div className="h-4 w-px bg-muted-foreground/30"></div>
        <span className="text-muted-foreground">{user.Rut}</span>
      </div>
      <form action={signOutAction}>
        <Button type="submit" variant={"outline"}>
          Cerrar sesión
        </Button>
      </form>
    </div>
  ) : (
    <div className="flex gap-2">
      {mostrarIngresoInvitado ? (
        <Button asChild size="sm" variant={"outline"}>
          <Link href={hrefIngreso}>Ingresar</Link>
        </Button>
      ) : null}
      {/* <Button asChild size="sm" variant={"default"}>
        <Link href="/sign-up">Registrarse</Link>
      </Button> */}
    </div>
  );
}
