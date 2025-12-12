import { type NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // Extract prompt from query parameters
    const { searchParams } = new URL(req.url);
    const prompt = searchParams.get("prompt");
    const useRAG = searchParams.get("useRAG");
    const threadId = searchParams.get("thread_id");

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }
    const baseURL = process.env.BASE_URL || "https://phureexd-phuree.hf.space";

    // Forward the request to the FastAPI backend using GET
    const response = await fetch(
      `${baseURL}/generate?query=${encodeURIComponent(prompt)}&useRAG=${encodeURIComponent(useRAG || false)}&thread_id=${encodeURIComponent(threadId || "")}`,
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
