'use client'

import { useState, useRef } from 'react'
import type { Pool } from '@/types'
import { Modal, Btn, Field, Input, Select, Textarea, TagEditor, showToast } from './ui'
import { createCandidate } from '@/lib/supabase'

interface Props {
  pools: Pool[]
  onClose: () => void
  onSaved: () => void
}

interface Parsed {
  name?: string; role?: string; company?: string; location?: string
  experience?: string; notice?: string; salary?: string; auth?: string
  linkedin?: string; langs?: string[]; skills?: string[]
}

export default function UploadModal({ pools, onClose, onSaved }: Props) {
  const [step, setStep] = useState<'upload' | 'review'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [parsing, setParsing] = useState(false)
  const [parseMsg, setParseMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Form fields
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

  const activePool = pools.find(p => p.id === poolId)

  const handlePoolChange = (pid: string) => {
    setPoolId(pid)
    const p = pools.find(x => x.id === pid)
    setStage(p?.stages[0] ?? '')
  }

  const handleFile = (f: File) => setFile(f)

  const readFileText = (f: File): Promise<string> =>
    new Promise((res, rej) => {
      const reader = new FileReader()
      reader.onload = e => res(e.target?.result as string ?? '')
      reader.onerror = () => rej(new Error('File read failed'))
      reader.readAsText(f)
    })

  const parseCV = async () => {
    if (!file) { showToast('Select a file first', 'error'); return }
    setParsing(true)
    setParseMsg(null)
    try {
      const text = await readFileText(file)
      const res = await fetch('/api/parse-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const parsed: Parsed = await res.json()
      if ((parsed as { error?: string }).error) throw new Error((parsed as { error?: string }).error)

      setName(parsed.name ?? '')
      setRole(parsed.role ?? '')
      setCompany(parsed.company ?? '')
      setLocation(parsed.location ?? '')
      setExperience(parsed.experience ?? '')
      setNotice(parsed.notice ?? '')
      setSalary(parsed.salary ?? '')
      setAuth(parsed.auth ?? 'EU Citizen')
      setLinkedin(parsed.linkedin ?? '')
      setLangs((parsed.langs ?? []).join(', '))
      setSkills(parsed.skills ?? [])
      setParseMsg({ type: 'ok', text: '✓ CV parsed — review and confirm details below' })
      setStep('review')
      showToast('CV parsed successfully!', 'success')
    } catch (err: unknown) {
      setParseMsg({ type: 'err', text: 'Parsing failed: ' + (err instanceof Error ? err.message : 'Unknown error') + '. Fill details manually.' })
      setStep('review')
    } finally {
      setParsing(false)
    }
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
      showToast('Save failed: ' + (err instanceof Error ? err.message : 'Unknown error'), 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title="Upload CV"
      onClose={onClose}
      maxWidth={700}
      footer={
        <>
          <Btn onClick={onClose}>Cancel</Btn>
          {step === 'upload'
            ? <Btn variant="primary" onClick={parseCV} disabled={parsing || !file}>{parsing ? 'Parsing...' : 'Parse CV with Groq'}</Btn>
            : <Btn variant="primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Candidate'}</Btn>
          }
        </>
      }
    >
      {/* Upload zone */}
      {step === 'upload' && (
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
          style={{ border: '2px dashed var(--border2)', borderRadius: 16, padding: 32, textAlign: 'center', cursor: 'pointer' }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 4 }}>
            {file ? file.name : 'Drop CV here or click to browse'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>PDF or Word (.docx) — Groq will extract keywords automatically</div>
          <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
        </div>
      )}

      {parseMsg && (
        <div style={{
          marginTop: 12, padding: '10px 14px', borderRadius: 10, fontSize: 13,
          background: parseMsg.type === 'ok' ? 'rgba(74,222,128,0.08)' : 'rgba(248,113,113,0.08)',
          border: `1px solid ${parseMsg.type === 'ok' ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)'}`,
          color: parseMsg.type === 'ok' ? 'var(--green)' : 'var(--red)',
        }}>{parseMsg.text}</div>
      )}

      {/* Review form */}
      {step === 'review' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: parseMsg ? 16 : 0 }}>
          <Field label="Full Name *"><Input value={name} onChange={setName} placeholder="Jane Doe" /></Field>
          <Field label="Current Role"><Input value={role} onChange={setRole} placeholder="Senior Data Engineer" /></Field>
          <Field label="Current Company"><Input value={company} onChange={setCompany} placeholder="Accenture" /></Field>
          <Field label="Location"><Input value={location} onChange={setLocation} placeholder="Brussels" /></Field>
          <Field label="Experience"><Input value={experience} onChange={setExperience} placeholder="7 years" /></Field>
          <Field label="Notice Period"><Input value={notice} onChange={setNotice} placeholder="1 month" /></Field>
          <Field label="Expected Salary/Rate"><Input value={salary} onChange={setSalary} placeholder="€75,000 or €550/day" /></Field>
          <Field label="Work Authorisation">
            <Select value={auth} onChange={setAuth}>
              <option>EU Citizen</option>
              <option>Belgian Resident</option>
              <option>Requires Sponsorship</option>
              <option>Other</option>
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
            <Field label="Skill Keywords (AI-extracted — edit freely)">
              <TagEditor tags={skills} onChange={setSkills} placeholder="Add skill + Enter..." />
            </Field>
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <Field label="Notes"><Textarea value={notes} onChange={setNotes} placeholder="Any additional notes..." /></Field>
          </div>
        </div>
      )}
    </Modal>
  )
}
