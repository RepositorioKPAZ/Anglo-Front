import { NextResponse } from "next/server";
import { companyService } from "@/lib/services/company-service";

export async function GET() {
  try {
    const empresas = await companyService.getAllCompanies();
    return NextResponse.json(empresas);
  } catch (error) {
    console.error("Error fetching empresas:", error);
    return NextResponse.json(
      { error: "Error al cargar los datos de empresas" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const newCompany = await request.json();

    // Validate required fields
    if (!newCompany.Rut || !newCompany.Empresa || !newCompany.Operacion || 
        !newCompany.Encargado || !newCompany.Mail || !newCompany.Telefono) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 }
      );
    }

    // Create the company (password will be generated by the service)
    const createdCompany = await companyService.createCompany(newCompany);

    return NextResponse.json({ 
      success: true, 
      message: "Empresa agregada correctamente",
      company: createdCompany 
    });
  } catch (error) {
    console.error("Error adding empresa:", error);
    return NextResponse.json(
      { error: "Error al agregar la empresa" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { rut } = await request.json();

    if (!rut) {
      return NextResponse.json(
        { error: "RUT es requerido" },
        { status: 400 }
      );
    }

    const success = await companyService.deleteCompany(rut);
    
    if (!success) {
      return NextResponse.json(
        { error: "Empresa no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: "Empresa eliminada correctamente"
    });
  } catch (error) {
    console.error("Error deleting empresa:", error);
    return NextResponse.json(
      { error: "Error al eliminar la empresa" },
      { status: 500 }
    );
  }
} 