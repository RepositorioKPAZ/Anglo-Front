"use client";

import React, { useEffect, useState } from "react";
import { DataTable } from "@/components/tables/data-table";
import { postulacionesNominasColumns } from "@/components/tables/columns/postulaciones-nominas-columns";
import { NominaRow } from "@/lib/utils/excel-reader";
import { Plus } from "lucide-react";
import Spinner from "@/components/Spinner";
import { Button } from "@/components/ui/button";
import Link from "next/link";
export default function NominasPage() {
  const [nominasData, setNominasData] = useState<NominaRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNominas() {
      try {
        const response = await fetch("/api/nominas");

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Error al cargar los datos");
        }

        const data = await response.json();
        setNominasData(data);
      } catch (err) {
        console.error("Error fetching nominas:", err);
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setIsLoading(false);
      }
    }

    fetchNominas();
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 flex justify-center items-center">
        <div className="flex flex-col items-center gap-2">
          <Spinner color="text-blue-500" />
          <div className=" text-muted-foreground font-medium mt-2">
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
          Carga Masiva de Nóminas
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          En esta sección puedes visualizar, gestionar y dar seguimiento a las
          nóminas de trabajadores. Desde aquí podrás cargar nuevas nóminas,
          adjuntar documentación necesaria y filtrar la información según los
          criterios que requieras para facilitar tu trabajo.
        </p>
      </div>{" "}
      <div className="flex pb-4">
        <Button asChild variant="outline">
          <Link href="/carga-masiva">
            <Plus className="mr-2 h-4 w-4" /> Carga Masiva
          </Link>
        </Button>
      </div>
      <DataTable
        columns={postulacionesNominasColumns}
        data={nominasData}
        title="Nóminas Trabajadores"
        searchKey="Nombre Completo"
        searchPlaceholder="Buscar por nombre..."
        enableHorizontalScroll={true}
        enableColumnVisibility={true}
      />
    </div>
  );
}
