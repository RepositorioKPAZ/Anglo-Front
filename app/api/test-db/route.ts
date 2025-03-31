import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Test 1: Basic connection
    const testQuery = await db.query('SELECT 1 as test');
    
    // Test 2: Get count of companies
    const companiesCount = await db.query('SELECT COUNT(*) as count FROM empresacontacto');
    
    // Test 3: Get count of nominas
    const nominasCount = await db.query('SELECT COUNT(*) as count FROM nominabeca');

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      data: {
        connectionTest: testQuery[0],
        companiesCount: companiesCount[0],
        nominasCount: nominasCount[0]
      }
    });
  } catch (error) {
    console.error("Database test error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Database connection failed",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
} 