import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown"; // Import the library

type Message = {
  role: "user" | "assistant";
  content: string;
};

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex gap-3 w-full",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <Avatar className="h-8 w-8 bg-blue-700">
          <AvatarFallback>AI</AvatarFallback>
          <AvatarImage
            // src="/placeholder.svg?height=32&width=32"
            alt="AI Assistant"
          />
          <Bot className="h-4 w-4 text-white absolute" />
        </Avatar>
      )}
      <div
        className={cn(
          "rounded-lg px-4 py-2 max-w-[80%]",
          isUser
            ? "bg-blue-600 text-white"
            : "bg-gray-100 text-gray-800 border border-gray-200"
        )}
      >
        {/* <div className="whitespace-pre-wrap">{message.content}</div> */}
        <ReactMarkdown>{message.content}</ReactMarkdown>
      </div>
      {isUser && (
        <Avatar className="h-8 w-8 bg-gray-300">
          <AvatarFallback>U</AvatarFallback>
          <AvatarImage
            // src="/placeholder.svg?height=32&width=32"

            alt="User"
          />
          <User className="h-4 w-4 text-white absolute" />
        </Avatar>
      )}
    </div>
  );
}
