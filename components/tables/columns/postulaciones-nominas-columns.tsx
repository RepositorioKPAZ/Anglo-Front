"use client";

import { ColumnDef, Column, Row } from "@tanstack/react-table";
import { ArrowUpDown, Eye, EyeOff, Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NominaRow } from "@/lib/types/user";
import { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import DocumentStatusCell from "@/components/DocumentStatusCell";
import {
  formatCurrency,
  parseMoneyValue,
  parseGradeValue,
  parseAcademicYear,
} from "@/lib/utils/data-transformations";

// Helper function to create consistent column definitions
function createColumn(
  key: keyof NominaRow,
  header: string,
  width?: string,
  formatter?: (value: any) => ReactNode
) {
  return {
    accessorKey: key,
    header: ({ column }: { column: Column<NominaRow, unknown> }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-medium whitespace-nowrap"
        >
          {header}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }: { row: Row<NominaRow> }) => {
      const value = row.getValue(key as string);
      return (
        <div className={`${width ? width : ""}`}>
          {formatter ? formatter(value) : (value as ReactNode)}
        </div>
      );
    },
    enableHiding: true,
    meta: {
      label: header,
    },
  };
}

export const postulacionesNominasColumns: ColumnDef<NominaRow>[] = [
  {
    accessorKey: "document",
    header: ({ column }: { column: Column<NominaRow, unknown> }) => {
      return <div className="text-center">Documento</div>;
    },
    cell: ({ row }: { row: Row<NominaRow> }) => {
      const rowId = row.original.Rut as string;
      return (
        <DocumentStatusCell
          rowId={rowId}
          rutEmpresa={row.original["Rut Empresa"]}
          isAdmin={true}
        />
      );
    },
    enableHiding: true,
    meta: {
      label: "Documento",
    },
  },
  {
    accessorKey: "edit",
    header: ({ column }: { column: Column<NominaRow, unknown> }) => {
      return <div>Editar</div>;
    },
    cell: ({ row }: { row: Row<NominaRow> }) => {
      const [dialogOpen, setDialogOpen] = useState(false);
      const [editedData, setEditedData] = useState<Partial<NominaRow>>({});
      const [isLoading, setIsLoading] = useState(false);
      const { toast } = useToast();

      useEffect(() => {
        if (dialogOpen) {
          setEditedData(row.original);
        }
      }, [dialogOpen, row.original]);

      const handleInputChange = (
        key: keyof NominaRow,
        value: string | number
      ) => {
        setEditedData((prev) => ({
          ...prev,
          [key]: value,
        }));
      };

      const handleSave = async () => {
        try {
          setIsLoading(true);

          // Apply data transformations to editedData
          const transformedData = { ...editedData };

          // Transform money fields if they exist in the edit data
          if (
            "Remuneracion Mes 1" in editedData &&
            editedData["Remuneracion Mes 1"] !== undefined
          ) {
            transformedData["Remuneracion Mes 1"] = parseMoneyValue(
              editedData["Remuneracion Mes 1"]
            );
          }
          if (
            "Remuneracion Mes 2" in editedData &&
            editedData["Remuneracion Mes 2"] !== undefined
          ) {
            transformedData["Remuneracion Mes 2"] = parseMoneyValue(
              editedData["Remuneracion Mes 2"]
            );
          }
          if (
            "Remuneracion Mes 3" in editedData &&
            editedData["Remuneracion Mes 3"] !== undefined
          ) {
            transformedData["Remuneracion Mes 3"] = parseMoneyValue(
              editedData["Remuneracion Mes 3"]
            );
          }

          // Transform grade value if it exists
          if (
            "Promedio de Notas" in editedData &&
            editedData["Promedio de Notas"] !== undefined
          ) {
            transformedData["Promedio de Notas"] = parseGradeValue(
              editedData["Promedio de Notas"]
            );
          }

          // Transform academic year if it exists
          if (
            "Año Academico" in editedData &&
            editedData["Año Academico"] !== undefined
          ) {
            transformedData["Año Academico"] = parseAcademicYear(
              editedData["Año Academico"]
            );
          }

          console.log("editedData Postulaciones", transformedData);
          const response = await fetch("/api/postulaciones/nominas", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              rowId: row.original.ID,
              updatedData: transformedData,
            }),
          });

          if (!response.ok) {
            throw new Error("Error al actualizar los datos");
          }

          toast({
            title: "Éxito",
            description: "Datos actualizados correctamente",
            variant: "default",
          });
          setDialogOpen(false);
          // Trigger a refresh of the table data
          window.location.reload();
        } catch (error) {
          console.error("Error saving changes:", error);
          toast({
            title: "Error",
            description: "Error al actualizar los datos",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      };

      return (
        <div className="flex items-center justify-center space-x-2">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setDialogOpen(true);
              }}
            >
              <span className="sr-only">Editar</span>
              <Pencil className="h-4 w-4" />
            </Button>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader className="pb-4 border-b">
                <DialogTitle className="text-2xl font-semibold">
                  Editar Postulación
                </DialogTitle>
              </DialogHeader>
              {/* <div className="flex flex-col gap-6 mt-6">
                <div className="text-xl font-semibold text-primary">
                  Acciones Rápidas
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-secondary/50 col-span-2 p-6 rounded-xl border shadow-sm">
                    <div className="text-base font-medium pb-4 text-primary">
                      Documento Adjunto
                    </div>
                    <div className="flex flex-col gap-4">
                      {row.original.Rut && (
                        <DocumentStatusCell
                          rowId={row.original.Rut}
                          isAdmin={true}
                          className="items-start justify-start"
                        />
                      )}
                      <p className="text-xs text-muted-foreground">
                        Puede subir, ver o eliminar el documento PDF asociado a
                        este registro. Solo se permiten archivos PDF.
                      </p>
                    </div>
                  </div>
                </div>
              </div> */}
              <div className="flex flex-col gap-6 mt-8">
                <div className="text-xl font-semibold text-primary">
                  Datos de la Empresa
                </div>
                <div className="grid grid-cols-2 gap-6">
                  {Object.entries(row.original).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex flex-col space-y-1.5 bg-secondary/30 p-3 rounded-lg"
                    >
                      <span className="text-sm font-medium text-primary">
                        {key}
                      </span>
                      {key === "ID" || key === "Rut Empresa" ? (
                        <span className="text-sm text-muted-foreground">
                          {value !== null && typeof value === "object"
                            ? JSON.stringify(value)
                            : String(value)}
                        </span>
                      ) : (
                        <Input
                          value={
                            (editedData[key as keyof NominaRow] as string) || ""
                          }
                          onChange={(e) =>
                            handleInputChange(
                              key as keyof NominaRow,
                              e.target.value
                            )
                          }
                          className="mt-1"
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex justify-end space-x-4 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    disabled={isLoading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="min-w-[100px]"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      "Guardar"
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      );
    },
    enableHiding: true,
    meta: {
      label: "Acciones",
    },
  },
  createColumn("Rut", "RUT", "w-32 text-center"),
  createColumn("Nombre Completo", "Nombre Completo", "min-w-[200px]"),
  createColumn("Email", "Email", "min-w-[200px]"),
  createColumn("Celular", "Celular", "w-32 text-center"),
  createColumn(
    "Remuneracion Mes 1",
    "Remuneración Mes 1",
    "min-w-[150px] text-center",
    formatCurrency
  ),
  createColumn(
    "Remuneracion Mes 2",
    "Remuneración Mes 2",
    "min-w-[150px] text-center",
    formatCurrency
  ),
  createColumn(
    "Remuneracion Mes 3",
    "Remuneración Mes 3",
    "min-w-[150px] text-center",
    formatCurrency
  ),
  createColumn("Nro Hijos", "N° Hijos", "w-32 text-center"),
  createColumn("Nombre Beneficiario", "Nombre Beneficiario", "min-w-[200px]"),
  createColumn("Rut Beneficiario", "RUT Beneficiario", "w-36 text-center"),
  createColumn(
    "Relacion con el Trabajador",
    "Relación con el Trabajador",
    "min-w-[180px] text-center"
  ),
  createColumn(
    "Edad del Beneficiario",
    "Edad del Beneficiario",
    "w-32 text-center"
  ),
  createColumn("Año Academico", "Año Académico", "w-32 text-center"),
  createColumn("Promedio de Notas", "Promedio de Notas", "w-36 text-center"),
  createColumn("Tipo Beca", "Tipo Beca", "w-32 text-center"),
  createColumn("Razon Social", "Razón Social", "min-w-[180px]"),
  createColumn("Rut Empresa", "RUT Empresa", "w-32 text-center"),
  createColumn("Operacion", "Operación", "w-32 text-center"),
  createColumn("Nro Contrato", "N° Contrato", "w-32 text-center"),
  createColumn(
    "Encargado Becas Estudio",
    "Encargado Becas Estudio",
    "min-w-[180px] text-center"
  ),
  createColumn("Mail Encargado", "Mail Encargado", "min-w-[180px]"),
  createColumn("Telefono Encargado", "Teléfono Encargado", "w-32 text-center"),
];

function PasswordManager({ rut }: { rut: string }) {
  const [password, setPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isChanging, setIsChanging] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch the current password
  useEffect(() => {
    async function fetchPassword() {
      console.log("Fetching password for rut:", rut);
      if (!rut) return;

      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/users/password?rut=${encodeURIComponent(rut)}`
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Error al obtener la contraseña");
        }

        const data = await response.json();
        console.log("\nPassword data", data);
        setPassword(data.password || "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
        console.error("Error fetching password:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPassword();
  }, [rut]);

  const handleUpdatePassword = async () => {
    if (!newPassword.trim()) {
      toast({
        title: "Error",
        description: "La nueva contraseña no puede estar vacía",
        variant: "destructive",
      });
      return;
    }

    setIsChanging(true);
    setError(null);
    try {
      const response = await fetch("/api/users/password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rut,
          newPassword: newPassword.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al actualizar la contraseña");
      }

      // Update the displayed password
      setPassword(newPassword.trim());
      setNewPassword("");
      toast({
        title: "Éxito",
        description: "Contraseña actualizada correctamente",
        variant: "default",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      toast({
        title: "Error",
        description:
          err instanceof Error
            ? err.message
            : "Error al actualizar la contraseña",
        variant: "destructive",
      });
      console.error("Error updating password:", err);
    } finally {
      setIsChanging(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Input
            type={showPassword ? "text" : "password"}
            value={password}
            disabled={isLoading}
            readOnly
            className="pr-10"
            placeholder={isLoading ? "Cargando..." : "Contraseña actual"}
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            disabled={isLoading || !password}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {isLoading && <Loader2 className="animate-spin h-5 w-5 text-primary" />}
      </div>

      <div className="pt-2">
        <div className="text-sm font-medium pb-1">Cambiar contraseña</div>
        <div className="flex items-center space-x-2">
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Nueva contraseña"
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter" && newPassword.trim()) {
                handleUpdatePassword();
              }
            }}
          />
          <Button
            onClick={handleUpdatePassword}
            disabled={isChanging || !newPassword.trim()}
            variant="outline"
            size="sm"
          >
            {isChanging ? (
              <Loader2 className="animate-spin h-4 w-4 mr-2" />
            ) : null}
            Guardar
          </Button>
        </div>
      </div>

      {error && <div className="text-sm text-red-500 mt-1">{error}</div>}
    </div>
  );
}
