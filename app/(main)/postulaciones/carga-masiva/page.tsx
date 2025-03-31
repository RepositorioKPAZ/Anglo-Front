"use client";

import React, { useEffect, useState } from "react";
import { DataTable } from "@/components/tables/data-table";
import { postulacionesNominasColumns } from "@/components/tables/columns/postulaciones-nominas-columns";
import { NominaRow } from "@/lib/types/user";
import { Plus, ClipboardPaste, Info, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Link from "next/link";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Spinner from "@/components/spinner";

export default function NominasPage() {
  const [nominasData, setNominasData] = useState<NominaRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPasting, setIsPasting] = useState(false);
  const [pasteData, setPasteData] = useState("");
  const [parsedRows, setParsedRows] = useState<NominaRow[]>([]);
  const [showPasteArea, setShowPasteArea] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    async function fetchNominas() {
      try {
        const response = await fetch("/api/postulaciones/nominas");

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

  const handlePasteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setPasteData(value);

    // Parse the pasted data immediately for preview
    if (value.trim()) {
      const rows = value.split("\n").map((row) => {
        const values = row.split("\t");
        return {
          Rut: values[0] || "",
          "Nombre Completo": values[1] || "",
          Email: values[2] || "",
          Celular: values[3] || "",
          "Remuneracion Mes 1": parseFloat(values[4]) || 0,
          "Remuneracion Mes 2": parseFloat(values[5]) || 0,
          "Remuneracion Mes 3": parseFloat(values[6]) || 0,
          "Nro Hijos": parseInt(values[7]) || 0,
          "Nombre Beneficiario": values[8] || "",
          "Rut Beneficiario": values[9] || "",
          "Relacion con el Trabajador": values[10] || "",
          "Edad del Beneficiario": parseInt(values[11]) || 0,
          "Año Academico": values[12] || "",
          "Promedio de Notas": parseFloat(values[13]) || 0,
          "Tipo Beca": values[14] || "",
          "Razon Social": values[15] || "",
          "Rut Empresa": values[16] || "",
          Operacion: values[17] || "",
          "Nro Contrato": values[18] || "",
          "Encargado Becas Estudio": values[19] || "",
          "Mail Encargado": values[20] || "",
          "Telefono Encargado": values[21] || "",
        };
      });
      setParsedRows(rows);
    } else {
      setParsedRows([]);
    }
  };

  const formatCurrency = (value: number) => {
    if (!value && value !== 0) return "";
    return `$${value.toLocaleString("es-CL")}`;
  };

  const handlePaste = async () => {
    if (!pasteData.trim()) {
      toast.error("Por favor, pegue los datos primero");
      return;
    }

    setIsPasting(true);
    try {
      const response = await fetch("/api/postulaciones/nominas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsedRows),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al agregar los datos");
      }

      // Refresh the data
      const updatedResponse = await fetch("/api/postulaciones/nominas");
      const updatedData = await updatedResponse.json();
      setNominasData(updatedData);

      // Clear the paste data
      setPasteData("");
      setParsedRows([]);
      setShowPasteArea(false);
      toast.success("Datos agregados correctamente");
    } catch (err) {
      console.error("Error pasting data:", err);
      toast.error(
        err instanceof Error ? err.message : "Error al agregar los datos"
      );
    } finally {
      setIsPasting(false);
    }
  };

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
          Carga Masiva de Nóminas
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          En esta sección puedes visualizar, gestionar y dar seguimiento a las
          nóminas de trabajadores. Desde aquí podrás cargar nuevas nóminas,
          adjuntar documentación necesaria y filtrar la información según los
          criterios que requieras para facilitar tu trabajo.
        </p>
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

      <div className="pb-12">
        <div className="flex flex-col gap-4 mb-6 border rounded-lg shadow-sm bg-primary/5 p-8">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-bold">Agregar Datos</h2>
            <p className="text-muted-foreground max-w-2xl">
              Copia y pega datos desde Excel para cargar información de forma
              masiva. Asegúrate de que los datos incluyan las columnas
              requeridas como RUT, nombre completo, email, celular y
              remuneraciones mensuales.
            </p>
          </div>
          <div className="flex-1 flex items-center gap-3 px-2 py-6">
            <Textarea
              placeholder="Pegue los datos de Excel aquí..."
              value={pasteData}
              onChange={handlePasteChange}
              className="h-10 min-h-[80px] py-2 bg-white text-muted-foreground"
            />
            <Button
              onClick={handlePaste}
              disabled={isPasting || !pasteData.trim()}
              className="whitespace-nowrap"
            >
              {isPasting ? "Agregando..." : "Agregar Datos"}
            </Button>
            {/* {parsedRows.length > 0 && (
                <Badge variant="outline" className="ml-2">
                  {parsedRows.length} filas detectadas
                </Badge>
              )} */}
          </div>
          {parsedRows.length > 0 && (
            <div className=" overflow-hidden">
              <div className="py-4 px-2">
                <div className="overflow-x-auto">
                  <div className="max-h-[420px] overflow-y-auto border rounded-2xl bg-white">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-muted text-muted-foreground">
                          <th className="p-2 border sticky top-0 bg-muted z-10">
                            RUT
                          </th>
                          <th className="p-2 border sticky top-0 bg-muted z-10">
                            Nombre Completo
                          </th>
                          <th className="p-2 border sticky top-0 bg-muted z-10">
                            Email
                          </th>
                          <th className="p-2 border sticky top-0 bg-muted z-10">
                            Celular
                          </th>
                          <th className="p-2 border sticky top-0 bg-muted z-10">
                            Remuneración Mes 1
                          </th>
                          <th className="p-2 border sticky top-0 bg-muted z-10">
                            Remuneración Mes 2
                          </th>
                          <th className="p-2 border sticky top-0 bg-muted z-10">
                            Remuneración Mes 3
                          </th>
                          <th className="p-2 border sticky top-0 bg-muted z-10">
                            N° Hijos
                          </th>
                          <th className="p-2 border sticky top-0 bg-muted z-10">
                            Nombre Beneficiario
                          </th>
                          <th className="p-2 border sticky top-0 bg-muted z-10">
                            RUT Beneficiario
                          </th>
                          <th className="p-2 border sticky top-0 bg-muted z-10">
                            Relación con el Trabajador
                          </th>
                          <th className="p-2 border sticky top-0 bg-muted z-10">
                            Edad del Beneficiario
                          </th>
                          <th className="p-2 border sticky top-0 bg-muted z-10">
                            Año Académico
                          </th>
                          <th className="p-2 border sticky top-0 bg-muted z-10">
                            Promedio de Notas
                          </th>
                          <th className="p-2 border sticky top-0 bg-muted z-10">
                            Tipo Beca
                          </th>
                          <th className="p-2 border sticky top-0 bg-muted z-10">
                            Razón Social
                          </th>
                          <th className="p-2 border sticky top-0 bg-muted z-10">
                            RUT Empresa
                          </th>
                          <th className="p-2 border sticky top-0 bg-muted z-10">
                            Operación
                          </th>
                          <th className="p-2 border sticky top-0 bg-muted z-10">
                            N° Contrato
                          </th>
                          <th className="p-2 border sticky top-0 bg-muted z-10">
                            Encargado Becas Estudio
                          </th>
                          <th className="p-2 border sticky top-0 bg-muted z-10">
                            Mail Encargado
                          </th>
                          <th className="p-2 border sticky top-0 bg-muted z-10">
                            Teléfono Encargado
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedRows.map((row, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-2 border">{row.Rut}</td>
                            <td className="p-2 border">
                              {row["Nombre Completo"]}
                            </td>
                            <td className="p-2 border">{row.Email}</td>
                            <td className="p-2 border">{row.Celular}</td>
                            <td className="p-2 border">
                              {formatCurrency(row["Remuneracion Mes 1"] || 0)}
                            </td>
                            <td className="p-2 border">
                              {formatCurrency(row["Remuneracion Mes 2"] || 0)}
                            </td>
                            <td className="p-2 border">
                              {formatCurrency(row["Remuneracion Mes 3"] || 0)}
                            </td>
                            <td className="p-2 border">{row["Nro Hijos"]}</td>
                            <td className="p-2 border">
                              {row["Nombre Beneficiario"]}
                            </td>
                            <td className="p-2 border">
                              {row["Rut Beneficiario"]}
                            </td>
                            <td className="p-2 border">
                              {row["Relacion con el Trabajador"]}
                            </td>
                            <td className="p-2 border">
                              {row["Edad del Beneficiario"]}
                            </td>
                            <td className="p-2 border">
                              {row["Año Academico"]}
                            </td>
                            <td className="p-2 border">
                              {row["Promedio de Notas"]}
                            </td>
                            <td className="p-2 border">{row["Tipo Beca"]}</td>
                            <td className="p-2 border">
                              {row["Razon Social"]}
                            </td>
                            <td className="p-2 border">{row["Rut Empresa"]}</td>
                            <td className="p-2 border">{row.Operacion}</td>
                            <td className="p-2 border">
                              {row["Nro Contrato"]}
                            </td>
                            <td className="p-2 border">
                              {row["Encargado Becas Estudio"]}
                            </td>
                            <td className="p-2 border">
                              {row["Mail Encargado"]}
                            </td>
                            <td className="p-2 border">
                              {row["Telefono Encargado"]}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Info className="h-4 w-4" />
                    <span>
                      Deslice horizontalmente para ver todas las columnas.
                    </span>
                  </div>
                  <Button
                    onClick={() => {
                      setPasteData("");
                      setParsedRows([]);
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Limpiar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
