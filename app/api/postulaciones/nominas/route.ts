import { NextResponse } from "next/server";
import { nominasService } from "@/lib/services/nominas-service";
import { getAuthUser } from "@/app/db-auth-actions";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const isDebugMode = searchParams.get('debug') === 'true';
    
    // Get the authenticated user
    const user = await getAuthUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }
    
    console.log("GET nominas: Authenticated user:", JSON.stringify(user, null, 2));
    let nominas;
    
    // Get all nominas first
    nominas = await nominasService.getAllNominas();
    console.log(`GET nominas: Found ${nominas?.length || 0} total nominas`);
    
    // Filter nominas for non-admin users
    if (user.Empresa !== "admin" && !isDebugMode) {
      console.log(`User empresa: ${user.Empresa}`);
      
      // Filter nominas based on empresa
      const filteredNominas = nominas.filter(n => 
        n["Rut Empresa"] === user.Rut || 
        // Try different field formats just in case
        (n as any).RutEmpresa === user.Rut ||
        (n as any).empresa_rut === user.Empresa
      );
      
      console.log(`Filtered to ${filteredNominas.length} nominas for this empresa`);
      
      // Return the filtered nominas
      return NextResponse.json(filteredNominas);
    }
    
    // For admin users or debug mode, return all nominas
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
    // Get the authenticated user
    const user = await getAuthUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }
    
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
    
    const createdNominas = [];
    
    for (const nomina of nominas) {
      // Validate required fields
      if (!nomina.Rut || !nomina["Nombre Completo"]) {
        console.warn("Missing required fields in a record:", nomina);
        continue;
      }

      try {
        // Set the empresa field to the logged-in user's empresa (unless admin)
        if (user.Empresa !== "admin") {
          nomina["Rut Empresa"] = user.Empresa;
        }
        
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
    // Get the authenticated user
    const user = await getAuthUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    const { rowId, updatedData } = await request.json();

    if (!rowId || !updatedData) {
      return NextResponse.json(
        { error: "ID y datos actualizados son requeridos" },
        { status: 400 }
      );
    }

    console.log("PATCH: Updating nomina with identifier:", rowId);
    console.log("PATCH: Updated data:", JSON.stringify(updatedData, null, 2));

    // If not admin, first check if the nomina belongs to the user's empresa
    if (user.Empresa !== "admin") {
      // Fetch the nomina to check ownership
      let existingNomina;
      
      // Try to find by ID (numeric) or RUT
      if (/^\d+$/.test(rowId)) {
        const allNominas = await nominasService.getAllNominas();
        existingNomina = allNominas.find(n => String(n.ID) === rowId);
      } else {
        const allNominas = await nominasService.getAllNominas();
        existingNomina = allNominas.find(n => n.Rut === rowId);
      }
      
      if (!existingNomina) {
        return NextResponse.json(
          { error: "No se encontró la nómina especificada" },
          { status: 404 }
        );
      }
      
      // Check if the nomina belongs to the user's empresa
      if (existingNomina["Rut Empresa"] !== user.Empresa) {
        return NextResponse.json(
          { error: "No tiene permiso para modificar esta nómina" },
          { status: 403 }
        );
      }
      
      // Ensure empresa is not changed to something else
      if (updatedData["Rut Empresa"] && updatedData["Rut Empresa"] !== user.Empresa) {
        updatedData["Rut Empresa"] = user.Empresa; // Force to user's empresa
      }
    }

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
    // Get the authenticated user
    const user = await getAuthUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    const { rowId } = await request.json();

    if (!rowId) {
      return NextResponse.json(
        { error: "ID de fila es requerido" },
        { status: 400 }
      );
    }
    
    // If not admin, first check if the nomina belongs to the user's empresa
    if (user.Empresa !== "admin") {
      // Fetch the nomina to check ownership
      let existingNomina;
      
      // Try to find by ID (numeric) or RUT
      if (/^\d+$/.test(rowId)) {
        const allNominas = await nominasService.getAllNominas();
        existingNomina = allNominas.find(n => String(n.ID) === rowId);
      } else {
        const allNominas = await nominasService.getAllNominas();
        existingNomina = allNominas.find(n => n.Rut === rowId);
      }
      
      if (!existingNomina) {
        return NextResponse.json(
          { error: "No se encontró la nómina especificada" },
          { status: 404 }
        );
      }
      
      // Check if the nomina belongs to the user's empresa
      if (existingNomina["Rut Empresa"] !== user.Empresa) {
        return NextResponse.json(
          { error: "No tiene permiso para eliminar esta nómina" },
          { status: 403 }
        );
      }
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