import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { aiRateLimit } from "@/lib/cache/redis";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const { success, remaining } = await aiRateLimit.limit(userId);
  if (!success) return NextResponse.json({ error: "Rate limit reached. You can ask 20 questions per hour." }, { status: 429, headers: { "X-RateLimit-Remaining": remaining.toString() } });

  const { message, courseTitle, lessonTitle, history } = await req.json();
  if (!message?.trim()) return NextResponse.json({ error: "Message required" }, { status: 400 });

  const systemPrompt = `You are an expert AI tutor for an e-learning platform called JLearn.
The student is studying: "${courseTitle}" — lesson: "${lessonTitle}".

Your role:
- Answer questions clearly, accurately, and concisely
- Adapt explanations to the student's apparent level
- Use examples, analogies, and real-world scenarios
- For code, use proper markdown code blocks
- Keep responses focused (2-3 paragraphs max unless code is needed)
- Use **bold** for key terms, \`backticks\` for inline code
- Be encouraging and supportive`;

  const messages = [
    ...((history || []).slice(-8).map((h: any) => ({ role: h.role, content: h.content }))),
    { role: "user", content: message },
  ];

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: 1024, system: systemPrompt, messages }),
    });

    if (!res.ok) throw new Error(`Anthropic ${res.status}`);
    const data = await res.json();
    const text = data.content?.[0]?.text || "Sorry, I could not generate a response.";
    return NextResponse.json({ response: text });
  } catch (err) {
    console.error("AI tutor error:", err);
    return NextResponse.json({ error: "AI service unavailable" }, { status: 503 });
  }
}
