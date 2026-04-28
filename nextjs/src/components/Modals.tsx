'use client'

// ─── AddManualModal ───────────────────────────────────────────────────────────

import { useState } from 'react'
import type { Pool } from '@/types'
import { Modal, Btn, Field, Input, Select, Textarea, TagEditor, showToast } from './ui'
import { createCandidate, createPool, updatePoolStages } from '@/lib/supabase'

interface AddManualProps { pools: Pool[]; onClose: () => void; onSaved: () => void }

export function AddManualModal({ pools, onClose, onSaved }: AddManualProps) {
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [company, setCompany] = useState('')
  const [location, setLocation] = useState('')
  const [experience, setExperience] = useState('')
  const [notice, setNotice] = useState('')
  const [salary, setSalary] = useState('')
  const [auth, setAuth] = useState('EU Citizen')
  const [linkedin, setLinkedin] = useState('')
  const [langs, setLangs] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [poolId, setPoolId] = useState(pools[0]?.id ?? '')
  const [stage, setStage] = useState(pools[0]?.stages[0] ?? '')
  const [saving, setSaving] = useState(false)

  const activePool = pools.find(p => p.id === poolId)
  const handlePoolChange = (pid: string) => {
    setPoolId(pid)
    const p = pools.find(x => x.id === pid)
    setStage(p?.stages[0] ?? '')
  }

  const save = async () => {
    if (!name.trim()) { showToast('Name is required', 'error'); return }
    setSaving(true)
    try {
      await createCandidate({
        name: name.trim(), role, company, location, experience,
        notice_period: notice, salary, work_auth: auth,
        linkedin_url: linkedin,
        languages: langs.split(',').map(s => s.trim()).filter(Boolean),
        skills, notes, pool_id: poolId, stage,
      })
      showToast(`${name} added!`, 'success')
      onSaved()
    } catch (err: unknown) {
      showToast('Save failed: ' + (err instanceof Error ? err.message : 'Unknown'), 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Add Candidate" onClose={onClose} maxWidth={700}
      footer={<><Btn onClick={onClose}>Cancel</Btn><Btn variant="primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Candidate'}</Btn></>}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="Full Name *"><Input value={name} onChange={setName} placeholder="Jane Doe" /></Field>
        <Field label="Current Role"><Input value={role} onChange={setRole} placeholder="Senior Data Engineer" /></Field>
        <Field label="Current Company"><Input value={company} onChange={setCompany} placeholder="Accenture" /></Field>
        <Field label="Location"><Input value={location} onChange={setLocation} placeholder="Brussels" /></Field>
        <Field label="Experience"><Input value={experience} onChange={setExperience} placeholder="7 years" /></Field>
        <Field label="Notice Period"><Input value={notice} onChange={setNotice} placeholder="1 month" /></Field>
        <Field label="Expected Salary/Rate"><Input value={salary} onChange={setSalary} placeholder="€75,000 or €550/day" /></Field>
        <Field label="Work Authorisation">
          <Select value={auth} onChange={setAuth}>
            <option>EU Citizen</option><option>Belgian Resident</option>
            <option>Requires Sponsorship</option><option>Other</option>
          </Select>
        </Field>
        <Field label="LinkedIn URL"><Input value={linkedin} onChange={setLinkedin} placeholder="linkedin.com/in/..." /></Field>
        <Field label="Languages"><Input value={langs} onChange={setLangs} placeholder="Dutch, French, English" /></Field>
        <Field label="Pool">
          <Select value={poolId} onChange={handlePoolChange}>
            {pools.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
        </Field>
        <Field label="Pipeline Stage">
          <Select value={stage} onChange={setStage}>
            {activePool?.stages.map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
        </Field>
        <div style={{ gridColumn: '1/-1' }}>
          <Field label="Skill Keywords">
            <TagEditor tags={skills} onChange={setSkills} placeholder="Add skill + Enter..." />
          </Field>
        </div>
        <div style={{ gridColumn: '1/-1' }}>
          <Field label="Notes"><Textarea value={notes} onChange={setNotes} placeholder="Any additional notes..." /></Field>
        </div>
      </div>
    </Modal>
  )
}

// ─── AddPoolModal ─────────────────────────────────────────────────────────────

const POOL_COLORS = ['#c8b560','#60a5fa','#4ade80','#f87171','#a78bfa','#2dd4bf','#fb923c','#f472b6']

interface AddPoolProps { onClose: () => void; onSaved: () => void }

export function AddPoolModal({ onClose, onSaved }: AddPoolProps) {
  const [name, setName] = useState('')
  const [stagesRaw, setStagesRaw] = useState('New Lead, Screening, Interview, Offer, Placed')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!name.trim()) { showToast('Pool name required', 'error'); return }
    const stages = stagesRaw.split(',').map(s => s.trim()).filter(Boolean)
    const color = POOL_COLORS[Math.floor(Math.random() * POOL_COLORS.length)]
    setSaving(true)
    try {
      await createPool(name.trim(), color, stages)
      showToast(`Pool "${name}" created!`, 'success')
      onSaved()
    } catch (err: unknown) {
      showToast('Failed: ' + (err instanceof Error ? err.message : 'Unknown'), 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Add Pool" onClose={onClose} maxWidth={420}
      footer={<><Btn onClick={onClose}>Cancel</Btn><Btn variant="primary" onClick={save} disabled={saving}>{saving ? 'Creating...' : 'Create Pool'}</Btn></>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Pool Name"><Input value={name} onChange={setName} placeholder="e.g. Frontend Developers" /></Field>
        <Field label="Pipeline Stages (comma separated)">
          <Input value={stagesRaw} onChange={setStagesRaw} placeholder="New Lead, Screening, Interview, Offer, Placed" />
        </Field>
      </div>
    </Modal>
  )
}

// ─── EditStagesModal ──────────────────────────────────────────────────────────

interface EditStagesProps { pools: Pool[]; activePipelinePool: string; onClose: () => void; onSaved: () => void }

export function EditStagesModal({ pools, activePipelinePool, onClose, onSaved }: EditStagesProps) {
  const [selectedPoolId, setSelectedPoolId] = useState(activePipelinePool || pools[0]?.id || '')
  const [stages, setStages] = useState<string[]>(() => {
    const p = pools.find(x => x.id === (activePipelinePool || pools[0]?.id))
    return p?.stages ?? []
  })
  const [saving, setSaving] = useState(false)

  const handlePoolChange = (pid: string) => {
    setSelectedPoolId(pid)
    const p = pools.find(x => x.id === pid)
    setStages(p?.stages ?? [])
  }

  const updateStage = (idx: number, val: string) => {
    setStages(prev => prev.map((s, i) => i === idx ? val : s))
  }

  const removeStage = (idx: number) => {
    if (stages.length <= 1) { showToast('Need at least one stage', 'error'); return }
    setStages(prev => prev.filter((_, i) => i !== idx))
  }

  const save = async () => {
    const clean = stages.map(s => s.trim()).filter(Boolean)
    if (!clean.length) { showToast('Add at least one stage', 'error'); return }
    setSaving(true)
    try {
      await updatePoolStages(selectedPoolId, clean)
      showToast('Stages saved!', 'success')
      onSaved()
    } catch (err: unknown) {
      showToast('Save failed: ' + (err instanceof Error ? err.message : 'Unknown'), 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Edit Pipeline Stages" onClose={onClose} maxWidth={440}
      footer={<><Btn onClick={onClose}>Cancel</Btn><Btn variant="primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Stages'}</Btn></>}
    >
      <div style={{ marginBottom: 14 }}>
        <Field label="Pool">
          <Select value={selectedPoolId} onChange={handlePoolChange} style={{ marginTop: 5 }}>
            {pools.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
        </Field>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {stages.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 12px' }}>
            <span style={{ color: 'var(--text3)', fontSize: 14, cursor: 'move' }}>⠿</span>
            <input
              value={s}
              onChange={e => updateStage(i, e.target.value)}
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 13, fontFamily: 'var(--font-sans)' }}
            />
            <button onClick={() => removeStage(i)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 18, padding: '0 2px', lineHeight: 1 }}>×</button>
          </div>
        ))}
      </div>

      <button onClick={() => setStages(prev => [...prev, 'New Stage'])} style={{
        marginTop: 10, background: 'transparent', border: '1px dashed var(--border2)',
        borderRadius: 10, padding: '7px 14px', color: 'var(--text3)', cursor: 'pointer',
        fontSize: 12, fontFamily: 'var(--font-sans)', width: '100%',
      }}>
        + Add Stage
      </button>
    </Modal>
  )
}

// Default exports for dynamic import compatibility
export default AddManualModal
