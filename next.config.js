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
  error?: string
}

export default function UploadModal({ pools, onClose, onSaved }: Props) {
  const [step, setStep] = useState<'upload' | 'review'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [parsing, setParsing] = useState(false)
  const [parseMsg, setParseMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Form state
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

  const handleFile = (f: File) => {
    const allowed = ['.pdf', '.doc', '.docx', '.txt']
    const ext = '.' + f.name.split('.').pop()?.toLowerCase()
    if (!allowed.includes(ext)) {
      showToast('Please upload a PDF, Word (.docx), or .txt file', 'error')
      return
    }
    setFile(f)
    setParseMsg(null)
  }

  // ── Parse CV — sends file as FormData to /api/parse-cv ────────────────────
  const parseCV = async () => {
    if (!file) { showToast('Select a file first', 'error'); return }
    setParsing(true)
    setParseMsg(null)

    try {
      const form = new FormData()
      form.append('file', file)

      const res = await fetch('/api/parse-cv', {
        method: 'POST',
        body: form, // ← binary multipart — no Content-Type header needed
      })

      const parsed: Parsed = await res.json()

      if (parsed.error) throw new Error(parsed.error)

      // Populate form fields with extracted data
      setName(parsed.name ?? '')
      setRole(parsed.role ?? '')
      setCompany(parsed.company ?? '')
      setLocation(parsed.location ?? '')
      setExperience(parsed.experience ?? '')
      setNotice(parsed.notice ?? '')
      setSalary(parsed.salary ?? '')
      if (parsed.auth) setAuth(parsed.auth)
      setLinkedin(parsed.linkedin ?? '')
      setLangs((parsed.langs ?? []).join(', '))
      setSkills(parsed.skills ?? [])

      setParseMsg({ type: 'ok', text: `✓ CV parsed — ${parsed.skills?.length ?? 0} skills extracted. Review and confirm below.` })
      setStep('review')
      showToast('CV parsed successfully!', 'success')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setParseMsg({ type: 'err', text: `Parsing failed: ${msg}. Fill details manually below.` })
      setStep('review')
      showToast('Parsing failed — fill manually', 'error')
    } finally {
      setParsing(false)
    }
  }

  // ── Save candidate to Supabase ─────────────────────────────────────────────
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

  const skipToManual = () => {
    setParseMsg({ type: 'ok', text: 'Filling manually — all fields editable below.' })
    setStep('review')
  }

  return (
    <Modal
      title="Upload CV"
      onClose={onClose}
      maxWidth={700}
      footer={
        <>
          <Btn onClick={onClose}>Cancel</Btn>
          {step === 'upload' ? (
            <>
              <Btn onClick={skipToManual}>Fill Manually</Btn>
              <Btn variant="primary" onClick={parseCV} disabled={parsing || !file}>
                {parsing ? '⏳ Parsing CV...' : '✦ Parse with Groq'}
              </Btn>
            </>
          ) : (
            <Btn variant="primary" onClick={save} disabled={saving}>
              {saving ? 'Saving...' : 'Save Candidate'}
            </Btn>
          )}
        </>
      }
    >
      {/* ── Step 1: Drop zone ── */}
      {step === 'upload' && (
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
          style={{
            border: `2px dashed ${file ? 'var(--accent)' : 'var(--border2)'}`,
            borderRadius: 16, padding: 36, textAlign: 'center', cursor: 'pointer',
            background: file ? 'rgba(200,181,96,0.04)' : 'transparent',
            transition: 'all 0.2s',
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 10 }}>{file ? '📄' : '☁️'}</div>
          <div style={{ fontSize: 14, color: 'var(--text)', marginBottom: 4, fontWeight: 500 }}>
            {file ? file.name : 'Drop CV here or click to browse'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>
            {file
              ? `${(file.size / 1024).toFixed(0)} KB · Ready to parse`
              : 'PDF or Word (.docx) supported · Groq will auto-extract keywords'}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          />
        </div>
      )}

      {/* Parse status message */}
      {parseMsg && (
        <div style={{
          marginTop: 14, padding: '10px 14px', borderRadius: 10, fontSize: 13,
          background: parseMsg.type === 'ok' ? 'rgba(74,222,128,0.08)' : 'rgba(248,113,113,0.08)',
          border: `1px solid ${parseMsg.type === 'ok' ? 'rgba(74,222,128,0.25)' : 'rgba(248,113,113,0.25)'}`,
          color: parseMsg.type === 'ok' ? 'var(--green)' : 'var(--red)',
        }}>
          {parseMsg.text}
        </div>
      )}

      {/* ── Step 2: Review form ── */}
      {step === 'review' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 16 }}>
          <Field label="Full Name *"><Input value={name} onChange={setName} placeholder="Jane Doe" /></Field>
          <Field label="Current Role"><Input value={role} onChange={setRole} placeholder="Senior Data Engineer" /></Field>
          <Field label="Current Company"><Input value={company} onChange={setCompany} placeholder="Accenture" /></Field>
          <Field label="Location"><Input value={location} onChange={setLocation} placeholder="Brussels" /></Field>
          <Field label="Experience"><Input value={experience} onChange={setExperience} placeholder="7 years" /></Field>
          <Field label="Notice Period"><Input value={notice} onChange={setNotice} placeholder="1 month" /></Field>
          <Field label="Expected Salary / Rate"><Input value={salary} onChange={setSalary} placeholder="€75,000 or €550/day" /></Field>
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
            <Field label="Skill Keywords — AI extracted, edit freely">
              <TagEditor tags={skills} onChange={setSkills} placeholder="Add skill + Enter..." />
            </Field>
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <Field label="Notes">
              <Textarea value={notes} onChange={setNotes} placeholder="Any additional notes..." />
            </Field>
          </div>
        </div>
      )}
    </Modal>
  )
}
