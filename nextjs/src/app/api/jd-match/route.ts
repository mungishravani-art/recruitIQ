// app/api/jd-match/route.ts
// Takes a job description + candidate list, returns match scores via Groq.

import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

export async function POST(req: NextRequest) {
  try {
    const { jd, candidates } = await req.json()

    if (!jd || !Array.isArray(candidates)) {
      return NextResponse.json({ error: 'Missing jd or candidates' }, { status: 400 })
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

    // Step 1: Extract required skills from JD
    const jdCompletion = await groq.chat.completions.create({
      model: 'llama3-70b-8192',
      temperature: 0.1,
      max_tokens: 400,
      messages: [
        {
          role: 'system',
          content: 'Extract the required skills, tools, and qualifications from this job description as a JSON array of lowercase strings. Return ONLY the JSON array, no explanation.',
        },
        { role: 'user', content: jd.slice(0, 3000) },
      ],
    })

    let jdSkills: string[] = []
    try {
      jdSkills = JSON.parse(
        (jdCompletion.choices[0]?.message?.content ?? '[]')
          .replace(/```json|```/g, '')
          .trim()
      )
    } catch {
      jdSkills = []
    }

    if (jdSkills.length === 0) {
      return NextResponse.json({ scores: candidates.map((c: { id: string }) => ({ id: c.id, score: 0 })) })
    }

    // Step 2: Score each candidate against JD skills
    const scores = candidates.map((c: {
      id: string
      skills: string[]
      languages: string[]
      role: string | null
      location: string | null
    }) => {
      const candidateBlob = [
        ...(c.skills ?? []),
        ...(c.languages ?? []),
        c.role ?? '',
        c.location ?? '',
      ].map((s) => s.toLowerCase())

      const jdLower = jdSkills.map((s) => s.toLowerCase())
      const matched = jdLower.filter((jdSkill) =>
        candidateBlob.some(
          (cb) => cb.includes(jdSkill) || jdSkill.includes(cb)
        )
      )

      const score = jdLower.length > 0
        ? Math.round((matched.length / jdLower.length) * 100)
        : 0

      return { id: c.id, score }
    })

    return NextResponse.json({ scores, jdSkills })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
