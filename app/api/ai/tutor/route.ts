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

  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    return NextResponse.json({ error: "AI service not configured" }, { status: 503 });
  }

  const systemPrompt = `You are an expert AI tutor for an e-learning platform called JLearn.
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

  // Build messages array — last 8 history messages + current
  const messages = [
    { role: "system", content: systemPrompt },
    ...(history || []).slice(-8).map((msg: any) => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: msg.content,
    })),
    { role: "user", content: message },
  ];

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages,
        temperature: 0.7,
        max_tokens: 1024,
        top_p: 0.9,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("Groq API error:", res.status, err);
      throw new Error(`Groq ${res.status}`);
    }

    const data = await res.json();
    const text =
      data?.choices?.[0]?.message?.content ||
      "Sorry, I could not generate a response. Please try again.";

    return NextResponse.json({ response: text });
  } catch (err) {
    console.error("AI tutor error:", err);
    return NextResponse.json({ error: "AI service unavailable. Please try again." }, { status: 503 });
  }
}