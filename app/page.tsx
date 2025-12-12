import { HealthcareAssistant } from "@/components/healthcare-assistant";

export default function Home() {
  return (
    <main className="flex h-screen overflow-hidden flex-col items-center justify-center p-4 md:p-8 bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="z-10 max-w-5xl w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent drop-shadow-sm">
            Healthcare Assistant
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Your AI-powered companion for health and wellness advice.
          </p>
        </div>

        <div className="w-full">
          <HealthcareAssistant />
        </div>
      </div>
    </main>
  );
}
