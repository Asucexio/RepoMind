import { groq } from "@/lib/groq";
import { NextRequest, NextResponse } from "next/server";

// Raise the Next.js App Router body-size limit for this route.
// Without this, large repo contexts hit a 413 before reaching truncateContext().
export const maxDuration = 60; // seconds (Vercel Pro / hobby max)
export const dynamic = "force-dynamic";

// llama-3.3-70b-versatile: ~32k token window.
// 1 token ≈ 4 chars. Reserve ~8k tokens for system scaffold + reply.
// Safe context budget: 24k tokens × 4 = 96k chars — but the system prompt
// itself adds ~3k chars, so cap the REPO CONTEXT block at 60k chars.
// Groq free tier: 12k TPM limit. Budget: ~8,900 tokens for context = ~35k chars.
// Using 28k to leave margin for system prompt scaffold + reply + message history.
const MAX_CONTEXT_CHARS = 28_000;

function truncateContext(raw: string): string {
  if (raw.length <= MAX_CONTEXT_CHARS) return raw;

  const marker = "SOURCE CODE";
  const idx = raw.indexOf(marker);

  if (idx === -1) {
    return raw.slice(0, MAX_CONTEXT_CHARS) + "\n\n[context truncated]";
  }

  const header = raw.slice(0, idx);           // metadata + tree + commits
  const source = raw.slice(idx);
  const budget = MAX_CONTEXT_CHARS - header.length - 200;

  if (budget <= 0) {
    // Header alone is over budget — truncate the header too
    return raw.slice(0, MAX_CONTEXT_CHARS) + "\n[context truncated]";
  }

  return (
    header +
    source.slice(0, budget) +
    "\n\n[source truncated — ask about specific files for more detail]"
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, context } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
    }

    const safeContext = truncateContext(
      typeof context === "string" && context.length > 0
        ? context
        : "No repository context provided."
    );

    // Safety check — if even the truncated context + fixed overhead is huge,
    // cut it down one more time before sending.
    const HARD_CAP = 26_000;
    const finalContext =
      safeContext.length > HARD_CAP
        ? safeContext.slice(0, HARD_CAP) + "\n[hard-capped]"
        : safeContext;

    const systemPrompt = `You are RepoMind, a senior software engineer with full access to this repository.

REPOSITORY CONTEXT:
---
${finalContext}
---

Rules:
- Answer ONLY from the context. Never invent files or functions.
- Cite specific files, functions, or commits in every answer.
- If something is missing from context, say so.

Format: **bold** file/function names, \`inline code\` for paths, fenced code blocks with language tags, numbered steps.`;

    // Stream tokens back to the client so the UI can show a typewriter effect.
    const stream = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      max_tokens: 15000,
      stream: true,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content;
            if (delta) {
              // Send each token as a plain SSE data line
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(delta)}\n\n`));
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error: unknown) {
    console.error("=== RepoMind API Error ===", error);

    const message =
      error instanceof Error ? error.message : String(error);
    const groqStatus = (error as { status?: number })?.status;

    const isTooBig =
      groqStatus === 413 ||
      message.includes("context_length") ||
      message.includes("too large") ||
      message.includes("token") ||
      message.includes("payload") ||
      message.includes("body");

    return NextResponse.json(
      { error: isTooBig ? "Context too large" : "Failed to generate response", detail: message },
      { status: groqStatus ?? 500 }
    );
  }
}