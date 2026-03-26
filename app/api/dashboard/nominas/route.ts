import { NextResponse } from "next/server";
import { nominasService } from "@/lib/services/nominas-service";

export async function GET() {
  try {
    const nominas = await nominasService.getAllNominas();
    return NextResponse.json(nominas);
  } catch (error) {
    console.error("Error fetching nominas:", error);
    return NextResponse.json(
      { error: "Error al cargar los datos de nóminas", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 