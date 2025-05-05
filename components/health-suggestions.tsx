"use client";

import { Button } from "@/components/ui/button";
import { Heart, Pill, Brain, Activity } from "lucide-react";

interface HealthSuggestionsProps {
  onSelect: (suggestion: string) => void;
}

export function HealthSuggestions({ onSelect }: HealthSuggestionsProps) {
  const suggestions = [
    {
      text: "What are common symptoms of the flu?",
      icon: <Activity className="h-3 w-3 mr-1" />,
    },
    {
      text: "How can I improve my sleep quality?",
      icon: <Brain className="h-3 w-3 mr-1" />,
    },
    {
      text: "What are the benefits of regular exercise?",
      icon: <Heart className="h-3 w-3 mr-1" />,
    },
    {
      text: "How do I manage stress effectively?",
      icon: <Pill className="h-3 w-3 mr-1" />,
    },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {suggestions.map((suggestion, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          className="text-xs bg-white border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
          onClick={() => onSelect(suggestion.text)}
        >
          {suggestion.icon}
          {suggestion.text}
        </Button>
      ))}
    </div>
  );
}
