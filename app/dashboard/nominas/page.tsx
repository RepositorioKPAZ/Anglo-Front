"use client";

import React, { useEffect, useState } from "react";
import { DataTable } from "@/components/tables/data-table";
import { nominasColumns } from "@/components/tables/columns/nominas-columns";
import { NominaRow } from "@/lib/types/user";
import { Info } from "lucide-react";
import Spinner from "@/components/spinner";

export default function NominasPage() {
  const [nominasData, setNominasData] = useState<NominaRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNominas() {
      try {
        console.log("Fetching nominas data...");
        const response = await fetch("/api/dashboard/nominas");

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Error al cargar los datos");
        }

        const data = await response.json();
        console.log("Nominas data fetched:", data);

        if (Array.isArray(data) && data.length > 0) {
          setNominasData(data);
        } else {
          console.warn("No nominas data received or empty array:", data);
          setError("No se encontraron datos de nóminas");
        }
      } catch (err) {
        console.error("Error fetching nominas:", err);
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setIsLoading(false);
      }
    }

    fetchNominas();
  }, []);

  // Debug: Display state in development
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("Current nominasData state:", nominasData);
    }
  }, [nominasData]);

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
      <div className="space-y-2 pb-4">
        <h1 className="text-3xl font-bold tracking-tight">Panel de Control</h1>
        <p className="text-muted-foreground max-w-2xl">
          Bienvenido al panel de control. Aquí podrás gestionar y visualizar
          toda la información relacionada con las nóminas de trabajadores.
          Utiliza la tabla interactiva para filtrar, ordenar y exportar los
          datos según tus necesidades.
        </p>
      </div>

      <div className="rounded-lg p-6 border bg-card">
        <DataTable
          columns={nominasColumns}
          data={nominasData}
          title="Nóminas Trabajadores"
          searchKeys={["Nombre Completo", "Razon Social"]}
          searchPlaceholder="Buscar por nombre o empresa..."
          enableHorizontalScroll={true}
          enableColumnVisibility={true}
          enableExport={true}
          exportFileName="nominas-trabajadores"
          // agregarRegistroAdmin={true}
        />
      </div>
    </div>
  );
}
