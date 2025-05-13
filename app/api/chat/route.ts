import { type NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // Extract prompt from query parameters
    const { searchParams } = new URL(req.url);
    const prompt = searchParams.get("prompt");
    const lastUserMessage = searchParams.get("lastUserMessage");
    const lastAssistantMessage = searchParams.get("lastAssistantMessage");
    const useRAG = searchParams.get("useRAG");
    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Forward the request to the FastAPI backend using GET
    const response = await fetch(
      `http://127.0.0.1:8000/generate?query=${encodeURIComponent(prompt)}&useRAG=${encodeURIComponent(useRAG || false)}&lastUserMessage=${encodeURIComponent(lastUserMessage || "")}&lastAssistantMessage=${encodeURIComponent(lastAssistantMessage || "")}`,
      {
        method: "GET",
        headers: {
          Accept: "text/event-stream",
        },
      }
    );

    // Check if the response is ok
    if (!response.ok) {
      throw new Error(`Error from backend: ${response.statusText}`);
    }

    // Create a new readable stream
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();

        if (!reader) {
          controller.close();
          return;
        }

        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              controller.close();
              break;
            }

            controller.enqueue(value);
          }
        } catch (error) {
          controller.error(error);
        }
      },
    });

    // Return the stream as a response
    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in chat route:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
