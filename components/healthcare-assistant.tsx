"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Send, BrainCircuit, Trash2 } from "lucide-react"; // Added BrainCircuit for RAG icon
import { cn } from "@/lib/utils";
import { ChatMessage } from "@/components/chat-message";
import { HealthSuggestions } from "@/components/health-suggestions";
import { Switch } from "@/components/ui/switch"; // Import Switch for a toggle
import { Label } from "@/components/ui/label"; // Import Label for the Switch

type Message = {
  role: "user" | "assistant";
  content: string;
};

export function HealthcareAssistant() {
  const [input, setInput] = useState("");
  const initialMessages: Message[] = [
    {
      role: "assistant",
      content:
        "Hello! I'm your healthcare assistant. How can I help you today?",
    },
  ];
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [useRAG, setUseRAG] = useState(false); // State for RAG toggle
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleClearConversation = async () => {
    try {
      const response = await fetch("/api/clear"); // Assuming your API is prefixed with /api
      if (!response.ok) {
        throw new Error("Failed to clear conversation on the server");
      }
      setMessages(initialMessages); // Reset messages to initial state
    } catch (error) {
      console.error("Error clearing conversation:", error);
      // Optionally, show an error message to the user
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I couldn't clear the conversation. Please try again.",
        },
      ]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading) return;
    const originalUserMessage = input.trim(); // Store the original message

    setInput("");

    // Add user message to chat
    setMessages((prev) => [
      ...prev,
      { role: "user", content: originalUserMessage },
    ]); // Show the modified message if RAG is used

    // Set loading state
    setIsLoading(true);

    try {
      // Find the last user message
      // const lastUserMessage = messages
      //   .slice()
      //   .reverse()
      //   .find((msg) => msg.role === "user")?.content;
      // Find the last assistant message
      // const lastAssistantMessage = messages
      //   .slice()
      //   .reverse()
      //   .find((msg) => msg.role === "assistant")?.content;

      const apiUrl = `/api/chat?prompt=${encodeURIComponent(originalUserMessage)}&useRAG=${encodeURIComponent(useRAG)}`;
      // if (lastUserMessage) {
      //   apiUrl += `&lastUserMessage=${encodeURIComponent(lastUserMessage)}`;
      // }
      // if (lastAssistantMessage) {
      //   apiUrl += `&lastAssistantMessage=${encodeURIComponent(lastAssistantMessage)}`;
      // }

      // Call the API with streaming response using GET
      const response = await fetch(
        // Use the potentially modified userMessage
        apiUrl,
        {
          method: "GET",
          headers: {
            Accept: "text/event-stream",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch response");
      }

      // Create a new message for the assistant
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let done = false;
        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;

          if (value) {
            const text = decoder.decode(value, { stream: true });

            // Process Server-Sent Events format
            const lines = text.split("\n");
            const isDataAndThinkStart = lines[0] === "data: <think>";
            const isThinkEnd = lines[2] == "</think>";
            let content = "";
            // console.log(lines);
            for (const line of lines) {
              // fix special case for non-streaming responses
              // no prefix "data: " in this case
              if (isDataAndThinkStart && isThinkEnd) {
                const index = text.lastIndexOf("</think>");
                const dataContent = text.substring(index + 8 + 1);
                content += dataContent;
                break;
              }
              // streaming response case
              // Only process lines that start with "data: "
              else if (line.startsWith("data: ")) {
                const dataContent = line.substring(6);
                if (/<\/?think>/.test(dataContent)) {
                  continue;
                }
                content += dataContent ? dataContent : "\n";
              }
            }

            // Only update if we have content (avoid empty updates)
            if (content) {
              // Update the last message with the new content
              setMessages((prev) => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage.role === "assistant") {
                  lastMessage.content += content;
                }
                return newMessages;
              });
            }
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I'm sorry, I encountered an error while processing your request. Please try again later.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <Card className="p-2 w-full border-blue-200 shadow-lg">
      <CardHeader className="bg-blue-50 border-b border-blue-100">
        <CardTitle className="flex items-center justify-between gap-2 text-blue-800">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 bg-blue-700">
              <AvatarFallback>HC</AvatarFallback>
              <AvatarImage
                // src="/placeholder.svg?height=32&width=32"
                alt="Healthcare Assistant"
              />
            </Avatar>
            Healthcare Assistant
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClearConversation}
              className="text-blue-700 hover:text-blue-900 cursor-pointer"
              aria-label="Clear conversation"
            >
              <Trash2 className="h-5 w-5" />
            </Button>
            <Switch
              id="rag-toggle"
              checked={useRAG}
              onCheckedChange={setUseRAG}
              aria-label="Toggle RAG"
            />
            <Label
              htmlFor="rag-toggle"
              className="flex items-center gap-1 text-sm font-medium text-blue-700"
            >
              <BrainCircuit className="h-4 w-4" /> RAG
            </Label>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[50vh] p-4">
          <div className="flex flex-col gap-4">
            {messages.map((message, index) => (
              <ChatMessage key={index} message={message} />
            ))}
            {isLoading && (
              <div className="flex justify-center my-2">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="flex flex-col gap-4 p-4 border-t border-blue-100">
        <HealthSuggestions onSelect={(suggestion) => setInput(suggestion)} />
        <form onSubmit={handleSubmit} className="flex w-full gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a health-related question..."
            className="min-h-[60px] flex-1 resize-none border-blue-200 focus-visible:ring-blue-500"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !input.trim()}
            className={cn(
              "h-[60px] w-[60px] shrink-0 rounded-md bg-blue-600 hover:bg-blue-700",
              (!input.trim() || isLoading) && "opacity-50 cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
