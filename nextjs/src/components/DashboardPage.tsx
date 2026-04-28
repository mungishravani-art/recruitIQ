'use client'

import type { Candidate, Pool, DashboardMetrics } from '@/types'
import { Btn, StagePill, EmptyState } from './ui'

interface Props {
  candidates: Candidate[]
  metrics: DashboardMetrics
  pools: Pool[]
  onOpenProfile: (id: string) => void
  onUpload: () => void
  onAddManual: () => void
}

function daysSince(iso: string | null | undefined): number | null {
  if (!iso) return null
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24))
}

function poolById(pools: Pool[], id: string | null) {
  return pools.find(p => p.id === id)
}

export default function DashboardPage({ candidates, metrics, pools, onOpenProfile, onUpload, onAddManual }: Props) {
  const recent = [...candidates].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 6)
  const stale = candidates.filter(c => (c.days_since_contact ?? 999) >= 14 || (!c.last_contact_at))

  const metricCards = [
    { label: 'Total Candidates', value: metrics.total, sub: `${pools.length} active pools`, color: 'var(--text)' },
    { label: 'Added This Week',  value: metrics.addedThisWeek, sub: 'New this week', color: 'var(--accent)' },
    { label: 'Placed',           value: metrics.placed, sub: 'Successfully placed', color: 'var(--green)' },
    { label: 'Needs Follow-up',  value: metrics.stale,  sub: 'No contact 14+ days', color: 'var(--red)' },
  ]

  return (
    <>
      {/* Topbar */}
      <div style={{ padding: '16px 28px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22 }}>Dashboard</div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>Overview — Belgium Market</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn size="sm" onClick={onAddManual}>+ Add Manually</Btn>
          <Btn size="sm" variant="primary" onClick={onUpload}>↑ Upload CV</Btn>
        </div>
      </div>

      <div style={{ padding: '24px 28px' }}>
        {/* Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
          {metricCards.map(m => (
            <div key={m.label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: '18px 20px' }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{m.label}</div>
              <div style={{ fontSize: 28, fontWeight: 600, color: m.color, lineHeight: 1 }}>{m.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>{m.sub}</div>
            </div>
          ))}
        </div>

        {/* Two col */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16 }}>
          {/* Recent candidates */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>Recent Candidates</span>
            </div>
            {recent.length === 0
              ? <EmptyState icon="👤" title="No candidates yet" sub="Upload a CV or add manually" />
              : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Candidate', 'Pool', 'Stage', 'Last Contact'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map(c => {
                      const pool = poolById(pools, c.pool_id)
                      const d = daysSince(c.last_contact_at)
                      return (
                        <tr key={c.id} onClick={() => onOpenProfile(c.id)} style={{ cursor: 'pointer' }}>
                          <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                            <div style={{ fontWeight: 500, fontSize: 13 }}>{c.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{c.role}</div>
                          </td>
                          <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', color: pool?.color || 'var(--text3)', fontSize: 12 }}>{pool?.name || '—'}</td>
                          <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                            <StagePill stage={c.stage} color={pool?.color} />
                          </td>
                          <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: 11, color: d !== null && d > 14 ? 'var(--red)' : 'var(--text2)' }}>
                            {d === null ? 'Never' : d === 0 ? 'Today' : `${d}d ago`}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
          </div>

          {/* Follow-up */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>Needs Follow-up</span>
            </div>
            {stale.length === 0
              ? <EmptyState icon="✅" title="All caught up!" sub="No candidates need follow-up" />
              : stale.map(c => {
                  const d = c.days_since_contact ?? null
                  return (
                    <div key={c.id} onClick={() => onOpenProfile(c.id)} style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{c.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{c.role}</div>
                      </div>
                      <span style={{ padding: '2px 8px', borderRadius: 8, fontSize: 11, fontWeight: 500, background: 'rgba(248,113,113,0.1)', color: 'var(--red)' }}>
                        {d === null ? 'No comms' : `${d}d`}
                      </span>
                    </div>
                  )
                })}
          </div>
        </div>
      </div>
    </>
  )
}
