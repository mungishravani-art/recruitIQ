// ─────────────────────────────────────────
// lib/supabase.ts — Supabase client helpers
// ─────────────────────────────────────────
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Browser client (used in components)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ─── Pools ───────────────────────────────

export async function getPools() {
  const { data, error } = await supabase
    .from('pools')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function createPool(name: string, color: string, stages: string[]) {
  const { data, error } = await supabase
    .from('pools')
    .insert({ name, color, stages })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updatePoolStages(id: string, stages: string[]) {
  const { error } = await supabase
    .from('pools')
    .update({ stages })
    .eq('id', id)
  if (error) throw error
}

// ─── Candidates ──────────────────────────

export async function getCandidates() {
  const { data, error } = await supabase
    .from('candidates_with_last_contact')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getCandidateById(id: string) {
  const { data, error } = await supabase
    .from('candidates_with_last_contact')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createCandidate(candidate: {
  name: string
  role?: string
  company?: string
  location?: string
  experience?: string
  notice_period?: string
  salary?: string
  work_auth?: string
  linkedin_url?: string
  languages?: string[]
  skills?: string[]
  notes?: string
  pool_id?: string
  stage?: string
}) {
  const { data, error } = await supabase
    .from('candidates')
    .insert(candidate)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateCandidate(id: string, updates: Partial<{
  name: string
  role: string
  company: string
  location: string
  experience: string
  notice_period: string
  salary: string
  work_auth: string
  linkedin_url: string
  languages: string[]
  skills: string[]
  notes: string
  next_action: string
  pool_id: string
  stage: string
}>) {
  const { error } = await supabase
    .from('candidates')
    .update(updates)
    .eq('id', id)
  if (error) throw error
}

export async function deleteCandidate(id: string) {
  const { error } = await supabase
    .from('candidates')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// Keyword search — matches against skills array + text columns
export async function searchCandidates(keywords: string[], poolIds?: string[]) {
  let query = supabase
    .from('candidates_with_last_contact')
    .select('*')

  // Filter by skills overlap (any keyword in skills array)
  if (keywords.length > 0) {
    query = query.overlaps('skills', keywords)
  }

  // Filter by pool
  if (poolIds && poolIds.length > 0) {
    query = query.in('pool_id', poolIds)
  }

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// ─── Communications ───────────────────────

export async function getCommunications(candidateId: string) {
  const { data, error } = await supabase
    .from('communications')
    .select('*')
    .eq('candidate_id', candidateId)
    .order('communicated_at', { ascending: true })
  if (error) throw error
  return data
}

export async function addCommunication(comm: {
  candidate_id: string
  channel: string
  direction: 'in' | 'out'
  message: string
  communicated_at?: string
}) {
  const { data, error } = await supabase
    .from('communications')
    .insert(comm)
    .select()
    .single()
  if (error) throw error
  return data
}

// ─── Dashboard ───────────────────────────

export async function getDashboardMetrics() {
  const [{ count: total }, staleData] = await Promise.all([
    supabase.from('candidates').select('*', { count: 'exact', head: true }),
    supabase.from('stale_candidates').select('id'),
  ])

  const { data: weekData } = await supabase
    .from('candidates')
    .select('id')
    .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString())

  const { data: placedData } = await supabase
    .from('candidates')
    .select('id')
    .eq('stage', 'Placed')

  return {
    total: total ?? 0,
    addedThisWeek: weekData?.length ?? 0,
    placed: placedData?.length ?? 0,
    stale: staleData.data?.length ?? 0,
  }
}
