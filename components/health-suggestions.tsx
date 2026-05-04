"use client";

import { Button } from "@/components/ui/button";
import { Heart, Moon, Sparkles, WandSparkles } from "lucide-react";

interface HealthSuggestionsProps {
  onSelect: (suggestion: string) => void;
}

export function HealthSuggestions({ onSelect }: HealthSuggestionsProps) {
  const suggestions = [
    {
      label: "Flu symptoms",
      prompt: "What are common symptoms of the flu?",
      icon: <Sparkles className="h-3 w-3 mr-1" />,
    },
    {
      label: "Better sleep",
      prompt: "How can I improve my sleep quality?",
      icon: <Moon className="h-3 w-3 mr-1" />,
    },
    {
      label: "Exercise benefits",
      prompt: "What are the benefits of regular exercise?",
      icon: <Heart className="h-3 w-3 mr-1" />,
    },
    {
      label: "Manage stress",
      prompt: "How do I manage stress effectively?",
      icon: <WandSparkles className="h-3 w-3 mr-1" />,
    },
  ];

  return (
    <div className="grid w-full grid-cols-2 gap-2 px-1 lg:grid-cols-4">
      {suggestions.map((suggestion, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          className="min-w-0 justify-center overflow-hidden text-ellipsis whitespace-nowrap text-xs bg-white/76 border-blue-100 text-blue-800 shadow-sm shadow-blue-900/5 backdrop-blur-sm hover:-translate-y-0.5 hover:bg-cyan-50/95 hover:text-blue-950 hover:border-cyan-200 dark:bg-slate-900/60 dark:border-blue-900/60 dark:text-blue-100 dark:hover:bg-blue-950/70 transition-all"
          onClick={() => onSelect(suggestion.prompt)}
          title={suggestion.prompt}
        >
          {suggestion.icon}
          {suggestion.label}
        </Button>
      ))}
    </div>
  );
}
