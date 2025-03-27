import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { getDocumentMetadata } from "@/lib/utils/document-utils";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const rowId = url.searchParams.get("rowId");

    if (!rowId) {
      return NextResponse.json(
        { error: "El ID de la fila es requerido" },
        { status: 400 }
      );
    }

    const metadata = getDocumentMetadata(rowId);
    if (!metadata) {
      return NextResponse.json(
        { error: "No se encontró el documento" },
        { status: 404 }
      );
    }

    const filePath = path.join(process.cwd(), "public", metadata.filePath);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: "El archivo no existe" },
        { status: 404 }
      );
    }

    // Read the file
    const fileBuffer = fs.readFileSync(filePath);
    const headers = new Headers();
    headers.set("Content-Type", "application/pdf");
    headers.set(
      "Content-Disposition",
      `attachment; filename="${metadata.fileName}"`
    );

    return new NextResponse(fileBuffer, {
      headers,
    });
  } catch (error) {
    console.error("Error downloading document:", error);
    return NextResponse.json(
      { error: "Error al descargar el documento" },
      { status: 500 }
    );
  }
} 