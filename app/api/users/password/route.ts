import { NextRequest, NextResponse } from "next/server";
import { findUserByRutInDb } from "@/lib/services/database-service";
import { db } from "@/lib/db";

// GET: Retrieve a user's password by their RUT
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const rut = url.searchParams.get("rut");

    if (!rut) {
      return NextResponse.json(
        { error: "RUT parameter is required" },
        { status: 400 }
      );
    }

    const user = await findUserByRutInDb(rut);
    
    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ password: user.Empresa_C });
  } catch (error) {
    console.error("Error retrieving password:", error);
    return NextResponse.json(
      { error: "Error al recuperar la contraseña" },
      { status: 500 }
    );
  }
}

// POST: Update a user's password by their RUT
export async function POST(request: Request) {
  try {
    const { rut, newPassword } = await request.json();

    if (!rut || !newPassword) {
      return NextResponse.json(
        { error: "RUT y contraseña son requeridos" },
        { status: 400 }
      );
    }

    // Find user in database
    const user = await findUserByRutInDb(rut);
    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Update password in database
    await db.query(
      "UPDATE empresacontacto SET Empresa_C = ? WHERE Rut = ?",
      [newPassword, rut]
    );

    return NextResponse.json({ message: "Contraseña actualizada correctamente" });
  } catch (error) {
    console.error("Error updating password:", error);
    return NextResponse.json(
      { error: "Error al actualizar la contraseña" },
      { status: 500 }
    );
  }
} 