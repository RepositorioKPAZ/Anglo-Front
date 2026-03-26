import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth/verify-admin";
import {
  createEstado,
  listEstados,
  toggleEstadoActivo,
} from "@/lib/services/estado-service";
import { isEstadoTablaValor } from "@/lib/constants/estado-tabla";

export async function GET() {
  const auth = await assertAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }
  try {
    const rows = await listEstados();
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error listando estado:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error al cargar la tabla estado",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await assertAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }
  try {
    const body = await request.json();
    const estadoRaw =
      typeof body.estado === "string" ? body.estado.trim() : "";
    if (!estadoRaw || !isEstadoTablaValor(estadoRaw)) {
      return NextResponse.json(
        {
          error:
            "Estado inválido. Use: Postulación, Resultados o Inactivo.",
        },
        { status: 400 }
      );
    }
    const fechaInicio =
      typeof body.fechaInicio === "string" && body.fechaInicio.trim() !== ""
        ? body.fechaInicio.trim()
        : null;
    const fechaTermino =
      typeof body.fechaTermino === "string" && body.fechaTermino.trim() !== ""
        ? body.fechaTermino.trim()
        : null;
    const insertId = await createEstado(estadoRaw, fechaInicio, fechaTermino);
    return NextResponse.json({
      success: true,
      message: "Estado creado correctamente",
      id: insertId,
    });
  } catch (error) {
    console.error("Error creando estado:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error al crear el registro en estado",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const auth = await assertAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }
  try {
    const body = await request.json();
    const rawId = body.id;
    const id =
      typeof rawId === "number"
        ? rawId
        : typeof rawId === "string"
          ? parseInt(rawId, 10)
          : NaN;
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json(
        { error: "id de registro inválido" },
        { status: 400 }
      );
    }
    const activo = await toggleEstadoActivo(id);
    return NextResponse.json({
      success: true,
      message: activo === 1 ? "Registro activado" : "Registro desactivado",
      activo,
    });
  } catch (error) {
    console.error("Error alternando activo:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Error al actualizar el registro";
    const notFound =
      error instanceof Error && error.message === "Registro no encontrado";
    return NextResponse.json(
      { error: message },
      { status: notFound ? 404 : 500 }
    );
  }
}
