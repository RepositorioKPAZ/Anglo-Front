import { NextResponse } from "next/server";
import { User } from "@/lib/types/user";
import { findUserByRutInDb } from "@/lib/services/database-service";
import { db } from "@/lib/db";

export async function PATCH(request: Request) {
  try {
    const { rut, newPassword } = await request.json();

    if (!rut || !newPassword) {
      return NextResponse.json(
        { error: "RUT y nueva contraseña son requeridos" },
        { status: 400 }
      );
    }

    // Find user in database
    const user = await findUserByRutInDb(rut);
    if (!user) {
      return NextResponse.json(
        { error: "Empresa no encontrada" },
        { status: 404 }
      );
    }

    // Update password in database
    await db.query(
      "UPDATE empresacontacto SET Empresa_C = ? WHERE Rut = ?",
      [newPassword, rut]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating password:", error);
    return NextResponse.json(
      { error: "Error al actualizar la contraseña" },
      { status: 500 }
    );
  }
} 