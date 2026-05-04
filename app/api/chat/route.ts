import { type NextRequest, NextResponse } from "next/server";

const isMockMessageEnabled = () => {
  const value = process.env.IS_MOCK_MSG ?? process.env.is_mock_msg ?? "false";
  return value.toLowerCase() === "true";
};

const createMockStream = (prompt: string, useRAG: string | null) => {
  const encoder = new TextEncoder();
  const mockResponse = [
    `**Mock answer for:** "${prompt}"`,
    "",
    "Here is a fast preview response so you can test the chat UI without waiting for the model backend.",
    "Common points to show in the interface:",
    "",
    "- Symptoms can vary by person and severity.",
    "- Rest, hydration, and monitoring changes are often useful first steps.",
    "- Seek professional care if symptoms are severe, persistent, or concerning.",
    "",
    useRAG === "true"
      ? "**RAG:** enabled. A real response would use retrieved context."
      : "**RAG:** off. A real response would use the base model flow.",
    "",
    "_For real medical concerns, confirm symptoms and treatment plans with a licensed clinician._",
  ].join("\n");

  return new ReadableStream({
    async start(controller) {
      const chunks = mockResponse.split(/(\n)/);

      for (const chunk of chunks) {
        if (chunk === "\n") {
          controller.enqueue(encoder.encode("data: \n\n"));
        } else if (chunk) {
          controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
        }
        await new Promise((resolve) => setTimeout(resolve, 60));
      }

      controller.close();
    },
  });
};

const streamHeaders = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  Connection: "keep-alive",
};

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

    if (isMockMessageEnabled()) {
      return new NextResponse(createMockStream(prompt, useRAG), {
        headers: streamHeaders,
      });
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
      headers: streamHeaders,
    });
  } catch (error) {
    console.error("Error in chat route:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
