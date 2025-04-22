"use client";
import React, { useState, useEffect, useContext } from "react";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { TableContext } from "@/components/tables/columns/nominas-columns";

type DocumentMetadata = {
  id_doc?: number;
  rowId: string;
  fileName: string;
  uploadDate: string;
  fileType: string;
  fileSize: number;
};

type DocumentStatusCellProps = {
  rowId: string;
  isAdmin?: boolean;
  className?: string;
  rutEmpresa?: string;
};

// Custom event name for document changes
const DOCUMENT_CHANGE_EVENT = "document-status-change";

// Utility function to format bytes to human-readable format
const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

export default function DocumentStatusCell({
  rowId,
  isAdmin = false,
  className,
  rutEmpresa = "",
}: DocumentStatusCellProps) {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null); // Track which document is being deleted
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]); // Replace single document with array
  const [fileInputKey, setFileInputKey] = useState(Date.now()); // For resetting file input

  // Get refreshData function from TableContext if available
  const { refreshData } = useContext(TableContext);

  // Determine API base path based on user role
  const apiBase = "/api/postulaciones/nominas/documents";

  // Check if document exists for this row
  const checkDocument = async () => {
    if (!rowId) return;

    try {
      console.log("Checking documents for rowId:", rowId);
      setLoading(true);
      const response = await fetch(
        `${apiBase}?rowId=${encodeURIComponent(rowId)}`
      );

      if (!response.ok) {
        throw new Error("Error al verificar documento");
      }

      const data = await response.json();
      console.log("Document check response:", data);

      // Handle both new and old API response formats for backward compatibility
      if (Array.isArray(data.documents)) {
        console.log(
          "Setting documents from array:",
          data.documents.length,
          "documents"
        );
        // New format: array of documents
        setDocuments(data.documents);
      } else if (data.exists && data.metadata) {
        console.log("Setting single document from metadata");
        // Old format: single document
        setDocuments(data.metadata ? [data.metadata] : []);
      } else {
        console.log("No documents found");
        // No documents or empty array
        setDocuments([]);
      }
    } catch (error) {
      console.error("Error checking document:", error);
      toast.error("Error al verificar documento");
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  // Trigger document status refresh for all cells
  const triggerDocumentChangeEvent = () => {
    // Dispatch custom event that other DocumentStatusCell components can listen for
    const event = new CustomEvent(DOCUMENT_CHANGE_EVENT);
    window.dispatchEvent(event);

    // If we have a refreshData function from TableContext, use it to refresh the entire table
    if (refreshData) {
      refreshData().catch((err) => {
        console.error("Error refreshing table data:", err);
      });
    }
  };

  // Load document status when component mounts or when document change event fires
  useEffect(() => {
    checkDocument();

    // Listen for document changes triggered by other cells
    const handleDocumentChange = () => {
      checkDocument();
    };

    window.addEventListener(DOCUMENT_CHANGE_EVENT, handleDocumentChange);

    // Clean up event listener on unmount
    return () => {
      window.removeEventListener(DOCUMENT_CHANGE_EVENT, handleDocumentChange);
    };
  }, [rowId]);

  // Handle file upload
  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      console.log("No file selected");
      return;
    }

    console.log(
      "File selected for upload:",
      file.name,
      "Size:",
      file.size,
      "Type:",
      file.type
    );

    // Validate file type
    if (file.type !== "application/pdf") {
      toast.error("Solo se permiten archivos PDF");
      console.error("Invalid file type:", file.type);
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      toast.error(
        `El archivo es demasiado grande. Tamaño máximo: ${formatBytes(maxSize)}`
      );
      console.error("File too large:", file.size, "Max size:", maxSize);
      return;
    }

    try {
      setUploading(true);
      toast.info("Subiendo documento...");
      console.log("Starting upload for rowId:", rowId);

      const formData = new FormData();
      formData.append("rowId", rowId);
      formData.append("file", file);
      formData.append("rutEmpresa", rutEmpresa);

      console.log(
        "FormData prepared:",
        "rowId:",
        rowId,
        "fileName:",
        file.name,
        "rutEmpresa:",
        rutEmpresa
      );

      console.log("Sending POST request to:", apiBase);
      const response = await fetch(apiBase, {
        method: "POST",
        body: formData,
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Upload error response:", errorData);
        throw new Error(errorData.error || "Error al subir documento");
      }

      const result = await response.json();
      console.log("Upload success response:", result);

      // Handle both new and old API response formats for backward compatibility
      if (result.metadata) {
        console.log("Adding document with new format:", result.metadata);
        // New format: metadata of the newly uploaded document
        setDocuments((prev) => [...prev, result.metadata]);
      } else if (result.exists && result.document) {
        console.log("Replacing documents with old format:", result.document);
        // Old format: complete document replacement
        setDocuments([result.document]);
      } else {
        console.error("Invalid response format:", result);
        throw new Error("Formato de respuesta no válido");
      }

      toast.success("Documento subido correctamente");

      // Reset file input
      setFileInputKey(Date.now());

      // Immediately check for documents again to ensure we have the latest data
      await checkDocument();

      // Trigger refresh for all document cells
      triggerDocumentChangeEvent();
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
  const handleDelete = async (event: React.MouseEvent, id_doc: number) => {
    event.preventDefault();
    if (!window.confirm("¿Está seguro que desea eliminar este documento?")) {
      return;
    }

    try {
      setDeleting(id_doc);

      // Construct URL based on whether we have an id_doc
      const deleteUrl = id_doc
        ? `${apiBase}?rowId=${encodeURIComponent(rowId)}&id_doc=${id_doc}`
        : `${apiBase}?rowId=${encodeURIComponent(rowId)}`;

      const response = await fetch(deleteUrl, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al eliminar documento");
      }

      // If deleting a specific document, filter it out
      if (id_doc) {
        setDocuments((prevDocuments) =>
          prevDocuments.filter((doc) => doc.id_doc !== id_doc)
        );
      } else {
        // If using old API that deletes all documents
        setDocuments([]);
      }

      toast.success("Documento eliminado correctamente");

      // Trigger refresh for all document cells
      triggerDocumentChangeEvent();
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error(
        error instanceof Error ? error.message : "Error al eliminar documento"
      );
    } finally {
      setDeleting(null);
    }
  };

  // Handle document download
  const handleDownload = (event: React.MouseEvent, fileName: string) => {
    event.preventDefault();

    try {
      if (!fileName) {
        throw new Error("Nombre de archivo no válido");
      }

      // Construct URL based on whether we have a fileName
      const downloadUrl = `${apiBase}/download?rowId=${encodeURIComponent(rowId)}${
        fileName ? `&fileName=${encodeURIComponent(fileName)}` : ""
      }`;

      // Open download in new tab
      window.open(downloadUrl, "_blank");
    } catch (error) {
      console.error("Error downloading document:", error);
      toast.error(
        error instanceof Error ? error.message : "Error al descargar documento"
      );
    }
  };

  // Handle document view
  const handleView = (event: React.MouseEvent, fileName: string) => {
    event.preventDefault();

    try {
      if (!fileName) {
        throw new Error("Nombre de archivo no válido");
      }

      // Construct URL based on whether we have a fileName
      const viewUrl = `${apiBase}/download?rowId=${encodeURIComponent(rowId)}${
        fileName ? `&fileName=${encodeURIComponent(fileName)}` : ""
      }&view=true`;

      // Open document in a new tab with view=true param to display inline
      window.open(viewUrl, "_blank");
    } catch (error) {
      console.error("Error viewing document:", error);
      toast.error(
        error instanceof Error ? error.message : "Error al visualizar documento"
      );
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
              documents.length > 0 ? "text-blue-500" : "text-muted-foreground"
            }`}
            title={
              documents.length > 0
                ? `${documents.length} ${documents.length === 1 ? "documento adjunto" : "documentos adjuntos"}`
                : "Subir documento"
            }
          >
            {documents.length > 0 ? (
              <div className="relative">
                <Paperclip className="h-4 w-4" />
                {documents.length > 1 && (
                  <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {documents.length}
                  </span>
                )}
              </div>
            ) : (
              <Upload className="h-4 w-4" />
            )}
            <span className="sr-only">
              {documents.length > 0 ? "Documentos adjuntos" : "Subir documento"}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuLabel className="flex justify-between items-center">
            <span>
              {documents.length > 0
                ? `${documents.length} ${documents.length === 1 ? "Documento" : "Documentos"} PDF`
                : "Sin documentos"}
            </span>
            {documents.length > 0 && (
              <div className="text-xs text-muted-foreground">
                {formatBytes(
                  documents.reduce((acc, doc) => acc + doc.fileSize, 0)
                )}
              </div>
            )}
          </DropdownMenuLabel>

          {documents.length > 0 && (
            <div className="max-h-60 overflow-y-auto">
              {documents.map((doc) => (
                <div
                  key={doc.id_doc}
                  className="px-2 py-1.5 border-b last:border-b-0 hover:bg-muted/50"
                >
                  <div className="text-xs font-normal text-muted-foreground mb-1">
                    <div className="font-medium truncate" title={doc.fileName}>
                      {doc.fileName}
                    </div>
                    <div className="flex justify-between">
                      <span>
                        {new Date(doc.uploadDate).toLocaleDateString()}
                      </span>
                      <span>{formatBytes(doc.fileSize)}</span>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={(e) => handleView(e, doc.fileName)}
                    >
                      <FileText className="mr-1 h-3 w-3" />
                      <span>Ver</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={(e) => handleDownload(e, doc.fileName)}
                    >
                      <Download className="mr-1 h-3 w-3" />
                      <span>Descargar</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-destructive"
                      onClick={(e) => handleDelete(e, doc.id_doc!)}
                      disabled={deleting === doc.id_doc}
                    >
                      {deleting === doc.id_doc ? (
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="mr-1 h-3 w-3" />
                      )}
                      <span>Eliminar</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <DropdownMenuSeparator />

          {/* Always show upload option */}
          <div className="p-2 flex flex-col items-center">
            <label className="flex items-center cursor-pointer hover:bg-accent hover:text-accent-foreground duration-200 h-8 px-2 py-1.5 text-sm rounded-sm w-full justify-center bg-blue-500 text-white">
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
            <span className="text-xs text-muted-foreground mt-1">
              (Tamaño máximo 10MB)
            </span>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
