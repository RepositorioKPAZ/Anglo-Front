import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    console.log("File upload test endpoint called");
    
    // Process the form data
    const formData = await request.formData();
    console.log("FormData received:", 
      Array.from(formData.entries()).map(([key, value]) => {
        if (value instanceof File) {
          return `${key}: File(${value.name}, ${value.size} bytes, ${value.type})`;
        }
        return `${key}: ${value}`;
      })
    );
    
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    
    // Read the file content
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log("File read successfully:", {
      name: file.name,
      type: file.type,
      size: file.size,
      bufferSize: buffer.length
    });
    
    return NextResponse.json({
      success: true,
      fileInfo: {
        name: file.name,
        type: file.type,
        size: file.size
      }
    });
  } catch (error) {
    console.error("File upload test error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 