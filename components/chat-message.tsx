import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown"; // Import the library

type Message = {
  role: "user" | "assistant";
  content: string;
};

interface ChatMessageProps {
  message: Message;
  isSpeaking?: boolean;
}

function CharacterPortrait({
  role,
  isSpeaking = false,
}: {
  role: "assistant" | "user";
  isSpeaking?: boolean;
}) {
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "character-portrait",
        isUser ? "character-portrait-user" : "character-portrait-robot",
        isSpeaking && "character-portrait-speaking"
      )}
      role="img"
      aria-label={isUser ? "User adventurer character" : "Robot healer character"}
    >
      <span className="character-aura" />
      <span className="character-body" />
      <span className="character-neck" />
      <span className="character-head">
        <span className="character-hair" />
        <span className="character-face">
          <span className="character-eye character-eye-left" />
          <span className="character-eye character-eye-right" />
          <span className="character-mouth" />
        </span>
      </span>
      <span className="character-accent" />
    </div>
  );
}

export function ChatMessage({ message, isSpeaking = false }: ChatMessageProps) {
  const isUser = message.role === "user";
  const showTypingDots = isSpeaking && (!message.content || message.content === "...");

  return (
    <div
      className={cn(
        "flex gap-3 w-full",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <CharacterPortrait role="assistant" isSpeaking={isSpeaking} />
      )}
      <div
        className={cn(
          "flex max-w-[72%] flex-col gap-1 sm:max-w-[78%]",
          isUser && "items-end"
        )}
      >
        <span
          className={cn(
            "px-1 text-[11px] font-semibold uppercase text-blue-900/45 dark:text-blue-100/45",
            isUser && "text-blue-700/65 dark:text-blue-200/60"
          )}
        >
          {isUser ? "You" : "Assistant"}
        </span>
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300",
            isUser
              ? "bg-gradient-to-br from-blue-700 via-sky-600 to-cyan-500 text-white rounded-tr-none shadow-blue-700/15"
              : "bg-white/92 text-blue-950 border border-blue-100 rounded-tl-none dark:bg-slate-900 dark:text-blue-50 dark:border-blue-900/60",
            showTypingDots && "min-w-[4.5rem]"
          )}
        >
          {/* <div className="whitespace-pre-wrap">{message.content}</div> */}

          {showTypingDots ? (
            <div className="typing-dots" aria-label="Typing">
              <span />
              <span />
              <span />
            </div>
          ) : (
            <div
              className={cn(
                "whitespace-normal",
                !isUser &&
                  "[&_em]:text-blue-900/65 [&_em]:dark:text-blue-100/65 [&_li]:ml-5 [&_li]:list-disc [&_li]:leading-6 [&_p]:mb-2 [&_p]:leading-6 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_ul]:mb-2 [&_ul]:mt-1 [&_ul]:space-y-0.5"
              )}
            >
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
      {isUser && (
        <CharacterPortrait role="user" isSpeaking={isSpeaking} />
      )}
    </div>
  );
}
