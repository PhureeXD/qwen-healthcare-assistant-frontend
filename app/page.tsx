import { HealthcareAssistant } from "@/components/healthcare-assistant";

export default function Home() {
  return (
    <main className="fantasy-surface relative flex h-dvh overflow-hidden flex-col items-center justify-start px-4 py-3 md:px-8 md:py-5">
      <div className="magic-gate left-[-3rem] top-10 hidden md:block" />
      <div className="magic-gate magic-gate-small right-[4%] bottom-12 hidden md:block" />
      <div className="z-10 flex h-full max-w-5xl w-full min-h-0 flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="shrink-0 text-center space-y-1">
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-normal bg-gradient-to-r from-blue-950 via-blue-700 to-cyan-500 bg-clip-text text-transparent drop-shadow-sm dark:from-white dark:via-blue-100 dark:to-cyan-300">
            Healthcare Assistant
          </h1>
          <p className="text-sm sm:text-base font-semibold text-blue-950/60 dark:text-blue-100/70 max-w-2xl mx-auto">
            Your AI-powered companion for health and wellness advice.
          </p>
        </div>

        <div className="w-full min-h-0 flex-1">
          <HealthcareAssistant />
        </div>
      </div>
    </main>
  );
}
