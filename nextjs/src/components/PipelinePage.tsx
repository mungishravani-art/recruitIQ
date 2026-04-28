'use client'

import { useState } from 'react'
import type { Candidate, Pool } from '@/types'
import { Btn, EmptyState, showToast } from './ui'
import AddPoolModal from './AddPoolModal'
import EditStagesModal from './EditStagesModal'

interface Props {
  candidates: Candidate[]
  pools: Pool[]
  activePipelinePool: string
  onSelectPool: (id: string) => void
  onOpenProfile: (id: string) => void
  onUpload: () => void
  onAddPool: () => void
  onStagesUpdated: () => void
}

function daysSince(iso: string | null | undefined): number | null {
  if (!iso) return null
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24))
}

export default function PipelinePage({ candidates, pools, activePipelinePool, onSelectPool, onOpenProfile, onUpload, onAddPool, onStagesUpdated }: Props) {
  const [showAddPool, setShowAddPool] = useState(false)
  const [showEditStages, setShowEditStages] = useState(false)

  const activePool = pools.find(p => p.id === activePipelinePool)
  const poolCandidates = candidates.filter(c => c.pool_id === activePipelinePool)

  return (
    <>
      {/* Topbar */}
      <div style={{ padding: '16px 28px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22 }}>Pipeline</div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>Custom stages per pool</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn size="sm" onClick={() => setShowEditStages(true)}>Edit Stages</Btn>
          <Btn size="sm" variant="primary" onClick={onUpload}>↑ Upload CV</Btn>
        </div>
      </div>

      <div style={{ padding: '20px 28px' }}>
        {/* Pool selector */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          {pools.map(p => (
            <button key={p.id} onClick={() => onSelectPool(p.id)} style={{
              padding: '6px 16px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
              fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', gap: 6,
              border: '1px solid ' + (p.id === activePipelinePool ? p.color : 'var(--border2)'),
              background: p.id === activePipelinePool ? p.color + '22' : 'transparent',
              color: p.id === activePipelinePool ? p.color : 'var(--text2)',
              fontWeight: p.id === activePipelinePool ? 500 : 400,
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
              {p.name}
              <span style={{ fontSize: 10, opacity: 0.7 }}>({candidates.filter(c => c.pool_id === p.id).length})</span>
            </button>
          ))}
          <button onClick={() => setShowAddPool(true)} style={{
            padding: '6px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
            border: '1px dashed var(--border2)', background: 'transparent',
            color: 'var(--text3)', fontFamily: 'var(--font-sans)',
          }}>
            + New Pool
          </button>
        </div>

        {/* Kanban */}
        {!activePool
          ? <EmptyState icon="📋" title="Select a pool" sub="Choose a pool above to view its pipeline" />
          : (
            <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 12 }}>
              {activePool.stages.map(stage => {
                const stageCards = poolCandidates.filter(c => c.stage === stage)
                return (
                  <div key={stage} style={{ minWidth: 235, flexShrink: 0 }}>
                    {/* Column header */}
                    <div style={{
                      padding: '10px 14px',
                      borderRadius: '10px 10px 0 0',
                      background: activePool.color + '22',
                      border: `1px solid ${activePool.color}33`,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                      <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: activePool.color }}>{stage}</span>
                      <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.1)', color: activePool.color, padding: '1px 7px', borderRadius: 10 }}>{stageCards.length}</span>
                    </div>

                    {/* Cards */}
                    <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 10px 10px', padding: 10, minHeight: 200, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {stageCards.length === 0
                        ? <div style={{ padding: 20, textAlign: 'center', color: 'var(--text3)', fontSize: 12 }}>No candidates</div>
                        : stageCards.map(c => {
                            const d = daysSince(c.last_contact_at)
                            const dayColor = d === null ? 'var(--text3)' : d <= 7 ? 'var(--green)' : d <= 14 ? 'var(--orange)' : 'var(--red)'
                            const dayBg = d === null ? 'var(--bg4)' : d <= 7 ? 'rgba(74,222,128,0.1)' : d <= 14 ? 'rgba(251,146,60,0.1)' : 'rgba(248,113,113,0.1)'
                            const dayText = d === null ? 'No comms' : d === 0 ? 'Today' : `${d}d ago`
                            return (
                              <div key={c.id} onClick={() => onOpenProfile(c.id)} style={{
                                background: 'var(--bg2)', border: '1px solid var(--border)',
                                borderRadius: 10, padding: 12, cursor: 'pointer', transition: 'all 0.15s',
                              }}>
                                <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 3 }}>{c.name}</div>
                                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8 }}>{c.role}</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 8 }}>
                                  {c.skills.slice(0, 3).map(s => (
                                    <span key={s} style={{ padding: '2px 7px', borderRadius: 10, fontSize: 10, fontWeight: 500, background: 'rgba(96,165,250,0.1)', color: 'var(--blue)', border: '1px solid rgba(96,165,250,0.2)' }}>{s}</span>
                                  ))}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10, color: 'var(--text3)' }}>
                                  <span>{c.location}</span>
                                  <span style={{ padding: '2px 7px', borderRadius: 8, fontSize: 10, fontWeight: 500, background: dayBg, color: dayColor }}>{dayText}</span>
                                </div>
                              </div>
                            )
                          })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
      </div>

      {showAddPool && (
        <AddPoolModal onClose={() => setShowAddPool(false)} onSaved={() => { setShowAddPool(false); onAddPool() }} />
      )}
      {showEditStages && (
        <EditStagesModal pools={pools} activePipelinePool={activePipelinePool} onClose={() => setShowEditStages(false)} onSaved={() => { setShowEditStages(false); onStagesUpdated() }} />
      )}
    </>
  )
}
