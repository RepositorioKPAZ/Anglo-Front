import { getAuthUser, signOutAction } from "@/app/db-auth-actions";
import { SubmitButton } from "@/components/submit-button";

export default async function ProtectedDashboard() {
  const user = await getAuthUser();

  if (!user) {
    return <div>No has iniciado sesión</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Bienvenido a Multibien</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">
          Información de la Empresa
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600">Nombre de Empresa</p>
            <p className="font-medium">{user.Empresa}</p>
          </div>
          <div>
            <p className="text-gray-600">RUT</p>
            <p className="font-medium">{user.Rut}</p>
          </div>
          <div>
            <p className="text-gray-600">Email</p>
            <p className="font-medium">{user.Mail}</p>
          </div>
          <div>
            <p className="text-gray-600">Teléfono</p>
            <p className="font-medium">{user.Telefono || "No especificado"}</p>
          </div>
          <div>
            <p className="text-gray-600">Encargado</p>
            <p className="font-medium">{user.Encargado || "No especificado"}</p>
          </div>
          <div>
            <p className="text-gray-600">Operación</p>
            <p className="font-medium">{user.Operacion || "No especificado"}</p>
          </div>
        </div>
      </div>

      <form action={signOutAction}>
        <SubmitButton
          pendingText="Cerrando sesión..."
          className="bg-red-600 text-white hover:bg-red-700"
        >
          Cerrar Sesión
        </SubmitButton>
      </form>
    </div>
  );
}
