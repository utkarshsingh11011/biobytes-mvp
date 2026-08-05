import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { GoogleGenAI } from "@google/genai"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { metrics } = await req.json()

    if (!metrics || metrics.length === 0) {
      return NextResponse.json({ error: "No metrics provided" }, { status: 400 })
    }

    // Initialize the new Google Gen AI SDK
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string })

    // Build a prompt summarizing the user's metrics
    const prompt = `You are a medical professional providing an AI-generated health trend summary for a patient.
The patient has provided the following historical biomarker data from their lab reports:

${JSON.stringify(metrics, null, 2)}

Please write a highly professional, easy-to-understand medical summary of these trends. 
Compare their latest values against their previous values. Are they improving? Worsening?
Provide general lifestyle or next-step advice based STRICTLY on these metrics.

Keep the response plain text (no markdown, no asterisks, no hashtags) so it can be rendered cleanly in a PDF. 
Keep it concise (around 150-200 words).
Do NOT include disclaimers about AI making mistakes; those will be added automatically to the footer.`

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    })

    const text = response.text || "Unable to generate summary."

    return NextResponse.json({ summary: text })
  } catch (error: any) {
    console.error("AI Summary Error:", error)
    return NextResponse.json({ error: "Failed to generate AI summary" }, { status: 500 })
  }
}
