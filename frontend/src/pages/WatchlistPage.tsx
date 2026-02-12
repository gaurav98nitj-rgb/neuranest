import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWatchlist, useRemoveFromWatchlist } from '../hooks/useData'
import { Trash2, Bell, BellPlus, Eye, Bookmark, TrendingUp, ArrowRight } from 'lucide-react'
import clsx from 'clsx'

const STAGE_STYLES: Record<string, string> = {
  emerging: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
  exploding: 'bg-orange-500/15 text-orange-400 border border-orange-500/20',
  peaking: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20',
  declining: 'bg-red-500/15 text-red-400 border border-red-500/20',
  unknown: 'bg-brand-500/10 text-brand-400 border border-brand-500/20',
}

const STAGE_BAR: Record<string, string> = {
  emerging: 'bg-emerald-400', exploding: 'bg-orange-400', peaking: 'bg-yellow-400', declining: 'bg-red-400',
}

function ScoreRing({ score, label, size = 48 }: { score: number | null; label: string; size?: number }) {
  if (score === null) return null
  const pct = Math.min(score, 100) / 100
  const r = (size - 6) / 2
  const circ = 2 * Math.PI * r
  const color = score >= 70 ? '#10B981' : score >= 40 ? '#EAB308' : '#EF4444'
  return (
    <div className="flex flex-col items-center gap-0.5">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1E5570" strokeWidth={4} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={4}
          strokeDasharray={`${circ * pct} ${circ * (1 - pct)}`} strokeLinecap="round" />
      </svg>
      <span className="text-[10px] text-brand-400/40 uppercase tracking-wide">{label}</span>
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">My Watchlist</h1>
          <p className="text-sm text-brand-300/50 mt-1">
            {watchlistCount} topic{watchlistCount !== 1 ? 's' : ''} tracked
            <span className="text-brand-400/20 mx-2">·</span>
            <span className="text-brand-400/40">Free plan: 5 slots</span>
          </p>
        </div>
        <button onClick={() => navigate('/explore')}
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-400 text-sm font-medium transition-colors">
          <TrendingUp className="h-4 w-4" /> Browse Topics
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-brand-400/40">Loading watchlist...</div>
      ) : !items?.length ? (
        <div className="card p-12 text-center">
          <Bookmark className="h-16 w-16 text-brand-400/20 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-brand-200 mb-2">Your watchlist is empty</h3>
          <p className="text-sm text-brand-400/40 mb-6">Add topics from the Explorer to track trends and get alerts.</p>
          <button onClick={() => navigate('/explore')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white rounded-lg hover:bg-brand-400 text-sm font-medium transition-colors">
            <TrendingUp className="h-4 w-4" /> Explore Topics
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item: any) => (
            <div key={item.id} className="card p-0 overflow-hidden group">
              <div className="flex items-center">
                <div className={clsx('w-1.5 self-stretch', STAGE_BAR[item.topic_stage] || 'bg-brand-600')} />
                <div className="flex-1 flex items-center gap-6 px-5 py-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-brand-100 truncate cursor-pointer hover:text-brand-300 transition-colors"
                      onClick={() => navigate(`/topics/${item.topic_id}`)}>
                      {item.topic_name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full capitalize',
                        STAGE_STYLES[item.topic_stage] || STAGE_STYLES.unknown)}>
                        {item.topic_stage}
                      </span>
                      <span className="text-xs text-brand-400/30">
                        Added {new Date(item.added_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <ScoreRing score={item.opportunity_score} label="Score" />
                  <div className="flex items-center gap-1">
                    <button onClick={() => navigate(`/topics/${item.topic_id}`)}
                      className="p-2 text-brand-400/30 hover:text-brand-300 hover:bg-surface-2 rounded-lg transition-colors" title="View details">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button onClick={() => navigate('/alerts')}
                      className="p-2 text-brand-400/30 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-colors" title="Set alert">
                      <BellPlus className="h-4 w-4" />
                    </button>
                    <button onClick={() => removeMutation.mutate(item.topic_id)}
                      className="p-2 text-brand-400/20 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Remove">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {items && items.length > 0 && items.length < 5 && (
        <div className="mt-6 p-4 bg-brand-500/10 border border-brand-500/20 rounded-lg flex items-center gap-3">
          <div className="text-brand-400 p-2 bg-surface-1 rounded-lg">
            <Bell className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-brand-200">Set up alerts for your watchlist topics</p>
            <p className="text-xs text-brand-400/50 mt-0.5">Get notified when trend stages change or opportunity scores spike.</p>
          </div>
          <button onClick={() => navigate('/alerts')}
            className="flex items-center gap-1 text-sm font-medium text-brand-400 hover:text-brand-300 transition-colors">
            Configure <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
