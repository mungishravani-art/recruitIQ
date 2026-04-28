'use client'

import { useState } from 'react'
import type { Pool } from '@/types'
import type { Page } from '@/app/page'
import AddPoolModal from './AddPoolModal'

interface Props {
  pools: Pool[]
  activePage: Page
  onNavigate: (p: Page) => void
  onPoolClick: (pid: string) => void
  onAddPool: () => void
}

const NAV = [
  { key: 'dashboard' as Page, label: 'Dashboard', icon: '⊞' },
  { key: 'search'    as Page, label: 'Search Candidates', icon: '⌕' },
  { key: 'pipeline'  as Page, label: 'Pipeline', icon: '⊟' },
]

export default function Sidebar({ pools, activePage, onNavigate, onPoolClick, onAddPool }: Props) {
  const [showAddPool, setShowAddPool] = useState(false)

  return (
    <>
      <aside style={{
        width: 220, flexShrink: 0, background: 'var(--bg2)',
        borderRight: '1px solid var(--border)', display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--accent)' }}>RecruitIQ</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1, fontWeight: 300 }}>
            Belgium Market{' '}
            <span style={{ display: 'inline-flex', height: 12, width: 20, borderRadius: 2, overflow: 'hidden', verticalAlign: 'middle', marginLeft: 4 }}>
              <span style={{ flex: 1, background: '#1E1E1E' }}/>
              <span style={{ flex: 1, background: '#F5D00B' }}/>
              <span style={{ flex: 1, background: '#C8102E' }}/>
            </span>
          </div>
        </div>

        {/* Nav */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          <div style={{ padding: '10px 10px 4px', fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
            Navigation
          </div>
          {NAV.map(n => (
            <button key={n.key} onClick={() => onNavigate(n.key)} style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '8px 10px', margin: '1px 6px',
              borderRadius: 10, cursor: 'pointer',
              color: activePage === n.key ? 'var(--accent)' : 'var(--text2)',
              background: activePage === n.key ? 'rgba(200,181,96,0.12)' : 'transparent',
              fontWeight: activePage === n.key ? 500 : 400,
              fontSize: 13, border: 'none', width: 'calc(100% - 12px)',
              textAlign: 'left', fontFamily: 'var(--font-sans)',
            }}>
              <span style={{ fontSize: 15, opacity: 0.8 }}>{n.icon}</span>
              {n.label}
            </button>
          ))}

          <div style={{ padding: '10px 10px 4px', marginTop: 8, fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
            Pools
          </div>
          {pools.map(p => (
            <button key={p.id} onClick={() => onPoolClick(p.id)} style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '8px 10px', margin: '1px 6px',
              borderRadius: 10, cursor: 'pointer',
              color: 'var(--text2)', background: 'transparent',
              fontSize: 13, border: 'none', width: 'calc(100% - 12px)',
              textAlign: 'left', fontFamily: 'var(--font-sans)',
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }}/>
              {p.name}
            </button>
          ))}

          <button onClick={() => setShowAddPool(true)} style={{
            display: 'flex', alignItems: 'center', gap: 9,
            padding: '8px 10px', margin: '1px 6px',
            borderRadius: 10, cursor: 'pointer',
            color: 'var(--text3)', background: 'transparent',
            fontSize: 12, border: 'none', width: 'calc(100% - 12px)',
            textAlign: 'left', fontFamily: 'var(--font-sans)',
          }}>
            <span style={{ fontSize: 15 }}>+</span> Add Pool
          </button>
        </div>
      </aside>

      {showAddPool && (
        <AddPoolModal
          onClose={() => setShowAddPool(false)}
          onSaved={() => { setShowAddPool(false); onAddPool() }}
        />
      )}
    </>
  )
}
