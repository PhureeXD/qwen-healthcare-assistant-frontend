import { cn } from "@/lib/utils";
import { ExternalLink, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown"; // Import the library

type Message = {
  role: "user" | "assistant";
  content: string;
};

interface ChatMessageProps {
  message: Message;
  isSpeaking?: boolean;
}

type SourceLink = {
  href: string;
  label: string;
};

function getSourceLabel(value: string, index: number) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.replace(/^www\./, "");
    const filename = url.pathname.split("/").filter(Boolean).pop();

    if (filename?.toLowerCase().endsWith(".pdf")) {
      return `${hostname} PDF`;
    }

    return hostname;
  } catch {
    return `Source ${index + 1}`;
  }
}

function extractSources(content: string) {
  const normalizedContent = content.replace(/^[\uFEFF\u200B-\u200D\u2060]+/, "");
  const sourceStart = normalizedContent.match(
    /(?:\*\*)?\s*Sources?\s*:\s*(?:\*\*)?\s*\{/i
  );

  if (!sourceStart || sourceStart.index === undefined) {
    return {
      body: content,
      sources: [] as SourceLink[],
      isPendingSource: false,
    };
  }

  const beforeSource = normalizedContent.slice(0, sourceStart.index);

  if (beforeSource.trim()) {
    return {
      body: content,
      sources: [] as SourceLink[],
      isPendingSource: false,
    };
  }

  const openingBraceIndex =
    sourceStart.index + sourceStart[0].lastIndexOf("{");
  const closingBraceIndex = normalizedContent.indexOf("}", openingBraceIndex);

  if (closingBraceIndex === -1) {
    return {
      body: "",
      sources: [] as SourceLink[],
      isPendingSource: true,
    };
  }

  const rawSources = normalizedContent.slice(
    openingBraceIndex + 1,
    closingBraceIndex
  );
  const quotedSources = Array.from(
    rawSources.matchAll(/['"]([^'"]+)['"]/g)
  ).map((match) => match[1].trim());
  const urlSources = Array.from(
    rawSources.matchAll(/https?:\/\/[^\s'",}]+/g)
  ).map((match) => match[0].trim());
  const fallbackSources = rawSources
    .split(",")
    .map((value) => value.trim().replace(/^['"]|['"]$/g, ""))
    .filter(Boolean);
  const uniqueSources = Array.from(
    new Set(quotedSources.length ? quotedSources : urlSources.length ? urlSources : fallbackSources)
  );

  return {
    body: normalizedContent.slice(closingBraceIndex + 1).trimStart(),
    sources: uniqueSources.map((href, index) => ({
      href,
      label: getSourceLabel(href, index),
    })),
    isPendingSource: false,
  };
}

export function CharacterPortrait({
  role,
  isSpeaking = false,
  className,
}: {
  role: "assistant" | "user";
  isSpeaking?: boolean;
  className?: string;
}) {
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "character-portrait",
        isUser ? "character-portrait-user" : "character-portrait-robot",
        isSpeaking && "character-portrait-speaking",
        className
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
  const parsedMessage = isUser
    ? { body: message.content, sources: [] as SourceLink[], isPendingSource: false }
    : extractSources(message.content);
  const showTypingDots =
    isSpeaking &&
    (!message.content || message.content === "..." || parsedMessage.isPendingSource);

  return (
    <div
      className={cn(
        "message-row flex gap-3 w-full",
        isUser ? "message-row-user" : "message-row-assistant",
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
              {parsedMessage.sources.length > 0 && (
                <div className="source-chip-row" aria-label="Sources">
                  <span className="source-chip-label">Sources</span>
                  {parsedMessage.sources.map((source, index) => (
                    <a
                      key={`${source.href}-${index}`}
                      href={source.href}
                      target="_blank"
                      rel="noreferrer"
                      className="source-chip"
                      title={source.href}
                    >
                      {source.href.toLowerCase().includes(".pdf") ? (
                        <FileText aria-hidden="true" />
                      ) : (
                        <ExternalLink aria-hidden="true" />
                      )}
                      <span>{source.label}</span>
                    </a>
                  ))}
                </div>
              )}
              {parsedMessage.body && (
                <ReactMarkdown>{parsedMessage.body}</ReactMarkdown>
              )}
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
