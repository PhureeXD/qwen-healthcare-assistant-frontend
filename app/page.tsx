import { HealthcareAssistant } from "@/components/healthcare-assistant";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8 bg-gradient-to-b from-blue-50 to-white">
      <div className="z-10 max-w-5xl w-full">
        <h1 className="text-4xl font-bold text-center mb-2 text-blue-800">
          Healthcare Assistant
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Your AI-powered healthcare companion
        </p>

        <div className="w-full">
          <HealthcareAssistant />
        </div>
      </div>
    </main>
  );
}
