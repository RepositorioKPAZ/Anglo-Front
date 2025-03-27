import React, { useState, useEffect } from "react";
import {
  Paperclip,
  Download,
  Trash2,
  Upload,
  FileText,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type DocumentMetadata = {
  rowId: string;
  fileName: string;
  uploadDate: string;
  fileType: string;
  filePath: string;
  fileSize: number;
};

type DocumentStatusCellProps = {
  rowId: string;
  isAdmin?: boolean;
  className?: string;
};

export default function DocumentStatusCell({
  rowId,
  isAdmin = false,
  className,
}: DocumentStatusCellProps) {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [documentExists, setDocumentExists] = useState(false);
  const [metadata, setMetadata] = useState<DocumentMetadata | null>(null);
  const [fileInputKey, setFileInputKey] = useState(Date.now()); // For resetting file input

  // Determine API base path based on user role
  const apiBase = "/api/postulaciones/nominas/documents";

  // Check if document exists for this row
  const checkDocument = async () => {
    if (!rowId) return;

    try {
      setLoading(true);
      const response = await fetch(
        `${apiBase}?rowId=${encodeURIComponent(rowId)}`
      );

      if (!response.ok) {
        throw new Error("Error al verificar documento");
      }

      const data = await response.json();
      setDocumentExists(data.exists);
      setMetadata(data.metadata);
    } catch (error) {
      console.error("Error checking document:", error);
      toast.error("Error al verificar documento");
    } finally {
      setLoading(false);
    }
  };

  // Load document status when component mounts
  useEffect(() => {
    checkDocument();
  }, [rowId]);

  // Handle file upload
  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== "application/pdf") {
      toast.error("Solo se permiten archivos PDF");
      return;
    }

    try {
      setUploading(true);
      toast.info("Subiendo documento...");

      const formData = new FormData();
      formData.append("rowId", rowId);
      formData.append("file", file);

      const response = await fetch(apiBase, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al subir documento");
      }

      const result = await response.json();

      setDocumentExists(true);
      setMetadata(result.metadata);
      toast.success("Documento subido correctamente");

      // Reset file input
      setFileInputKey(Date.now());
    } catch (error) {
      console.error("Error uploading document:", error);
      toast.error(
        error instanceof Error ? error.message : "Error al subir documento"
      );
    } finally {
      setUploading(false);
    }
  };

  // Handle document deletion
  const handleDelete = async () => {
    if (!window.confirm("¿Está seguro que desea eliminar este documento?")) {
      return;
    }

    try {
      setDeleting(true);

      const response = await fetch(
        `${apiBase}?rowId=${encodeURIComponent(rowId)}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al eliminar documento");
      }

      setDocumentExists(false);
      setMetadata(null);
      toast.success("Documento eliminado correctamente");
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error(
        error instanceof Error ? error.message : "Error al eliminar documento"
      );
    } finally {
      setDeleting(false);
    }
  };

  // Handle document download
  const handleDownload = () => {
    if (!documentExists || !metadata) {
      toast.error("No hay documento para descargar");
      return;
    }

    // Open download in new tab
    window.open(
      `${apiBase}/download?rowId=${encodeURIComponent(rowId)}`,
      "_blank"
    );
  };

  // Handle document view
  const handleView = () => {
    if (!documentExists || !metadata) {
      toast.error("No hay documento para visualizar");
      return;
    }

    // Open document in new tab (public path)
    if (metadata.filePath) {
      window.open(metadata.filePath, "_blank");
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 w-8 p-0 ${
              documentExists ? "text-blue-500" : "text-muted-foreground"
            }`}
          >
            {documentExists ? (
              <Paperclip className="h-4 w-4" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            <span className="sr-only">
              {documentExists ? "Documento adjunto" : "Subir documento"}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            {documentExists ? "Documento PDF" : "Sin documento"}
          </DropdownMenuLabel>

          {documentExists && metadata && (
            <>
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                Subido: {new Date(metadata.uploadDate).toLocaleDateString()}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleView}>
                <FileText className="mr-2 h-4 w-4" />
                <span>Ver documento</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                <span>Descargar</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                disabled={deleting}
                className="text-destructive focus:text-destructive"
              >
                {deleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                <span>Eliminar</span>
              </DropdownMenuItem>
            </>
          )}

          {!documentExists && (
            <>
              <DropdownMenuSeparator />
              <div className="p-2">
                <label className="flex items-center cursor-pointer hover:bg-accent hover:text-accent-foreground h-8 px-2 py-1.5 text-sm rounded-sm">
                  <input
                    type="file"
                    className="hidden"
                    accept="application/pdf"
                    onChange={handleUpload}
                    key={fileInputKey}
                    disabled={uploading}
                  />
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Subiendo...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      <span>Subir PDF</span>
                    </>
                  )}
                </label>
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
