import { NextResponse } from "next/server";
import { HfInference } from "@huggingface/inference";
import { ensureDbReady } from "@/lib/db";

// Use a free model that handles text well, e.g. Mistral or similar available on free API
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

export async function POST(req: Request) {
  try {
    await ensureDbReady();
    
    // Fast path: if no API key, return a generic friendly wrapper
    if (!process.env.HUGGINGFACE_API_KEY) {
      return NextResponse.json({ 
        enrichedText: "Here's what the engine says: " + (await req.json()).baseAnalysis,
        fallback: true
      });
    }

    const { baseAnalysis, context } = await req.json();
    if (!baseAnalysis) {
      return NextResponse.json({ error: "Missing base analysis" }, { status: 400 });
    }

    // Prompt engineering for a chess coach persona
    const prompt = `You are a friendly, encouraging chess coach (like a Duolingo character). 
Rewrite the following raw engine analysis into a helpful, conversational tip for a beginner/intermediate player. 
Keep it under 2 sentences. Be concise and engaging. 

Raw analysis: "${baseAnalysis}"
Game context: "${context || 'None'}"

Coach's tip:`;

    // Timeout Promise to ensure we don't block the UI for too long (Vercel hobby limit is 10s, but we want faster UI)
    const timeout = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error("HF API Timeout")), 4500)
    );

    const apiCall = hf.textGeneration({
      model: "mistralai/Mistral-7B-Instruct-v0.2",
      inputs: prompt,
      parameters: {
        max_new_tokens: 60,
        temperature: 0.7,
        return_full_text: false,
      }
    });

    try {
      const response = await Promise.race([apiCall, timeout]);
      let enrichedText = response.generated_text.trim();
      
      // Clean up if the model includes quotes or conversational cruft
      if (enrichedText.startsWith('"') && enrichedText.endsWith('"')) {
        enrichedText = enrichedText.slice(1, -1);
      }
      
      return NextResponse.json({ enrichedText, fallback: false });
    } catch (e: any) {
      console.warn("HF API error or timeout, falling back:", e.message);
      return NextResponse.json({ 
        enrichedText: "Coach says: " + baseAnalysis,
        fallback: true 
      });
    }
    
  } catch (error) {
    console.error("Narrative enrich error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
