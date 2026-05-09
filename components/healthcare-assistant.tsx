"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, BrainCircuit, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CharacterPortrait, ChatMessage } from "@/components/chat-message";
import { HealthSuggestions } from "@/components/health-suggestions";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const startsMarkdownBlock = (value: string) =>
  /^\s*(?:[-*+]\s+|\d+[.)]\s+|#{1,6}\s+|>\s+)/.test(value);

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
  const activeAssistantRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [threadId, setThreadId] = useState<string>("");

  useEffect(() => {
    let storedThreadId = localStorage.getItem("health_chat_thread_id");
    if (!storedThreadId) {
      storedThreadId = crypto.randomUUID();
      localStorage.setItem("health_chat_thread_id", storedThreadId);
    }
    setThreadId(storedThreadId);
  }, []);

  useEffect(() => {
    if (messages.length <= 1) return;

    const lastMessage = messages[messages.length - 1];
    if (isLoading && lastMessage?.role === "assistant") {
      activeAssistantRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      return;
    }

    scrollToBottom();
  }, [isLoading, messages]);

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
        let assistantContent = "";
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
                assistantContent += dataContent;
                break;
              }
              // streaming response case
              // Only process lines that start with "data: "
              else if (line.startsWith("data: ")) {
                const dataContent = line.substring(6);
                if (/<\/?think>/.test(dataContent)) {
                  continue;
                }
                if (!dataContent) {
                  content += "\n";
                  assistantContent += "\n";
                  continue;
                }

                if (
                  assistantContent &&
                  !assistantContent.endsWith("\n") &&
                  startsMarkdownBlock(dataContent)
                ) {
                  content += "\n";
                  assistantContent += "\n";
                }

                content += dataContent;
                assistantContent += dataContent;
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

  const isUserTyping = input.trim().length > 0;
  const lastMessage = messages[messages.length - 1];
  const isAssistantStreaming = isLoading && lastMessage?.role === "assistant";
  const greetingMessage =
    messages.length === 1 && messages[0]?.role === "assistant"
      ? messages[0].content
      : "";

  return (
    <Card className="chat-shell relative w-full h-full min-h-0 gap-0 border-0 py-0 shadow-none bg-transparent ring-0 flex flex-col overflow-hidden">
      <div className="chat-toolbar absolute right-4 top-3 left-auto z-20 flex w-fit max-w-fit items-center gap-2 self-end transition-all sm:opacity-75 sm:hover:opacity-100">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClearConversation}
          className="h-9 w-9 rounded-full border border-blue-100 bg-white/78 text-blue-900/60 shadow-sm shadow-blue-900/5 backdrop-blur-md transition-colors hover:bg-red-50 hover:text-red-600 dark:border-blue-900/60 dark:bg-slate-950/70 dark:text-blue-100/65 dark:hover:bg-red-950/30"
          aria-label="Clear conversation"
          title="Clear conversation"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="assistant-hero-character" aria-hidden="true">
        <CharacterPortrait role="assistant" isSpeaking={isLoading} />
      </div>
      {greetingMessage && (
        <div className="assistant-greeting-message" aria-hidden="true">
          <span>Assistant</span>
          <div>{greetingMessage}</div>
        </div>
      )}
      <CardContent className="relative min-h-0 flex-1 p-0 bg-transparent overflow-y-auto scrollbar-hide">
        <div className="h-full p-4 pt-2 sm:p-6 sm:pt-2">
          <div className="chat-stage-messages flex min-h-full flex-col gap-6 pb-6">
            {messages.map((message, index) => {
              const isActiveAssistant =
                isLoading &&
                message.role === "assistant" &&
                index === messages.length - 1;

              return (
                <div
                  key={index}
                  ref={isActiveAssistant ? activeAssistantRef : undefined}
                  className={cn(
                    "scroll-mt-4",
                    index === 0 &&
                      message.role === "assistant" &&
                      "initial-assistant-row"
                  )}
                >
                  <ChatMessage
                    message={message}
                    isSpeaking={isActiveAssistant}
                  />
                </div>
              );
            })}
            {isLoading && !isAssistantStreaming && (
              <ChatMessage
                message={{ role: "assistant", content: "..." }}
                isSpeaking
              />
            )}
            {isUserTyping && (
              <ChatMessage message={{ role: "user", content: "..." }} isSpeaking />
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </CardContent>
      <CardFooter className="relative z-20 flex w-full shrink-0 flex-col items-center gap-2 border-0 bg-transparent px-4 pb-2 pt-1 shadow-none">
        <HealthSuggestions onSelect={(suggestion) => setInput(suggestion)} />
        <form onSubmit={handleSubmit} className="flex w-full max-w-[calc(100%-0.25rem)] gap-2 relative">
          <div className="relative flex-1 group">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a health-related question..."
              className="min-h-[52px] w-full resize-none rounded-xl border-blue-100 bg-white/84 dark:bg-slate-900/75 dark:border-blue-900/60 backdrop-blur-[2px] focus-visible:ring-4 focus-visible:ring-cyan-500/15 focus-visible:border-cyan-500/60 pl-4 pr-[5.75rem] py-3 shadow-sm transition-all group-hover:border-cyan-300/70 dark:group-hover:border-cyan-700/80 text-blue-950 dark:text-blue-50 placeholder:text-blue-900/45 dark:placeholder:text-blue-100/40"
            />
            <Button
              type="button"
              variant="ghost"
              onClick={() => setUseRAG((value) => !value)}
              aria-pressed={useRAG}
              aria-label="Toggle RAG"
              title={useRAG ? "RAG enabled" : "Use retrieval context"}
              className={cn(
                "absolute right-2 top-1/2 h-9 -translate-y-1/2 rounded-lg border px-2.5 text-xs font-semibold shadow-sm backdrop-blur-sm transition-all",
                useRAG
                  ? "border-blue-700 bg-gradient-to-br from-blue-700 to-cyan-600 text-white shadow-blue-600/20 hover:from-blue-600 hover:to-cyan-500 hover:text-white"
                  : "border-blue-100 bg-white/80 text-blue-900/65 hover:bg-cyan-50 hover:text-blue-900 dark:border-blue-900/60 dark:bg-slate-900/75 dark:text-blue-100/65 dark:hover:bg-blue-950/60 dark:hover:text-blue-50"
              )}
            >
              <BrainCircuit className="h-4 w-4" />
              <span className="hidden sm:inline">RAG</span>
            </Button>
            <div className="absolute inset-0 rounded-xl bg-blue-500/5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity" />
          </div>
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !input.trim()}
            className={cn(
              "h-[52px] w-[52px] shrink-0 rounded-xl bg-gradient-to-br from-blue-700 via-sky-600 to-cyan-500 hover:-translate-y-0.5 hover:from-blue-600 hover:via-sky-500 hover:to-cyan-400 shadow-lg shadow-blue-600/25 transition-all duration-300",
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
