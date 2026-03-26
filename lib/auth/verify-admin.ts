import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export type AdminCheckResult =
  | { ok: true }
  | { ok: false; status: number; message: string };

/**
 * Valida cookie auth-token y que el JWT indique usuario admin (empresa === "admin").
 */
export async function assertAdmin(): Promise<AdminCheckResult> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token) {
    return { ok: false, status: 401, message: "No autenticado" };
  }
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(
        process.env.JWT_SECRET || "multibien_secret_key_please_change_in_production"
      )
    );
    if (payload.empresa !== "admin") {
      return { ok: false, status: 403, message: "Solo administradores" };
    }
    return { ok: true };
  } catch {
    return { ok: false, status: 401, message: "Sesión inválida o expirada" };
  }
}
