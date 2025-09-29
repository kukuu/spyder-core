
{/*React Component TypeScript*/}

import { useState } from "react";
import supabase from "@/lib/supabaseClient";

interface LLMInterfaceProps {
  meterId: string;
}

export default function LLMInterface({ meterId }: LLMInterfaceProps) {
  const [query, setQuery] = useState<string>("");
  const [answer, setAnswer] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("llm/query", {
        body: { meterId, question: query },
      });
      if (error) throw error;
      setAnswer(data.answer);
    } catch (err) {
      setAnswer(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ask about this meter..."
        className="w-full p-2 mb-2 border rounded"
      />
      <button
        onClick={handleSubmit}
        disabled={isLoading}
        className={`px-4 py-2 rounded ${isLoading ? "bg-gray-400" : "bg-blue-600 text-white"}`}
      >
        {isLoading ? "Processing..." : "Ask AI"}
      </button>
      {answer && (
        <div className="mt-4 p-3 bg-gray-50 rounded">
          <strong>Response:</strong> {answer}
        </div>
      )}
    </div>
  );
}