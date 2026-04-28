'use client'

import { useEffect, useState } from 'react'
import type { Pool, Candidate, Communication } from '@/types'
import { Modal, Btn, Field, Input, Select, Textarea, TagEditor, Tag, SectionDivider, showToast } from './ui'
import { getCandidateById, getCommunications, addCommunication, updateCandidate, deleteCandidate } from '@/lib/supabase'

interface Props {
  candidateId: string
  pools: Pool[]
  onClose: () => void
  onUpdated: () => void
  onDeleted: () => void
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function CandidateProfileModal({ candidateId, pools, onClose, onUpdated, onDeleted }: Props) {
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [comms, setComms] = useState<Communication[]>([])
  const [loading, setLoading] = useState(true)

  // Editable fields
  const [poolId, setPoolId] = useState('')
  const [stage, setStage] = useState('')
  const [nextAction, setNextAction] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [notes, setNotes] = useState('')

  // New comm
  const [commDir, setCommDir] = useState<'out' | 'in'>('out')
  const [commText, setCommText] = useState('')
  const [commLogging, setCommLogging] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const [c, cs] = await Promise.all([
          getCandidateById(candidateId),
          getCommunications(candidateId),
        ])
        setCandidate(c)
        setComms(cs ?? [])
        setPoolId(c.pool_id ?? '')
        setStage(c.stage)
        setNextAction(c.next_action ?? '')
        setSkills(c.skills ?? [])
        setNotes(c.notes ?? '')
      } catch (err) {
        showToast('Failed to load candidate', 'error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [candidateId])

  const activePool = pools.find(p => p.id === poolId)
  const handlePoolChange = (pid: string) => {
    setPoolId(pid)
    const p = pools.find(x => x.id === pid)
    setStage(p?.stages[0] ?? '')
  }

  const logComm = async () => {
    if (!commText.trim()) { showToast('Enter a message to log', 'error'); return }
    setCommLogging(true)
    try {
      const newComm = await addCommunication({ candidate_id: candidateId, channel: 'LinkedIn', direction: commDir, message: commText.trim() })
      setComms(prev => [...prev, newComm])
      setCommText('')
      showToast('Communication logged', 'success')
    } catch (err: unknown) {
      showToast('Failed: ' + (err instanceof Error ? err.message : 'Unknown'), 'error')
    } finally {
      setCommLogging(false)
    }
  }

  const save = async () => {
    setSaving(true)
    try {
      await updateCandidate(candidateId, { pool_id: poolId, stage, next_action: nextAction, skills, notes })
      showToast('Changes saved', 'success')
      onUpdated()
      onClose()
    } catch (err: unknown) {
      showToast('Save failed: ' + (err instanceof Error ? err.message : 'Unknown'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!confirm('Delete this candidate? This cannot be undone.')) return
    setDeleting(true)
    try {
      await deleteCandidate(candidateId)
      showToast('Candidate deleted', 'error')
      onDeleted()
    } catch (err: unknown) {
      showToast('Delete failed: ' + (err instanceof Error ? err.message : 'Unknown'), 'error')
    } finally {
      setDeleting(false)
    }
  }

  const initials = candidate?.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? '??'
  const poolColor = activePool?.color || '#c8b560'

  return (
    <Modal
      title="Candidate Profile"
      onClose={onClose}
      maxWidth={720}
      footer={
        <div style={{ display: 'flex', gap: 8, width: '100%', justifyContent: 'space-between' }}>
          <Btn variant="danger" onClick={remove} disabled={deleting}>{deleting ? 'Deleting...' : 'Delete'}</Btn>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn onClick={onClose}>Close</Btn>
            <Btn variant="primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Btn>
          </div>
        </div>
      }
    >
      {loading || !candidate ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>Loading...</div>
      ) : (
        <>
          {/* Header */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 20 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: poolColor + '33', color: poolColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 20, flexShrink: 0 }}>
              {initials}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22 }}>{candidate.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>{candidate.role} · {candidate.company}</div>
              <div style={{ display: 'flex', gap: 14, marginTop: 8, flexWrap: 'wrap' }}>
                {[
                  candidate.location && `📍 ${candidate.location}`,
                  candidate.experience && `⏱ ${candidate.experience}`,
                  candidate.salary && `💰 ${candidate.salary}`,
                  candidate.notice_period && `📋 ${candidate.notice_period} notice`,
                  candidate.work_auth && `🛂 ${candidate.work_auth}`,
                ].filter(Boolean).map((item, i) => (
                  <span key={i} style={{ fontSize: 11, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 4 }}>{item}</span>
                ))}
                {candidate.linkedin_url && (
                  <a href={`https://${candidate.linkedin_url}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: 'var(--blue)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    🔗 LinkedIn
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Tags */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
            {candidate.skills.map(s => <Tag key={s} label={s} color="blue" />)}
            {candidate.languages.map(l => <Tag key={l} label={l} color="purple" />)}
          </div>

          {/* Stage / Pool controls */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <Field label="Pool">
              <Select value={poolId} onChange={handlePoolChange}>
                {pools.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
            </Field>
            <Field label="Stage">
              <Select value={stage} onChange={setStage}>
                {activePool?.stages.map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
            </Field>
          </div>

          {/* Skills editor */}
          <div style={{ marginBottom: 14 }}>
            <Field label="Skill Keywords">
              <TagEditor tags={skills} onChange={setSkills} />
            </Field>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: 4 }}>
            <Field label="Notes">
              <Textarea value={notes} onChange={setNotes} placeholder="Notes about this candidate..." rows={2} />
            </Field>
          </div>

          {/* Next action */}
          <div style={{ background: 'rgba(200,181,96,0.08)', border: '1px solid rgba(200,181,96,0.2)', borderRadius: 10, padding: '12px 14px', marginBottom: 4, marginTop: 12 }}>
            <div style={{ fontSize: 10, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 6 }}>Next Action</div>
            <Input value={nextAction} onChange={setNextAction} placeholder="e.g. Send JD for Proximus role by Friday..." />
          </div>

          {/* Comms log */}
          <SectionDivider label="LinkedIn Communications" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {comms.length === 0
              ? <div style={{ color: 'var(--text3)', fontSize: 12, padding: '8px 0' }}>No communications logged yet.</div>
              : comms.map(cm => (
                <div key={cm.id} style={{
                  background: 'var(--bg3)', border: '1px solid var(--border)',
                  borderLeft: `3px solid ${cm.direction === 'out' ? 'var(--accent)' : 'var(--blue)'}`,
                  borderRadius: 10, padding: '10px 14px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      🔗 {cm.channel} · {cm.direction === 'out' ? 'Sent' : 'Received'}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text3)' }}>{formatDate(cm.communicated_at)}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>{cm.message}</div>
                </div>
              ))}
          </div>

          {/* Log new comm */}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <Select value={commDir} onChange={v => setCommDir(v as 'out' | 'in')} style={{ width: 110, flexShrink: 0 }}>
              <option value="out">Sent</option>
              <option value="in">Received</option>
            </Select>
            <Input value={commText} onChange={setCommText} placeholder="Log a LinkedIn message..." />
            <Btn variant="primary" size="sm" onClick={logComm} disabled={commLogging}>{commLogging ? '...' : 'Log'}</Btn>
          </div>
        </>
      )}
    </Modal>
  )
}
