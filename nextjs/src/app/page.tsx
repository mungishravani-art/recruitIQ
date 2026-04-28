'use client'

import { useEffect, useState, useCallback } from 'react'
import Sidebar from '@/components/Sidebar'
import DashboardPage from '@/components/DashboardPage'
import SearchPage from '@/components/SearchPage'
import PipelinePage from '@/components/PipelinePage'
import UploadModal from '@/components/UploadModal'
import AddManualModal from '@/components/AddManualModal'
import CandidateProfileModal from '@/components/CandidateProfileModal'
import { getPools, getCandidates, getDashboardMetrics } from '@/lib/supabase'
import type { Pool, Candidate, DashboardMetrics } from '@/types'

export type Page = 'dashboard' | 'search' | 'pipeline'

export default function Home() {
  const [page, setPage] = useState<Page>('dashboard')
  const [pools, setPools] = useState<Pool[]>([])
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [metrics, setMetrics] = useState<DashboardMetrics>({ total: 0, addedThisWeek: 0, placed: 0, stale: 0 })
  const [activePipelinePool, setActivePipelinePool] = useState<string>('')
  const [showUpload, setShowUpload] = useState(false)
  const [showAddManual, setShowAddManual] = useState(false)
  const [profileCandidateId, setProfileCandidateId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const [poolsData, candidatesData, metricsData] = await Promise.all([
        getPools(),
        getCandidates(),
        getDashboardMetrics(),
      ])
      setPools(poolsData ?? [])
      setCandidates(candidatesData ?? [])
      setMetrics(metricsData)
      if (!activePipelinePool && poolsData?.length) {
        setActivePipelinePool(poolsData[0].id)
      }
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }, [activePipelinePool])

  useEffect(() => { refresh() }, [refresh])

  const openProfile = (id: string) => setProfileCandidateId(id)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--accent)', marginBottom: 12 }}>
            RecruitIQ
          </div>
          <div style={{ color: 'var(--text3)', fontSize: 13 }}>Loading Belgium market data...</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        pools={pools}
        activePage={page}
        onNavigate={setPage}
        onPoolClick={(pid) => { setActivePipelinePool(pid); setPage('pipeline') }}
        onAddPool={refresh}
      />

      <main style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {page === 'dashboard' && (
          <DashboardPage
            candidates={candidates}
            metrics={metrics}
            pools={pools}
            onOpenProfile={openProfile}
            onUpload={() => setShowUpload(true)}
            onAddManual={() => setShowAddManual(true)}
          />
        )}
        {page === 'search' && (
          <SearchPage
            candidates={candidates}
            pools={pools}
            onOpenProfile={openProfile}
            onUpload={() => setShowUpload(true)}
            onAddManual={() => setShowAddManual(true)}
          />
        )}
        {page === 'pipeline' && (
          <PipelinePage
            candidates={candidates}
            pools={pools}
            activePipelinePool={activePipelinePool}
            onSelectPool={setActivePipelinePool}
            onOpenProfile={openProfile}
            onUpload={() => setShowUpload(true)}
            onAddPool={refresh}
            onStagesUpdated={refresh}
          />
        )}
      </main>

      {showUpload && (
        <UploadModal
          pools={pools}
          onClose={() => setShowUpload(false)}
          onSaved={() => { setShowUpload(false); refresh() }}
        />
      )}

      {showAddManual && (
        <AddManualModal
          pools={pools}
          onClose={() => setShowAddManual(false)}
          onSaved={() => { setShowAddManual(false); refresh() }}
        />
      )}

      {profileCandidateId && (
        <CandidateProfileModal
          candidateId={profileCandidateId}
          pools={pools}
          onClose={() => setProfileCandidateId(null)}
          onUpdated={refresh}
          onDeleted={() => { setProfileCandidateId(null); refresh() }}
        />
      )}
    </div>
  )
}
