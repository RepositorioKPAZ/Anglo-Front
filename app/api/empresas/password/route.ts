import { NextResponse } from "next/server";

// For backward compatibility, we redirect to the new structure
export async function PATCH(request: Request) {
  const body = await request.json();
  const response = await fetch(new URL("/api/dashboard/empresas/password", request.url), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
} 