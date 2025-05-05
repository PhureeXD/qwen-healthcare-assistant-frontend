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
import { Loader2, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatMessage } from "@/components/chat-message";
import { HealthSuggestions } from "@/components/health-suggestions";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export function HealthcareAssistant() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm your healthcare assistant. How can I help you today?",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");

    // Add user message to chat
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    // Set loading state
    setIsLoading(true);

    try {
      // Call the API with streaming response using GET
      const response = await fetch(
        `/api/chat?prompt=${encodeURIComponent(userMessage)}`,
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
            const text = decoder.decode(value);

            // Process Server-Sent Events format
            const lines = text.split("\n");
            let content = "";

            for (const line of lines) {
              // Only process lines that start with "data: "
              if (line.startsWith("data: ")) {
                // check if <คิด> is present in the line
                if (line.includes("<คิด>")) {
                  content += text.substring(6);
                  break;
                }
                // Extract content after "data: " prefix
                const dataContent = line.substring(6);
                if (dataContent) {
                  content += dataContent;
                }
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
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Avatar className="h-8 w-8 bg-blue-700">
            <AvatarFallback>HC</AvatarFallback>
            <AvatarImage
              src="/placeholder.svg?height=32&width=32"
              alt="Healthcare Assistant"
            />
          </Avatar>
          Healthcare Assistant
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
