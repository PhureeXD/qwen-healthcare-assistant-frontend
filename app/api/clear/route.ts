import { NextResponse } from "next/server";

export async function GET() {
  try {
    const baseURL = process.env.BASE_URL || "http://127.0.0.1:8000";
    const fastApiResponse = await fetch(`${baseURL}/clear`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    // Check if the FastAPI backend responded successfully
    if (!fastApiResponse.ok) {
      const errorData = await fastApiResponse.text();
      console.error(
        "Error from FastAPI backend (/clear):",
        fastApiResponse.status,
        errorData
      );
      return NextResponse.json(
        {
          message: "Failed to clear conversation on the backend",
          details: errorData,
        },
        { status: fastApiResponse.status }
      );
    }

    // Get the JSON response from the FastAPI backend
    const data = await fastApiResponse.json();

    // Return the response from the FastAPI backend to the client
    return NextResponse.json(data, { status: fastApiResponse.status });
  } catch (error) {
    console.error("Error in Next.js /api/clear route:", error);
    return NextResponse.json(
      {
        message: "Internal server error while trying to clear conversation",
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
