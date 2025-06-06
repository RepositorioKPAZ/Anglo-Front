import { NextResponse } from "next/server";
import { nominasService } from "@/lib/services/nominas-service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rutEmpresa = searchParams.get('rutEmpresa');
    if (!rutEmpresa) {
      return NextResponse.json(
        { error: 'El RUT de la empresa es requerido' },
        { status: 400 }
      );
    }

    console.log(`Fetching nominas for empresa with RUT: ${rutEmpresa}`);
    const nominas = await nominasService.getNominasByEmpresa(rutEmpresa);
    console.log(`Found ${nominas.length} records for empresa ${rutEmpresa}`);
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
    const payload = await request.json();
    
    // Check if we received an array or a single object
    const nominas = Array.isArray(payload) ? payload : [payload];
    
    if (nominas.length === 0) {
      return NextResponse.json(
        { error: "No se proporcionaron datos válidos" },
        { status: 400 }
      );
    }

    console.log(`POST: Received ${nominas.length} nominas to create`);
    console.log("nominas", nominas);
    
    const createdNominas = [];
    
    for (const nomina of nominas) {
      // Validate required fields
      if (!nomina.Rut || !nomina["Nombre Completo"]) {
        console.warn("Missing required fields in a record:", nomina);
        continue;
      }

      try {
        const createdNomina = await nominasService.createNomina(nomina);
        createdNominas.push(createdNomina);
      } catch (createError) {
        console.error("Error creating individual nomina:", createError);
        // Continue with other records even if one fails
      }
    }

    if (createdNominas.length === 0) {
      return NextResponse.json(
        { error: "No se pudo agregar ninguna nómina. Verifique los datos e intente nuevamente." },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: `${createdNominas.length} nóminas agregadas correctamente`,
      count: createdNominas.length,
      nominas: createdNominas 
    });
  } catch (error) {
    console.error("Error creating nominas:", error);
    return NextResponse.json(
      { error: "Error al agregar las nóminas" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { rowId, updatedData } = await request.json();

    if (!rowId || !updatedData) {
      return NextResponse.json(
        { error: "ID y datos actualizados son requeridos" },
        { status: 400 }
      );
    }

    console.log("PATCH: Updating nomina with identifier:", rowId);
    console.log("PATCH: Updated data:", JSON.stringify(updatedData, null, 2));

    const updatedNomina = await nominasService.updateNomina(rowId, updatedData);
    
    if (!updatedNomina) {
      return NextResponse.json(
        { error: "No se encontró la nómina especificada" },
        { status: 404 }
      );
    }

    console.log("PATCH: Update successful, returning:", JSON.stringify(updatedNomina, null, 2));

    return NextResponse.json({ 
      success: true, 
      message: "Datos actualizados correctamente",
      nomina: updatedNomina
    });
  } catch (error) {
    console.error("Error updating nomina:", error);
    return NextResponse.json(
      { error: "Error al actualizar los datos de la nómina", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { rowId } = await request.json();
    console.log("DELETE: Deleting nomina with identifier:", rowId);
    if (!rowId) {
      return NextResponse.json(
        { error: "ID de fila es requerido" },
        { status: 400 }
      );
    }

    const success = await nominasService.deleteNomina(rowId);
    console.log("DELETE: Success:", success);
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