import { signOutAction } from "@/app/db-auth-actions";
import Link from "next/link";
import { Button } from "./ui/button";
import { getAuthUser } from "@/app/db-auth-actions";

export default async function AuthButton() {
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
      <Button asChild size="sm" variant={"outline"}>
        <Link href="/db-sign-in">Ingresar</Link>
      </Button>
      {/* <Button asChild size="sm" variant={"default"}>
        <Link href="/sign-up">Registrarse</Link>
      </Button> */}
    </div>
  );
}
