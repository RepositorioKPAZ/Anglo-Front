import { redirect } from "next/navigation";
import { getAuthUser } from "@/app/db-auth-actions";
import EstadoAdminClient from "./estado-admin-client";

export default async function DashboardEstadoPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/db-sign-in");
  }
  if (user.Empresa !== "admin") {
    redirect("/postulaciones/empresa");
  }
  return <EstadoAdminClient />;
}
