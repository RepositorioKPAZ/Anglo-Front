'use client';

import { ColumnDef, Column, Row } from '@tanstack/react-table';
import {
  ArrowUpDown,
  Pencil,
  Eye,
  EyeOff,
  Loader2,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { User } from '@/lib/types/user';
import { ReactNode, useState, useEffect, useContext } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { TableContext } from '@/components/tables/columns/nominas-columns';

// Helper function to create consistent column definitions
function createColumn(
  key: keyof User,
  header: string,
  width?: string,
  formatter?: (value: any) => ReactNode
) {
  return {
    accessorKey: key,
    header: ({ column }: { column: Column<User, unknown> }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="font-medium whitespace-nowrap"
        >
          {header}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }: { row: Row<User> }) => {
      const value = row.getValue(key as string);
      return (
        <div className={`${width ? width : ''}`}>
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

function PasswordManager({
  currentPassword,
  rut,
  onPasswordChange,
  refreshData,
}: {
  currentPassword: string;
  rut: string;
  onPasswordChange: (newPassword: string) => void;
  refreshData?: () => Promise<void>;
}) {
  const [password, setPassword] = useState<string>(currentPassword);
  const [newPassword, setNewPassword] = useState<string>('');
  const [isChanging, setIsChanging] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdatePassword = async () => {
    if (!newPassword.trim()) {
      toast.error('La nueva contraseña no puede estar vacía');
      return;
    }

    setIsChanging(true);
    setError(null);
    try {
      const response = await fetch('/api/dashboard/empresas/password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rut,
          newPassword: newPassword.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar la contraseña');
      }

      // Update the displayed password
      setPassword(newPassword.trim());
      setNewPassword('');
      onPasswordChange(newPassword.trim());
      toast.success('Contraseña actualizada correctamente');

      // Refresh data if available
      if (refreshData) {
        await refreshData();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      toast.error(
        err instanceof Error ? err.message : 'Error al actualizar la contraseña'
      );
      console.error('Error updating password:', err);
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
            type={'text'}
            value={showPassword ? password : '•'.repeat(password.length)}
            readOnly
            name="pmCurrentPassword" // Cambiado a un identificador único
            id="pmCurrentPassword" // Cambiado a un identificador único
            autoFocus={false}
            className="pr-10"
            placeholder="Contraseña actual"
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            disabled={!password}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
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
            name="newPassword"
            id="newPassword"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newPassword.trim()) {
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

function DeleteButton({
  rut,
  onDelete,
  refreshData,
}: {
  rut: string;
  onDelete: () => void;
  refreshData?: () => Promise<void>;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (
      !confirm(
        '¿Está seguro que desea eliminar esta empresa? Esta acción no se puede deshacer.'
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch('/api/dashboard/empresas', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rut }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar la empresa');
      }

      toast.success('Empresa eliminada correctamente');
      onDelete();

      // Use refreshData instead of relying on onDelete to reload page
      if (refreshData) {
        await refreshData();
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Error al eliminar la empresa'
      );
      console.error('Error deleting empresa:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleDelete}
      disabled={isDeleting}
      className="w-full"
    >
      {isDeleting ? (
        <Loader2 className="animate-spin h-4 w-4 mr-2" />
      ) : (
        <Trash2 className="h-4 w-4 mr-2" />
      )}
      Eliminar Empresa
    </Button>
  );
}

export const empresasColumns: ColumnDef<User>[] = [
  {
    accessorKey: 'edit',
    header: ({ column }: { column: Column<User, unknown> }) => {
      return <div>Editar</div>;
    },
    cell: ({ row }: { row: Row<User> }) => {
      const [dialogOpen, setDialogOpen] = useState(false);
      const [editedData, setEditedData] = useState<Partial<User>>({});
      const [isLoading, setIsLoading] = useState(false);
      const { refreshData } = useContext(TableContext);

      useEffect(() => {
        if (dialogOpen) {
          setEditedData(row.original);
        }
      }, [dialogOpen, row.original]);

      const handleInputChange = (key: keyof User, value: string | number) => {
        setEditedData((prev) => ({
          ...prev,
          [key]: value,
        }));
      };

      const handleSave = async () => {
        try {
          setIsLoading(true);
          const response = await fetch('/api/dashboard/empresas', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              rut: row.original.Rut,
              updatedData: editedData,
            }),
          });

          if (!response.ok) {
            throw new Error('Error al actualizar los datos');
          }

          toast.success('Datos actualizados correctamente');
          setDialogOpen(false);

          // Use refreshData instead of page reload
          if (refreshData) {
            await refreshData();
          }
        } catch (error) {
          console.error('Error saving changes:', error);
          toast.error('Error al actualizar los datos');
        } finally {
          setIsLoading(false);
        }
      };

      return (
        <div className="flex items-center justify-center space-x-2">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <Button
              variant="ghost"
              type="button"
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
                  Detalles de la Empresa
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-6 mt-6">
                <div className="text-xl font-semibold text-primary">
                  Gestión de Contraseña
                </div>
                <div className="bg-secondary/50 p-6 rounded-xl border shadow-sm">
                  <div className="text-base font-medium pb-4 text-primary">
                    Contraseña de Acceso
                  </div>
                  <PasswordManager
                    currentPassword={row.original.Empresa_C || ''}
                    rut={row.original.Rut || ''}
                    onPasswordChange={(newPassword) => {
                      // Update the row data with the new password
                      row.original.Empresa_C = newPassword;
                    }}
                    refreshData={refreshData}
                  />
                </div>

                <div className="text-xl font-semibold text-primary">
                  Información de la Empresa
                </div>
                <div className="grid grid-cols-2 gap-6">
                  {Object.entries(row.original).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex flex-col space-y-1.5 bg-secondary/30 p-3 rounded-lg"
                    >
                      <span className="text-sm font-medium text-primary">
                        {key === 'ID' && 'ID'}
                        {key === 'Rut' && 'RUT'}
                        {key === 'Empresa' && 'Nombre de la Empresa'}
                        {key === 'Operacion' && 'Operación'}
                        {key === 'Encargado' && 'Encargado'}
                        {key === 'Mail' && 'Email'}
                        {key === 'Telefono' && 'Teléfono'}
                        {key === 'Empresa_C' && 'Contraseña'}
                      </span>
                      {key === 'Empresa_C' ? (
                        <span className="text-sm text-muted-foreground">
                          {value !== null && typeof value === 'object'
                            ? JSON.stringify(value)
                            : String(value)}
                        </span>
                      ) : key === 'ID' ? (
                        <Input
                          value={
                            (editedData[key as keyof User] as string) || ''
                          }
                          name={key}
                          id={key}
                          readOnly
                          className="mt-1 bg-gray-100 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none"
                        />
                      ) : (
                        <Input
                          value={
                            (editedData[key as keyof User] as string) || ''
                          }
                          name={key}
                          id={key}
                          onChange={(e) =>
                            handleInputChange(key as keyof User, e.target.value)
                          }
                          className="mt-1"
                        />
                      )}
                    </div>
                  ))}
                </div>

                <div className="text-xl font-semibold text-destructive">
                  Zona de Peligro
                </div>
                <div className="bg-destructive/10 p-6 rounded-xl border border-destructive/20">
                  <div className="text-base font-medium pb-4 text-destructive">
                    Eliminar Empresa
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Esta acción eliminará permanentemente la empresa y todos sus
                    datos asociados. Esta acción no se puede deshacer.
                  </p>
                  <DeleteButton
                    rut={row.original.Rut || ''}
                    onDelete={() => {
                      setDialogOpen(false);
                      // No need to reload the page
                    }}
                    refreshData={refreshData}
                  />
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
                      'Guardar'
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
      label: 'Acciones',
    },
  },
  createColumn('ID', 'ID', 'w-16 text-center'),
  createColumn('Rut', 'RUT', 'w-32 text-center'),
  createColumn('Empresa', 'Empresa', 'min-w-[200px]'),
  createColumn('Operacion', 'Operación', 'w-32 text-center'),
  createColumn('Encargado', 'Encargado', 'min-w-[180px]'),
  createColumn('Mail', 'Email', 'min-w-[200px]'),
  createColumn('Telefono', 'Teléfono', 'w-32 text-center'),
  createColumn('Empresa_C', 'Contraseña', 'min-w-[150px]'),
];
