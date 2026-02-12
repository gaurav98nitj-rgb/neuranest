import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTopics, useWatchlist, useAddToWatchlist, useRemoveFromWatchlist } from '../hooks/useData'
import { ChevronLeft, ChevronRight, Download, Bookmark, BookmarkCheck, Loader2, Search } from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer } from 'recharts'
import { api } from '../lib/api'
import clsx from 'clsx'

const STAGES = ['All', 'emerging', 'exploding', 'peaking', 'declining']
const CATEGORIES = ['All', 'Electronics', 'Health', 'Home', 'Beauty', 'Fitness', 'Kitchen', 'Outdoors', 'Pets', 'Baby']

const STAGE_STYLES: Record<string, string> = {
  emerging: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
  exploding: 'bg-orange-500/15 text-orange-400 border border-orange-500/20',
  peaking: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20',
  declining: 'bg-red-500/15 text-red-400 border border-red-500/20',
  unknown: 'bg-brand-500/10 text-brand-400 border border-brand-500/20',
}

function StageBadge({ stage }: { stage: string }) {
  return (
    <span className={clsx('text-xs font-medium px-2.5 py-0.5 rounded-full capitalize', STAGE_STYLES[stage] || STAGE_STYLES.unknown)}>
      {stage}
    </span>
  )
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-brand-400/40">—</span>
  const color = score >= 70 ? 'text-emerald-400' : score >= 40 ? 'text-yellow-400' : 'text-red-400'
  return <span className={clsx('font-bold text-sm tabular-nums', color)}>{score.toFixed(1)}</span>
}

function MiniSparkline({ data }: { data: number[] }) {
  if (!data || data.length === 0) return null
  const chartData = data.map((v) => ({ v }))
  const isRising = data[data.length - 1] > data[0]
  return (
    <ResponsiveContainer width={80} height={30}>
      <AreaChart data={chartData}>
        <Area type="monotone" dataKey="v"
          stroke={isRising ? '#10B981' : '#EF4444'}
          fill={isRising ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}
          strokeWidth={1.5} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function WatchlistButton({ topicId, watchlistIds, onAdd, onRemove }: {
  topicId: string; watchlistIds: Set<string>; onAdd: (id: string) => void; onRemove: (id: string) => void
}) {
  const isWatched = watchlistIds.has(topicId)
  return (
    <button
      onClick={(e) => { e.stopPropagation(); isWatched ? onRemove(topicId) : onAdd(topicId) }}
      className={clsx('p-1.5 rounded-lg transition-all', isWatched
        ? 'text-brand-400 bg-brand-500/15'
        : 'text-brand-400/30 hover:text-brand-400 hover:bg-brand-500/10'
      )}
      title={isWatched ? 'Remove from watchlist' : 'Add to watchlist'}
    >
      {isWatched ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
    </button>
  )
}

export default function ExplorerPage() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState({
    category: 'All', stage: 'All', search: '', sort: '-opportunity_score', page: 1, page_size: 20,
  })
  const [exporting, setExporting] = useState(false)

  const params: Record<string, any> = { sort: filters.sort, page: filters.page, page_size: filters.page_size }
  if (filters.category !== 'All') params.category = filters.category
  if (filters.stage !== 'All') params.stage = filters.stage
  if (filters.search) params.search = filters.search

  const { data, isLoading } = useTopics(params)
  const topics = data?.data || []
  const pagination = data?.pagination || { page: 1, page_size: 20, total: 0, total_pages: 0 }

  const { data: watchlistItems } = useWatchlist()
  const addMutation = useAddToWatchlist()
  const removeMutation = useRemoveFromWatchlist()
  const watchlistIds = new Set((watchlistItems || []).map((w: any) => w.topic_id))

  const handleExport = async () => {
    setExporting(true)
    try {
      const exportParams: Record<string, any> = {}
      if (filters.category !== 'All') exportParams.category = filters.category
      if (filters.stage !== 'All') exportParams.stage = filters.stage
      const response = await api.get('/exports/topics.csv', { params: exportParams, responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const a = document.createElement('a')
      a.href = url; a.download = 'neuranest_topics_export.csv'
      document.body.appendChild(a); a.click(); a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) { console.error('Export failed:', err) }
    finally { setExporting(false) }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Trend Explorer</h1>
          <p className="text-sm text-brand-300/50 mt-1">Discover emerging product opportunities with predictive intelligence</p>
        </div>
        <button onClick={handleExport} disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-400 text-sm font-medium disabled:opacity-50 transition-colors">
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-400/40" />
            <input type="text" placeholder="Search topics..." value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
              className="w-full pl-10 pr-3 py-2 text-sm" />
          </div>
          <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value, page: 1 })}
            className="px-3 py-2 text-sm">
            {CATEGORIES.map(c => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>)}
          </select>
          <div className="flex gap-1">
            {STAGES.map(s => (
              <button key={s} onClick={() => setFilters({ ...filters, stage: s, page: 1 })}
                className={clsx('px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                  filters.stage === s
                    ? 'bg-brand-500 text-white'
                    : 'bg-surface-1 text-brand-300/50 hover:text-brand-300 hover:bg-surface-2 border border-line')}>
                {s === 'All' ? 'All Stages' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-line">
              <th className="px-3 py-3 w-10"></th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-brand-300/50 uppercase tracking-wider">Topic</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-brand-300/50 uppercase tracking-wider">Stage</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-brand-300/50 uppercase tracking-wider">Category</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-brand-300/50 uppercase tracking-wider">Trend</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-brand-300/50 uppercase tracking-wider">Score</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-brand-300/50 uppercase tracking-wider">Competition</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-brand-300/50 uppercase tracking-wider">Sources</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-brand-400/40">Loading trends...</td></tr>
            ) : topics.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-brand-400/40">No topics found</td></tr>
            ) : topics.map((topic: any) => (
              <tr key={topic.id} onClick={() => navigate(`/topics/${topic.id}`)}
                className="cursor-pointer transition-colors hover:bg-surface-2/50">
                <td className="px-3 py-3 text-center">
                  <WatchlistButton topicId={topic.id} watchlistIds={watchlistIds}
                    onAdd={(id) => addMutation.mutate(id)} onRemove={(id) => removeMutation.mutate(id)} />
                </td>
                <td className="px-4 py-3"><span className="font-medium text-brand-100">{topic.name}</span></td>
                <td className="px-4 py-3"><StageBadge stage={topic.stage} /></td>
                <td className="px-4 py-3 text-sm text-brand-300/50">{topic.primary_category || '—'}</td>
                <td className="px-4 py-3 flex justify-center"><MiniSparkline data={topic.sparkline || []} /></td>
                <td className="px-4 py-3 text-center"><ScoreBadge score={topic.opportunity_score} /></td>
                <td className="px-4 py-3 text-center"><ScoreBadge score={topic.competition_index} /></td>
                <td className="px-4 py-3 text-center">
                  <span className="text-xs text-brand-400/40">{topic.sources_active?.length || 0} sources</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {pagination.total_pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-line">
            <span className="text-sm text-brand-300/50">
              Showing {(pagination.page - 1) * pagination.page_size + 1}–{Math.min(pagination.page * pagination.page_size, pagination.total)} of {pagination.total}
            </span>
            <div className="flex gap-2">
              <button onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                disabled={filters.page <= 1} className="p-1.5 rounded-lg hover:bg-surface-2 text-brand-300 disabled:opacity-30 transition-colors">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                disabled={filters.page >= pagination.total_pages} className="p-1.5 rounded-lg hover:bg-surface-2 text-brand-300 disabled:opacity-30 transition-colors">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
