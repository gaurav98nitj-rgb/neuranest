import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTopics, useWatchlist, useAddToWatchlist, useRemoveFromWatchlist } from '../hooks/useData'
import { ChevronLeft, ChevronRight, Download, Bookmark, BookmarkCheck, Loader2 } from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer } from 'recharts'
import { api } from '../lib/api'
import clsx from 'clsx'

const STAGES = ['All', 'emerging', 'exploding', 'peaking', 'declining']
const CATEGORIES = ['All', 'Electronics', 'Health', 'Home', 'Beauty', 'Fitness', 'Kitchen', 'Outdoors', 'Pets', 'Baby']

function StageBadge({ stage }: { stage: string }) {
  const styles: Record<string, string> = {
    emerging: 'bg-green-100 text-green-800',
    exploding: 'bg-orange-100 text-orange-800',
    peaking: 'bg-yellow-100 text-yellow-800',
    declining: 'bg-red-100 text-red-800',
    unknown: 'bg-gray-100 text-gray-600',
  }
  return (
    <span className={clsx('text-xs font-medium px-2.5 py-0.5 rounded-full capitalize', styles[stage] || styles.unknown)}>
      {stage}
    </span>
  )
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-gray-400">—</span>
  const color = score >= 70 ? 'text-green-600' : score >= 40 ? 'text-yellow-600' : 'text-red-600'
  return <span className={clsx('font-bold text-sm', color)}>{score.toFixed(1)}</span>
}

function MiniSparkline({ data }: { data: number[] }) {
  if (!data || data.length === 0) return null
  const chartData = data.map((v) => ({ v }))
  const isRising = data[data.length - 1] > data[0]
  return (
    <ResponsiveContainer width={80} height={30}>
      <AreaChart data={chartData}>
        <Area type="monotone" dataKey="v" stroke={isRising ? '#22c55e' : '#ef4444'} fill={isRising ? '#dcfce7' : '#fef2f2'} strokeWidth={1.5} />
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
        ? 'text-brand-600 bg-brand-50 hover:bg-brand-100'
        : 'text-gray-300 hover:text-brand-500 hover:bg-gray-50'
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trend Explorer</h1>
          <p className="text-sm text-gray-500 mt-1">Discover emerging product opportunities with predictive intelligence</p>
        </div>
        <button onClick={handleExport} disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 text-sm font-medium disabled:opacity-50">
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      <div className="card p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <input type="text" placeholder="Search topics..." value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
            className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500" />
          <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value, page: 1 })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            {CATEGORIES.map(c => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>)}
          </select>
          <div className="flex gap-1">
            {STAGES.map(s => (
              <button key={s} onClick={() => setFilters({ ...filters, stage: s, page: 1 })}
                className={clsx('px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                  filters.stage === s ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>
                {s === 'All' ? 'All Stages' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-3 py-3 w-10"></th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Topic</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Stage</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Trend</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Score</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Competition</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Sources</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">Loading trends...</td></tr>
            ) : topics.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">No topics found</td></tr>
            ) : topics.map((topic: any) => (
              <tr key={topic.id} onClick={() => navigate(`/topics/${topic.id}`)}
                className="hover:bg-brand-50/50 cursor-pointer transition-colors">
                <td className="px-3 py-3 text-center">
                  <WatchlistButton topicId={topic.id} watchlistIds={watchlistIds}
                    onAdd={(id) => addMutation.mutate(id)} onRemove={(id) => removeMutation.mutate(id)} />
                </td>
                <td className="px-4 py-3"><span className="font-medium text-gray-900">{topic.name}</span></td>
                <td className="px-4 py-3"><StageBadge stage={topic.stage} /></td>
                <td className="px-4 py-3 text-sm text-gray-600">{topic.primary_category || '—'}</td>
                <td className="px-4 py-3 flex justify-center"><MiniSparkline data={topic.sparkline || []} /></td>
                <td className="px-4 py-3 text-center"><ScoreBadge score={topic.opportunity_score} /></td>
                <td className="px-4 py-3 text-center"><ScoreBadge score={topic.competition_index} /></td>
                <td className="px-4 py-3 text-center">
                  <span className="text-xs text-gray-500">{topic.sources_active?.length || 0} sources</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {pagination.total_pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <span className="text-sm text-gray-600">
              Showing {(pagination.page - 1) * pagination.page_size + 1}–{Math.min(pagination.page * pagination.page_size, pagination.total)} of {pagination.total}
            </span>
            <div className="flex gap-2">
              <button onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                disabled={filters.page <= 1} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                disabled={filters.page >= pagination.total_pages} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
