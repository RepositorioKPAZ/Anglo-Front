import { NextResponse } from "next/server";
import { nominasService } from "@/lib/services/nominas-service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rutEmpresa = searchParams.get("rutEmpresa");

    if (!rutEmpresa) {
      return NextResponse.json(
        { error: "El RUT de la empresa es requerido" },
        { status: 400 }
      );
    }

    const nominas = await nominasService.getNominasByEmpresa(rutEmpresa);
    return NextResponse.json(nominas);
  } catch (error) {
    console.error("Error fetching nominas:", error);
    return NextResponse.json(
      { error: "Error al cargar los datos de nóminas" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { rut, updatedData } = await request.json();

    if (!rut || !updatedData) {
      return NextResponse.json(
        { error: "RUT y datos actualizados son requeridos" },
        { status: 400 }
      );
    }

    const updatedNomina = await nominasService.updateNomina(rut, updatedData);
    
    if (!updatedNomina) {
      return NextResponse.json(
        { error: "No se encontró la nómina especificada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: "Datos actualizados correctamente",
      nomina: updatedNomina
    });
  } catch (error) {
    console.error("Error updating nomina:", error);
    return NextResponse.json(
      { error: "Error al actualizar los datos de la nómina" },
      { status: 500 }
    );
  }
} 