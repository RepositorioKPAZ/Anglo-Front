import { NextResponse } from "next/server";

// For backward compatibility, we redirect to the new structure
export async function GET(request: Request) {
  // This ensures that existing code still works by forwarding requests
  // to the new endpoint structure
  const response = await fetch(new URL("/api/dashboard/nominas", request.url));
  const data = await response.json();
  return NextResponse.json(data);
} 