import { groq } from '@/lib/groq'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { messages, context } = await request.json()

    const systemPrompt = `You are RepoMind, an expert AI code analyst embedded directly inside a developer's repository.

Your job is to help the developer deeply understand their own codebase. You have been given the repository's file structure, relevant code snippets, and context below.

---
REPOSITORY CONTEXT:
${context}
---

HOW TO ANSWER:
- Always reason step by step before giving your final answer. Think about what the code is doing, why it's structured that way, and what the implications are.
- Reference specific file names, function names, and line-level details from the context above whenever possible.
- If the question is about a bug, diagnose the root cause first, then suggest a fix with a code example.
- If the question is about how something works, trace the execution flow clearly.
- If the question is about architecture or design, explain trade-offs and suggest improvements if relevant.
- Format your response using markdown: use \`inline code\` for identifiers, code blocks for snippets, and bullet points or numbered steps for multi-part answers.
- If you are unsure or the answer is not in the provided context, say so honestly instead of guessing.
- Never give one-line answers. Every answer should show clear reasoning.`

    const completion = await groq.chat.completions.create({
      messages: [
        { 
          role: 'system', 
          content: systemPrompt
        },
        ...messages
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.4,
      max_tokens: 2048,
    })

    return NextResponse.json({
      content: completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.'
    })
  } catch (error) {
    console.error('Error in chat API:', error)
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    )
  }
}