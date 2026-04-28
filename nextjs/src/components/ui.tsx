// components/ui.tsx — shared micro-components
'use client'

import { ReactNode, CSSProperties } from 'react'
import clsx from 'clsx'

// ─── Button ──────────────────────────────
interface BtnProps {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
  disabled?: boolean
  type?: 'button' | 'submit'
  style?: CSSProperties
}
export function Btn({ children, onClick, variant = 'ghost', size = 'md', disabled, type = 'button', style }: BtnProps) {
  const base: CSSProperties = {
    border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
    borderRadius: 10, fontFamily: 'var(--font-sans)', fontWeight: 500,
    transition: 'all 0.15s', opacity: disabled ? 0.5 : 1,
    padding: size === 'sm' ? '5px 12px' : '8px 16px',
    fontSize: size === 'sm' ? 12 : 13,
    ...(variant === 'primary' ? { background: 'var(--accent)', color: '#0f0f11' } : {}),
    ...(variant === 'ghost'   ? { background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)' } : {}),
    ...(variant === 'danger'  ? { background: 'rgba(248,113,113,0.12)', color: 'var(--red)', border: '1px solid rgba(248,113,113,0.2)' } : {}),
    ...style,
  }
  return <button type={type} onClick={onClick} disabled={disabled} style={base}>{children}</button>
}

// ─── Input ───────────────────────────────
interface InputProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  style?: CSSProperties
}
export function Input({ value, onChange, placeholder, type = 'text', style }: InputProps) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        background: 'var(--bg4)', border: '1px solid var(--border2)',
        borderRadius: 10, padding: '9px 12px', color: 'var(--text)',
        fontSize: 13, outline: 'none', fontFamily: 'var(--font-sans)', width: '100%',
        ...style,
      }}
    />
  )
}

// ─── Select ──────────────────────────────
interface SelectProps {
  value: string
  onChange: (v: string) => void
  children: ReactNode
  style?: CSSProperties
}
export function Select({ value, onChange, children, style }: SelectProps) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        background: 'var(--bg4)', border: '1px solid var(--border2)',
        borderRadius: 10, padding: '9px 12px', color: 'var(--text)',
        fontSize: 13, outline: 'none', fontFamily: 'var(--font-sans)',
        width: '100%', cursor: 'pointer',
        ...style,
      }}
    >
      {children}
    </select>
  )
}

// ─── Textarea ────────────────────────────
interface TextareaProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
  style?: CSSProperties
}
export function Textarea({ value, onChange, placeholder, rows = 3, style }: TextareaProps) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{
        background: 'var(--bg4)', border: '1px solid var(--border2)',
        borderRadius: 10, padding: '9px 12px', color: 'var(--text)',
        fontSize: 13, outline: 'none', fontFamily: 'var(--font-sans)',
        width: '100%', resize: 'vertical',
        ...style,
      }}
    />
  )
}

// ─── FormField ───────────────────────────
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

// ─── Modal shell ─────────────────────────
interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
  footer: ReactNode
  maxWidth?: number
}
export function Modal({ title, onClose, children, footer, maxWidth = 680 }: ModalProps) {
  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
        zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20, backdropFilter: 'blur(4px)',
      }}
    >
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border2)',
        borderRadius: 16, width: '100%', maxWidth,
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
      }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--text)' }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 22, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: '20px 24px' }}>{children}</div>
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>{footer}</div>
      </div>
    </div>
  )
}

// ─── Tag ─────────────────────────────────
export function Tag({ label, color = 'blue', onRemove }: { label: string; color?: 'blue' | 'purple' | 'default'; onRemove?: () => void }) {
  const colors = {
    blue:    { bg: 'rgba(96,165,250,0.1)',   text: '#60a5fa', border: 'rgba(96,165,250,0.2)' },
    purple:  { bg: 'rgba(167,139,250,0.1)',  text: '#a78bfa', border: 'rgba(167,139,250,0.2)' },
    default: { bg: 'var(--bg4)',             text: 'var(--text2)', border: 'var(--border)' },
  }
  const c = colors[color]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 500,
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
    }}>
      {label}
      {onRemove && (
        <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 12, opacity: 0.6, padding: 0, lineHeight: 1 }}>×</button>
      )}
    </span>
  )
}

// ─── Tag editor ──────────────────────────
interface TagEditorProps {
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
}
export function TagEditor({ tags, onChange, placeholder = 'Add skill + Enter...' }: TagEditorProps) {
  const [input, setInput] = useState('')
  const add = () => {
    const v = input.trim().replace(/,$/, '')
    if (v && !tags.includes(v)) onChange([...tags, v])
    setInput('')
  }
  return (
    <div
      onClick={(e) => (e.currentTarget.querySelector('input') as HTMLInputElement)?.focus()}
      style={{
        display: 'flex', flexWrap: 'wrap', gap: 6, padding: 8,
        background: 'var(--bg4)', border: '1px solid var(--border2)',
        borderRadius: 10, minHeight: 44, cursor: 'text',
      }}
    >
      {tags.map(t => (
        <Tag key={t} label={t} color="blue" onRemove={() => onChange(tags.filter(x => x !== t))} />
      ))}
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add() } }}
        placeholder={tags.length === 0 ? placeholder : ''}
        style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 12, fontFamily: 'var(--font-sans)', minWidth: 80 }}
      />
    </div>
  )
}

// ─── Toast ───────────────────────────────
import { useState, useEffect } from 'react'

let _setToasts: React.Dispatch<React.SetStateAction<{ id: number; msg: string; type: string }[]>> | null = null

export function showToast(msg: string, type: 'success' | 'error' | 'info' = 'info') {
  _setToasts?.(prev => [...prev, { id: Date.now(), msg, type }])
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<{ id: number; msg: string; type: string }[]>([])
  _setToasts = setToasts
  useEffect(() => {
    if (!toasts.length) return
    const t = setTimeout(() => setToasts(prev => prev.slice(1)), 3500)
    return () => clearTimeout(t)
  }, [toasts])
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: 'var(--bg3)', border: `1px solid var(--border2)`,
          borderLeft: `3px solid ${t.type === 'success' ? 'var(--green)' : t.type === 'error' ? 'var(--red)' : 'var(--accent)'}`,
          borderRadius: 10, padding: '12px 18px', fontSize: 13, color: 'var(--text)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)', maxWidth: 300,
          animation: 'slideUp 0.3s ease',
        }}>
          {t.msg}
        </div>
      ))}
      <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  )
}

// ─── Stage pill ──────────────────────────
export function StagePill({ stage, color }: { stage: string; color?: string }) {
  const c = color || '#888'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 500,
      background: c + '22', color: c,
    }}>
      {stage}
    </span>
  )
}

// ─── Section divider ─────────────────────
export function SectionDivider({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '18px 0 12px', fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>
      {label}
      <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  )
}

// ─── Empty state ─────────────────────────
export function EmptyState({ icon, title, sub }: { icon: string; title: string; sub?: string }) {
  return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>
      <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.4 }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text2)', marginBottom: 6 }}>{title}</div>
      {sub && <div style={{ fontSize: 12 }}>{sub}</div>}
    </div>
  )
}
