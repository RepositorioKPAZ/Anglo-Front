import { NextRequest, NextResponse } from "next/server";

// Define the ProgressData interface
interface ProgressData {
  total: number;
  processed: number;
  percentage: number;
  status: string;
  error: string | null;
}

// Extend global to include our progress tracking
declare global {
  var progressTracking: Map<string, ProgressData> | undefined;
}

/**
 * API route for checking the progress of a file download
 * 
 * Path parameters:
 * - progressId: Unique identifier for the download process
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ progressId: string }> }
) {
  // Await params since it's a Promise in Next.js 15
  const resolvedParams = await params;
  const progressId = resolvedParams.progressId;
  
  if (!progressId) {
    return NextResponse.json(
      { error: "Missing required parameter: progressId" },
      { status: 400 }
    );
  }

  // Retrieve progress data from memory
  if (!global.progressTracking) {
    return NextResponse.json(
      { error: "Progress tracking not initialized" },
      { status: 404 }
    );
  }

  const progressData = global.progressTracking.get(progressId);
  
  if (!progressData) {
    return NextResponse.json(
      { error: "No progress data found for the given ID" },
      { status: 404 }
    );
  }

  // Return the progress data
  return NextResponse.json(progressData);
} 