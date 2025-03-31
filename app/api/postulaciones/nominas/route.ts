import { NextResponse } from "next/server";
import { nominasService } from "@/lib/services/nominas-service";

export async function GET() {
  try {
    const nominas = await nominasService.getAllNominas();
    return NextResponse.json(nominas);
  } catch (error) {
    console.error("Error fetching nominas:", error);
    return NextResponse.json(
      { error: "Error al cargar los datos de nóminas" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const nomina = await request.json();

    // Validate required fields
    if (!nomina.Rut || !nomina["Nombre Completo"] || !nomina["Rut Empresa"]) {
      return NextResponse.json(
        { error: "RUT, Nombre Completo y RUT Empresa son requeridos" },
        { status: 400 }
      );
    }

    const createdNomina = await nominasService.createNomina(nomina);

    return NextResponse.json({ 
      success: true, 
      message: "Nómina agregada correctamente",
      nomina: createdNomina 
    });
  } catch (error) {
    console.error("Error creating nomina:", error);
    return NextResponse.json(
      { error: "Error al agregar la nómina" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { rowId } = await request.json();

    if (!rowId) {
      return NextResponse.json(
        { error: "ID de fila es requerido" },
        { status: 400 }
      );
    }

    const success = await nominasService.deleteNomina(rowId);
    
    if (!success) {
      return NextResponse.json(
        { error: "No se encontró la fila especificada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: "Fila eliminada correctamente"
    });
  } catch (error) {
    console.error("Error deleting nomina:", error);
    return NextResponse.json(
      { error: "Error al eliminar la fila" },
      { status: 500 }
    );
  }
} 