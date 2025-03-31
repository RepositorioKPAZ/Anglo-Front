import { NextResponse } from "next/server";
import { nominasService } from "@/lib/services/nominas-service";

export async function GET() {
  try {
    console.log("API route: Fetching all nominas");
    const nominas = await nominasService.getAllNominas();
    
    console.log(`API route: Returning ${nominas.length} nominas`);
    
    // Debug: Check if there's data and log first record
    if (nominas.length > 0) {
      console.log("API route: First nomina record attributes:", Object.keys(nominas[0]));
    } else {
      console.warn("API route: No nominas data returned from service");
    }
    
    return NextResponse.json(nominas);
  } catch (error) {
    console.error("API route: Error fetching nominas:", error);
    return NextResponse.json(
      { error: "Error al cargar los datos de nóminas", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 