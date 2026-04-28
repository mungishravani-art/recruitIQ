# RecruitIQ — Deployment Guide
## Belgium Market Recruitment Pipeline

---

## Stack
- **Frontend + API routes**: Next.js 14 (App Router) → deployed on Vercel
- **Database + Backend**: Supabase (Postgres)
- **AI parsing**: Groq API (`llama3-70b-8192`) — server-side only

---

## Step 1 — Supabase Setup

1. Go to [supabase.com](https://supabase.com) → New project
2. Open **SQL Editor** → paste the contents of `supabase/schema.sql` → Run
3. This creates: `pools`, `candidates`, `communications` tables + views + triggers
4. Go to **Settings → API** → copy:
   - `Project URL`
   - `anon/public` key

---

## Step 2 — Groq API Key

1. Go to [console.groq.com](https://console.groq.com)
2. Create an API key
3. Copy it — it starts with `gsk_`

---

## Step 3 — Local Development

```bash
cd nextjs
npm install
cp .env.example .env.local
# Fill in your values in .env.local
npm run dev
# Open http://localhost:3000
```

Your `.env.local` should look like:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
GROQ_API_KEY=gsk_...
```

---

## Step 4 — Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Or push to GitHub and import the repo in [vercel.com/new](https://vercel.com/new).

**Set these environment variables in Vercel dashboard** (Settings → Environment Variables):
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
GROQ_API_KEY
```

> ⚠️ `GROQ_API_KEY` is server-side only. Never prefix it with `NEXT_PUBLIC_`.

---

## Project Structure

```
nextjs/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout, fonts
│   │   ├── page.tsx                # Main shell, data fetching
│   │   ├── globals.css             # Design tokens + resets
│   │   └── api/
│   │       ├── parse-cv/route.ts   # POST: CV text → structured fields (Groq)
│   │       └── jd-match/route.ts   # POST: JD + candidates → match scores (Groq)
│   ├── components/
│   │   ├── ui.tsx                  # Shared primitives (Button, Input, Modal, Tag...)
│   │   ├── Sidebar.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── SearchPage.tsx
│   │   ├── PipelinePage.tsx
│   │   ├── UploadModal.tsx         # CV upload + Groq parsing
│   │   ├── CandidateProfileModal.tsx
│   │   └── Modals.tsx              # AddManual, AddPool, EditStages
│   ├── lib/
│   │   └── supabase.ts             # All DB operations (swap for auth'd client when ready)
│   └── types/
│       └── index.ts                # Shared TypeScript interfaces
supabase/
└── schema.sql                      # Run this first in Supabase SQL editor
```

---

## Adding Authentication (Phase 2)

When you're ready to add login:

1. Enable **Supabase Auth** (Email or LinkedIn OAuth)
2. Uncomment the RLS policies in `schema.sql`
3. Replace `createClient()` in `lib/supabase.ts` with the SSR client from `@supabase/ssr`
4. Add a `/login` page using Supabase Auth UI

---

## Groq Models

The app uses `llama3-70b-8192` for both CV parsing and JD matching.
To switch models, edit the `model` field in:
- `src/app/api/parse-cv/route.ts`
- `src/app/api/jd-match/route.ts`

Available fast Groq models: `llama3-70b-8192`, `llama3-8b-8192`, `mixtral-8x7b-32768`

---

## PDF Parsing Note

For production-grade PDF text extraction (not just `.txt` files), install:
```bash
npm install pdfjs-dist
```
Then in `UploadModal.tsx`, replace `reader.readAsText(file)` with a PDF extraction function using `pdfjs-dist`. A helper snippet:

```ts
import * as pdfjsLib from 'pdfjs-dist'
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'

async function extractPdfText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
  let text = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    text += content.items.map((item: { str: string }) => item.str).join(' ') + '\n'
  }
  return text
}
```

For `.docx` files, use `mammoth`:
```ts
import mammoth from 'mammoth'
const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })
return result.value
```
