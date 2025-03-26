import { redirect } from "next/navigation";
import { getAuthUser } from "@/app/db-auth-actions";

export default async function DashboardPage() {
  const user = await getAuthUser();

  if (!user) {
    redirect("/db-sign-in");
  }

  // Redirect to appropriate page based on user type
  if (user.Empresa === "admin") {
    redirect("/dashboard/nominas");
  } else {
    redirect("/postulaciones/empresa");
  }
}
