// ─────────────────────────────────────────
// RecruitIQ — Shared TypeScript Types
// ─────────────────────────────────────────

export interface Pool {
  id: string
  name: string
  color: string
  stages: string[]
  created_at: string
  updated_at: string
}

export interface Candidate {
  id: string
  name: string
  role: string | null
  company: string | null
  location: string | null
  experience: string | null
  notice_period: string | null
  salary: string | null
  work_auth: string | null
  linkedin_url: string | null
  languages: string[]
  skills: string[]
  notes: string | null
  next_action: string | null
  pool_id: string | null
  stage: string
  created_at: string
  updated_at: string
  // from view
  pool_name?: string
  pool_color?: string
  pool_stages?: string[]
  last_contact_at?: string | null
  last_contact_dir?: 'in' | 'out' | null
  last_message?: string | null
  days_since_contact?: number | null
  // JD matching (client-side only)
  match_score?: number
}

export interface Communication {
  id: string
  candidate_id: string
  channel: 'LinkedIn' | 'Email' | 'Phone' | 'WhatsApp'
  direction: 'in' | 'out'
  message: string
  communicated_at: string
  created_at: string
}

export interface PipelineSummary {
  pool_id: string
  pool_name: string
  color: string
  stage: string
  candidate_count: number
}

// ─── API payloads ───────────────────────

export interface ParseCVRequest {
  text: string
}

export interface ParseCVResponse {
  name?: string
  role?: string
  company?: string
  location?: string
  experience?: string
  notice?: string
  salary?: string
  auth?: string
  linkedin?: string
  langs?: string[]
  skills?: string[]
  error?: string
}

export interface JDMatchRequest {
  jd: string
  candidates: Pick<Candidate, 'id' | 'name' | 'role' | 'skills' | 'languages' | 'location'>[]
}

export interface JDMatchResponse {
  scores: { id: string; score: number }[]
  error?: string
}

export interface DashboardMetrics {
  total: number
  addedThisWeek: number
  placed: number
  stale: number
}
