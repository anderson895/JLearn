export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { aiRateLimit } from "@/lib/cache/redis";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const { success, remaining } = await aiRateLimit.limit(userId);
  if (!success) {
    return NextResponse.json(
      { error: "Rate limit reached. You can ask 20 questions per hour." },
      { status: 429, headers: { "X-RateLimit-Remaining": remaining.toString() } }
    );
  }

  const { message, courseTitle, lessonTitle, history } = await req.json();
  if (!message?.trim()) return NextResponse.json({ error: "Message required" }, { status: 400 });

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: "AI service not configured" }, { status: 503 });
  }

  const systemInstruction = `You are an expert AI tutor for an e-learning platform called JLearn.
The student is studying: "${courseTitle}" — lesson: "${lessonTitle}".

Your role:
- Answer questions clearly, accurately, and concisely
- Adapt explanations to the student's apparent level
- Use examples, analogies, and real-world scenarios
- For code, use proper markdown code blocks with the language name
- Keep responses focused — 2 to 3 paragraphs max unless code is needed
- Use **bold** for key terms and backticks for inline code
- Be encouraging and supportive
- Always respond in the same language the student uses`;

  // Convert history to Gemini format (last 8 messages)
  const contents: { role: string; parts: { text: string }[] }[] = [];
  for (const msg of (history || []).slice(-8)) {
    contents.push({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    });
  }
  contents.push({ role: "user", parts: [{ text: message }] });

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
            topP: 0.9,
          },
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT",        threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_HATE_SPEECH",       threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          ],
        }),
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("Gemini API error:", res.status, err);
      throw new Error(`Gemini ${res.status}`);
    }

    const data = await res.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I could not generate a response. Please try again.";

    return NextResponse.json({ response: text });
  } catch (err) {
    console.error("AI tutor error:", err);
    return NextResponse.json({ error: "AI service unavailable. Please try again." }, { status: 503 });
  }
}