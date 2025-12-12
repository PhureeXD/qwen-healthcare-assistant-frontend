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

  const [threadId, setThreadId] = useState<string>("");

  useEffect(() => {
    // Initialize thread_id from localStorage or generate a new one
    let storedThreadId = localStorage.getItem("health_chat_thread_id");
    if (!storedThreadId) {
      storedThreadId = crypto.randomUUID();
      localStorage.setItem("health_chat_thread_id", storedThreadId);
    }
    setThreadId(storedThreadId);
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleClearConversation = async () => {
    try {
      if (!threadId) return;
      const response = await fetch(`/api/clear?thread_id=${threadId}`);
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
      const apiUrl = `/api/chat?prompt=${encodeURIComponent(originalUserMessage)}&useRAG=${encodeURIComponent(useRAG)}&thread_id=${encodeURIComponent(threadId)}`;

      // Call the API with streaming response using GET
      const response = await fetch(
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
    <Card className="relative w-full border-0 shadow-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/10 h-[85vh] flex flex-col overflow-hidden">
      <CardHeader className="bg-white/50 dark:bg-slate-900/50 border-b border-border/50 backdrop-blur-md sticky top-0 z-10">
        <CardTitle className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 blur-lg opacity-20 rounded-full"></div>
              <Avatar className="h-10 w-10 border-2 border-white dark:border-slate-800 shadow-sm ring-2 ring-blue-100 dark:ring-blue-900">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-teal-500 text-white font-bold">HC</AvatarFallback>
                <AvatarImage
                  // src="/placeholder.svg?height=32&width=32"
                  alt="Healthcare Assistant"
                />
              </Avatar>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Healthcare Assistant</h3>
              <p className="text-xs text-muted-foreground font-normal">AI-powered medical support</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-secondary/50 p-1 rounded-full border border-border/50">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClearConversation}
              className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
              aria-label="Clear conversation"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <div className="h-4 w-px bg-border"></div>
            <div className="flex items-center gap-2 px-2">
              <Switch
                id="rag-toggle"
                checked={useRAG}
                onCheckedChange={setUseRAG}
                aria-label="Toggle RAG"
                className="scale-75 data-[state=checked]:bg-blue-600"
              />
              <Label
                htmlFor="rag-toggle"
                className="flex items-center gap-1.5 text-xs font-medium cursor-pointer select-none"
              >
                <BrainCircuit className={cn("h-3.5 w-3.5", useRAG ? "text-blue-600" : "text-muted-foreground")} />
                <span className={cn(useRAG ? "text-foreground" : "text-muted-foreground")}>RAG</span>
              </Label>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 bg-gradient-to-b from-transparent to-white/50 dark:to-slate-950/50 overflow-y-auto scrollbar-hide">
        <div className="h-full p-4 sm:p-6">
          <div className="flex flex-col gap-6 pb-32">
            {messages.map((message, index) => (
              <ChatMessage key={index} message={message} />
            ))}
            {isLoading && (
              <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-tl-none shadow-sm border border-border/50">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </CardContent>
      <CardFooter className="absolute bottom-4 left-4 right-4 flex flex-col gap-3 p-4 bg-white/5 dark:bg-slate-900/5 border border-white/10 dark:border-white/5 rounded-3xl shadow-xl z-20">
        <HealthSuggestions onSelect={(suggestion) => setInput(suggestion)} />
        <form onSubmit={handleSubmit} className="flex w-full gap-3 relative">
          <div className="relative flex-1 group">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a health-related question..."
              className="min-h-[60px] w-full resize-none rounded-xl border-border/30 bg-white/50 dark:bg-slate-800/50 backdrop-blur-[2px] focus-visible:ring-blue-500/30 focus-visible:border-blue-500/50 pl-4 pr-4 py-3 shadow-sm transition-all group-hover:border-blue-200/50 dark:group-hover:border-blue-800/50 text-foreground placeholder:text-muted-foreground"
            />
            <div className="absolute inset-0 rounded-xl bg-blue-500/5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity" />
          </div>
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !input.trim()}
            className={cn(
              "h-[60px] w-[60px] shrink-0 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 shadow-lg shadow-blue-500/20 transition-all duration-300",
              (!input.trim() || isLoading) && "opacity-50 cursor-not-allowed shadow-none"
            )}
          >
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            ) : (
              <Send className="h-6 w-6 text-white ml-0.5" />
            )}
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
