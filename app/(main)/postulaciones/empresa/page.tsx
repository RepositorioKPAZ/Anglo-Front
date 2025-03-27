"use client";
import React, { useEffect, useState } from "react";
import { DataTable } from "@/components/tables/data-table";
import {
  PostulacionEmpresa,
  postulacionesEmpresaColumns,
} from "@/components/tables/columns/postulaciones-empresa-columns";
import Spinner from "@/components/Spinner";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
function EmpresaPage() {
  const [empresaData, setEmpresaData] = useState<PostulacionEmpresa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/postulaciones/empresa");

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Error al cargar los datos");
        }

        const data = await response.json();
        setEmpresaData(data);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 flex justify-center items-center">
        <div className="flex flex-col items-center gap-2">
          <Spinner color="text-blue-500" />
          <div className="text-muted-foreground font-medium mt-2">
            Cargando datos...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Listado de Postulaciones
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Bienvenido al panel de postulaciones empresariales. Aquí podrás
          visualizar, gestionar y dar seguimiento a todas las postulaciones
          recibidas. Puedes agregar nuevas solicitudes, adjuntar documentación
          relevante, y filtrar la información según tus necesidades.
        </p>
      </div>
      <div className="flex pb-4">
        <Button asChild variant="outline">
          <Link href="/postulaciones/carga-masiva">
            <Plus className="mr-2 h-4 w-4" /> Carga Masiva
          </Link>
        </Button>
      </div>
      <DataTable
        columns={postulacionesEmpresaColumns}
        data={empresaData}
        title="Postulaciones Cargadas"
        searchKey="nombreCompleto"
        searchPlaceholder="Buscar por nombre..."
      />
    </div>
  );
}

export default EmpresaPage;
