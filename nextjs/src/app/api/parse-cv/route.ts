// app/api/parse-cv/route.ts
// Receives extracted CV text, calls Groq, returns structured candidate fields.
// Groq key is server-side only — never exposed to the browser.

import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json()
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'No CV text provided' }, { status: 400 })
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

    const completion = await groq.chat.completions.create({
      model: 'llama3-70b-8192',
      temperature: 0.1,
      max_tokens: 800,
      messages: [
        {
          role: 'system',
          content: `You are a recruitment assistant. Extract structured candidate data from CV text.
Return ONLY a valid JSON object — no markdown fences, no explanation.
Fields to extract:
- name (string)
- role (string: current/most recent job title)
- company (string: current/most recent employer)
- location (string: city)
- experience (string: e.g. "6 years")
- notice (string: notice period if mentioned, else null)
- salary (string: expected or current salary/rate if mentioned, else null)
- auth (string: work authorisation — "EU Citizen", "Belgian Resident", "Requires Sponsorship", or "Unknown")
- linkedin (string: LinkedIn URL if found, else null)
- langs (array of strings: languages spoken)
- skills (array of strings: technical and soft skills, tools, frameworks, methodologies — be thorough, 10-20 items)`,
        },
        {
          role: 'user',
          content: `Extract candidate data from this CV:\n\n${text.slice(0, 4000)}`,
        },
      ],
    })

    const raw = completion.choices[0]?.message?.content ?? '{}'
    let parsed: Record<string, unknown> = {}

    try {
      parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())
    } catch {
      return NextResponse.json({ error: 'Could not parse Groq response', raw }, { status: 500 })
    }

    return NextResponse.json(parsed)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
