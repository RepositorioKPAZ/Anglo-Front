import { NextResponse } from "next/server";

// For backward compatibility, we redirect to the new structure
export async function GET(request: Request) {
  const response = await fetch(new URL("/api/dashboard/empresas", request.url));
  const data = await response.json();
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const response = await fetch(new URL("/api/dashboard/empresas", request.url), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

export async function DELETE(request: Request) {
  const body = await request.json();
  const response = await fetch(new URL("/api/dashboard/empresas", request.url), {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
} 