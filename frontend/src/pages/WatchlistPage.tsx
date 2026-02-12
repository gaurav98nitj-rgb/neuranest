import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWatchlist, useRemoveFromWatchlist, useTopics } from '../hooks/useData'
import { Trash2, Bell, BellPlus, Eye, Bookmark, TrendingUp, ArrowRight } from 'lucide-react'
import clsx from 'clsx'

const stageStyles: Record<string, string> = {
  emerging: 'bg-green-100 text-green-800',
  exploding: 'bg-orange-100 text-orange-800',
  peaking: 'bg-yellow-100 text-yellow-800',
  declining: 'bg-red-100 text-red-800',
  unknown: 'bg-gray-100 text-gray-600',
}

function ScoreRing({ score, label, size = 48 }: { score: number | null; label: string; size?: number }) {
  if (score === null) return null
  const pct = Math.min(score, 100) / 100
  const r = (size - 6) / 2
  const circ = 2 * Math.PI * r
  const color = score >= 70 ? '#22c55e' : score >= 40 ? '#eab308' : '#ef4444'
  return (
    <div className="flex flex-col items-center gap-0.5">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f3f4f6" strokeWidth={4} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={4}
          strokeDasharray={`${circ * pct} ${circ * (1 - pct)}`} strokeLinecap="round" />
      </svg>
      <span className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</span>
      <span className="text-xs font-bold" style={{ color }}>{score.toFixed(0)}</span>
    </div>
  )
}

export default function WatchlistPage() {
  const navigate = useNavigate()
  const { data: items, isLoading } = useWatchlist()
  const removeMutation = useRemoveFromWatchlist()

  const watchlistCount = items?.length || 0

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Watchlist</h1>
          <p className="text-sm text-gray-500 mt-1">
            {watchlistCount} topic{watchlistCount !== 1 ? 's' : ''} tracked
            <span className="text-gray-300 mx-2">·</span>
            <span className="text-gray-400">Free plan: 5 slots</span>
          </p>
        </div>
        <button onClick={() => navigate('/explore')}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 text-sm font-medium">
          <TrendingUp className="h-4 w-4" /> Browse Topics
        </button>
      </div>

      {/* Watchlist cards */}
      {isLoading ? (
        <div className="text-center py-16 text-gray-400">Loading watchlist...</div>
      ) : !items?.length ? (
        <div className="card p-12 text-center">
          <Bookmark className="h-16 w-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">Your watchlist is empty</h3>
          <p className="text-sm text-gray-400 mb-6">Add topics from the Explorer to track trends and get alerts.</p>
          <button onClick={() => navigate('/explore')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 text-sm font-medium">
            <TrendingUp className="h-4 w-4" /> Explore Topics
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item: any) => (
            <div key={item.id}
              className="card p-0 overflow-hidden hover:shadow-md transition-shadow group">
              <div className="flex items-center">
                {/* Stage indicator bar */}
                <div className={clsx('w-1.5 self-stretch',
                  item.topic_stage === 'emerging' && 'bg-green-400',
                  item.topic_stage === 'exploding' && 'bg-orange-400',
                  item.topic_stage === 'peaking' && 'bg-yellow-400',
                  item.topic_stage === 'declining' && 'bg-red-400',
                  !['emerging', 'exploding', 'peaking', 'declining'].includes(item.topic_stage) && 'bg-gray-300',
                )} />

                {/* Content */}
                <div className="flex-1 flex items-center gap-6 px-5 py-4">
                  {/* Name & Stage */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate cursor-pointer hover:text-brand-600"
                      onClick={() => navigate(`/topics/${item.topic_id}`)}>
                      {item.topic_name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full capitalize',
                        stageStyles[item.topic_stage] || stageStyles.unknown)}>
                        {item.topic_stage}
                      </span>
                      <span className="text-xs text-gray-400">
                        Added {new Date(item.added_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Score */}
                  <ScoreRing score={item.opportunity_score} label="Score" />

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button onClick={() => navigate(`/topics/${item.topic_id}`)}
                      className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                      title="View details">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button onClick={() => navigate('/alerts')}
                      className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                      title="Set alert">
                      <BellPlus className="h-4 w-4" />
                    </button>
                    <button onClick={() => removeMutation.mutate(item.topic_id)}
                      className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove from watchlist">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick tip */}
      {items && items.length > 0 && items.length < 5 && (
        <div className="mt-6 p-4 bg-brand-50 border border-brand-100 rounded-lg flex items-center gap-3">
          <div className="text-brand-600 p-2 bg-white rounded-lg shadow-sm">
            <Bell className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-brand-800">Set up alerts for your watchlist topics</p>
            <p className="text-xs text-brand-600 mt-0.5">Get notified when trend stages change or opportunity scores spike.</p>
          </div>
          <button onClick={() => navigate('/alerts')}
            className="flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800">
            Configure <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
