'use client'

import { useState, useMemo } from 'react'
import type { Candidate, Pool } from '@/types'
import { Btn, StagePill, Tag, EmptyState, showToast } from './ui'

interface Props {
  candidates: Candidate[]
  pools: Pool[]
  onOpenProfile: (id: string) => void
  onUpload: () => void
  onAddManual: () => void
}

function daysSince(iso: string | null | undefined): number | null {
  if (!iso) return null
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24))
}

export default function SearchPage({ candidates, pools, onOpenProfile, onUpload, onAddManual }: Props) {
  const [tab, setTab] = useState<'keyword' | 'jd'>('keyword')
  const [query, setQuery] = useState('')
  const [jdText, setJdText] = useState('')
  const [activePoolFilters, setActivePoolFilters] = useState<string[]>([])
  const [activeLocFilters, setActiveLocFilters] = useState<string[]>([])
  const [jdScores, setJdScores] = useState<Record<string, number>>({})
  const [jdLoading, setJdLoading] = useState(false)

  const locations = useMemo(() => [...new Set(candidates.map(c => c.location).filter(Boolean))], [candidates])

  const togglePool = (id: string) =>
    setActivePoolFilters(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  const toggleLoc = (loc: string) =>
    setActiveLocFilters(prev => prev.includes(loc) ? prev.filter(x => x !== loc) : [...prev, loc])

  // Keyword filter
  const keywordResults = useMemo(() => {
    const terms = query.toLowerCase().split(/[\s,+]+/).filter(Boolean)
    return candidates.filter(c => {
      if (activePoolFilters.length && !activePoolFilters.includes(c.pool_id ?? '')) return false
      if (activeLocFilters.length && !activeLocFilters.includes(c.location ?? '')) return false
      if (!terms.length) return true
      const blob = [c.name, c.role, c.company, c.location, ...c.skills, ...c.languages, c.experience, c.work_auth]
        .filter(Boolean).join(' ').toLowerCase()
      return terms.every(t => blob.includes(t))
    })
  }, [query, candidates, activePoolFilters, activeLocFilters])

  // JD match — calls Next.js API route (which calls Groq server-side)
  const runJDMatch = async () => {
    if (!jdText.trim()) { showToast('Paste a job description first', 'error'); return }
    setJdLoading(true)
    try {
      const res = await fetch('/api/jd-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jd: jdText,
          candidates: candidates.map(c => ({ id: c.id, name: c.name, role: c.role, skills: c.skills, languages: c.languages, location: c.location })),
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      const scoreMap: Record<string, number> = {}
      data.scores.forEach((s: { id: string; score: number }) => { scoreMap[s.id] = s.score })
      setJdScores(scoreMap)
      showToast('Matching complete!', 'success')
    } catch (err: unknown) {
      showToast('Match failed: ' + (err instanceof Error ? err.message : 'Unknown error'), 'error')
    } finally {
      setJdLoading(false)
    }
  }

  const jdResults = useMemo(() => {
    if (!Object.keys(jdScores).length) return candidates
    return [...candidates]
      .map(c => ({ ...c, match_score: jdScores[c.id] ?? 0 }))
      .sort((a, b) => (b.match_score ?? 0) - (a.match_score ?? 0))
  }, [jdScores, candidates])

  const results = tab === 'keyword' ? keywordResults : jdResults
  const showMatch = tab === 'jd' && Object.keys(jdScores).length > 0

  return (
    <>
      {/* Topbar */}
      <div style={{ padding: '16px 28px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22 }}>Search Candidates</div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>Keyword search + JD matching powered by Groq</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn size="sm" onClick={onAddManual}>+ Add Manually</Btn>
          <Btn size="sm" variant="primary" onClick={onUpload}>↑ Upload CV</Btn>
        </div>
      </div>

      <div style={{ padding: '24px 28px' }}>
        {/* Search panel */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, marginBottom: 20 }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
            {(['keyword', 'jd'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: '5px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                border: '1px solid ' + (tab === t ? 'var(--accent)' : 'var(--border2)'),
                background: tab === t ? 'var(--accent)' : 'transparent',
                color: tab === t ? '#0f0f11' : 'var(--text2)',
                fontWeight: tab === t ? 500 : 400, fontFamily: 'var(--font-sans)',
              }}>
                {t === 'keyword' ? 'Keyword Search' : 'JD Matching'}
              </button>
            ))}
          </div>

          {tab === 'keyword' && (
            <>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="e.g. Python, Brussels, Senior, Dutch..."
                  style={{ flex: 1, background: 'var(--bg4)', border: '1px solid var(--border2)', borderRadius: 10, padding: '9px 14px', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'var(--font-sans)' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {pools.map(p => (
                  <button key={p.id} onClick={() => togglePool(p.id)} style={{
                    padding: '4px 12px', borderRadius: 20, fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-sans)',
                    border: '1px solid ' + (activePoolFilters.includes(p.id) ? p.color : 'var(--border2)'),
                    background: activePoolFilters.includes(p.id) ? p.color + '22' : 'transparent',
                    color: activePoolFilters.includes(p.id) ? p.color : 'var(--text2)',
                  }}>{p.name}</button>
                ))}
                {locations.map(loc => (
                  <button key={loc} onClick={() => toggleLoc(loc!)} style={{
                    padding: '4px 12px', borderRadius: 20, fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-sans)',
                    border: '1px solid ' + (activeLocFilters.includes(loc!) ? 'var(--accent)' : 'var(--border2)'),
                    background: activeLocFilters.includes(loc!) ? 'rgba(200,181,96,0.15)' : 'transparent',
                    color: activeLocFilters.includes(loc!) ? 'var(--accent)' : 'var(--text2)',
                  }}>{loc}</button>
                ))}
              </div>
            </>
          )}

          {tab === 'jd' && (
            <>
              <textarea
                value={jdText}
                onChange={e => setJdText(e.target.value)}
                placeholder="Paste the job description here... Groq will extract required skills and score each candidate 0–100%."
                rows={4}
                style={{ width: '100%', background: 'var(--bg4)', border: '1px solid var(--border2)', borderRadius: 10, padding: '10px 14px', color: 'var(--text)', fontSize: 13, resize: 'vertical', fontFamily: 'var(--font-sans)', outline: 'none', marginBottom: 8 }}
              />
              <Btn size="sm" variant="primary" onClick={runJDMatch} disabled={jdLoading}>
                {jdLoading ? 'Matching...' : 'Find Matching Candidates'}
              </Btn>
            </>
          )}
        </div>

        {/* Results table */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>
              {tab === 'keyword' && query ? `Results for "${query}"` : showMatch ? 'JD Match Results' : 'All Candidates'}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>{results.length} candidate{results.length !== 1 ? 's' : ''}</span>
          </div>

          {results.length === 0
            ? <EmptyState icon="🔍" title="No candidates found" sub="Try different keywords or filters" />
            : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Candidate', 'Skills', 'Location', 'Stage', 'Last Contact', ...(showMatch ? ['Match'] : []), ''].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.map(c => {
                    const pool = pools.find(p => p.id === c.pool_id)
                    const d = daysSince(c.last_contact_at)
                    const score = c.match_score
                    return (
                      <tr key={c.id} onClick={() => onOpenProfile(c.id)} style={{ cursor: 'pointer' }}>
                        <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                          <div style={{ fontWeight: 500, fontSize: 13 }}>{c.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{c.role} · {c.company}</div>
                        </td>
                        <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                            {c.skills.slice(0, 4).map(s => <Tag key={s} label={s} color="blue" />)}
                            {c.skills.length > 4 && <Tag label={`+${c.skills.length - 4}`} />}
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--text2)' }}>{c.location}</td>
                        <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                          <StagePill stage={c.stage} color={pool?.color} />
                        </td>
                        <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: 11, color: d !== null && d > 14 ? 'var(--red)' : 'var(--text2)' }}>
                          {d === null ? 'Never' : d === 0 ? 'Today' : `${d}d ago`}
                        </td>
                        {showMatch && (
                          <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: (score ?? 0) >= 60 ? 'var(--green)' : (score ?? 0) >= 30 ? 'var(--orange)' : 'var(--red)' }}>{score ?? 0}%</div>
                            <div style={{ width: 60, height: 4, background: 'var(--bg4)', borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${score ?? 0}%`, background: 'var(--green)', borderRadius: 2 }} />
                            </div>
                          </td>
                        )}
                        <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                          <Btn size="sm" onClick={e => { e.stopPropagation(); onOpenProfile(c.id) }}>View</Btn>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
        </div>
      </div>
    </>
  )
}
