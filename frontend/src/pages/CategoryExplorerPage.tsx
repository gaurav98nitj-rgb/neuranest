import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTopics } from '../hooks/useData'
import { Grid3X3, ChevronRight, ArrowUpRight, ArrowLeft } from 'lucide-react'
import clsx from 'clsx'

const CATEGORY_META: Record<string, { emoji: string; accent: string; border: string }> = {
  'Health':       { emoji: '💊', accent: 'text-emerald-400', border: 'border-emerald-500/25 bg-emerald-500/5' },
  'Electronics':  { emoji: '⚡', accent: 'text-blue-400',    border: 'border-blue-500/25 bg-blue-500/5' },
  'Fitness':      { emoji: '🏋️', accent: 'text-orange-400',  border: 'border-orange-500/25 bg-orange-500/5' },
  'Kitchen':      { emoji: '🍳', accent: 'text-red-400',     border: 'border-red-500/25 bg-red-500/5' },
  'Beauty':       { emoji: '✨', accent: 'text-pink-400',    border: 'border-pink-500/25 bg-pink-500/5' },
  'Home':         { emoji: '🏡', accent: 'text-amber-400',   border: 'border-amber-500/25 bg-amber-500/5' },
  'Baby':         { emoji: '👶', accent: 'text-sky-400',     border: 'border-sky-500/25 bg-sky-500/5' },
  'Pet':          { emoji: '🐾', accent: 'text-yellow-400',  border: 'border-yellow-500/25 bg-yellow-500/5' },
  'Outdoor':      { emoji: '🏕️', accent: 'text-green-400',   border: 'border-green-500/25 bg-green-500/5' },
  'Office':       { emoji: '💼', accent: 'text-indigo-400',  border: 'border-indigo-500/25 bg-indigo-500/5' },
}
const DEFAULT_META = { emoji: '📦', accent: 'text-brand-300', border: 'border-brand-500/25 bg-brand-500/5' }

const STAGE_STYLES: Record<string, string> = {
  exploding: 'bg-orange-500/15 text-orange-400',
  emerging: 'bg-emerald-500/15 text-emerald-400',
  peaking: 'bg-yellow-500/15 text-yellow-400',
  declining: 'bg-red-500/15 text-red-400',
  unknown: 'bg-brand-500/10 text-brand-400',
}

const STAGE_BAR: Record<string, string> = {
  exploding: 'bg-orange-400', emerging: 'bg-emerald-400', peaking: 'bg-yellow-400', declining: 'bg-red-400', unknown: 'bg-brand-600',
}

interface TopicItem {
  id: string; name: string; slug: string; stage: string;
  primary_category: string; opportunity_score: number | null;
  competition_index: number | null; sparkline: number[] | null;
}

export default function CategoryExplorerPage() {
  const navigate = useNavigate()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const { data: topicsData, isLoading } = useTopics({ page_size: 200 })
  const allTopics: TopicItem[] = topicsData?.data || []

  const categories = useMemo(() => {
    const catMap: Record<string, TopicItem[]> = {}
    for (const t of allTopics) {
      const cat = t.primary_category || 'Uncategorized'
      if (!catMap[cat]) catMap[cat] = []
      catMap[cat].push(t)
    }
    return Object.entries(catMap).map(([name, topics]) => {
      const scores = topics.map(t => t.opportunity_score).filter((s): s is number => s !== null)
      const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
      const stages = topics.reduce((acc, t) => { acc[t.stage] = (acc[t.stage] || 0) + 1; return acc }, {} as Record<string, number>)
      const topTopics = [...topics].sort((a, b) => (b.opportunity_score || 0) - (a.opportunity_score || 0)).slice(0, 3)
      const explodingCount = stages['exploding'] || 0
      const emergingCount = stages['emerging'] || 0
      return { name, count: topics.length, avgScore, stages, topTopics, explodingCount, emergingCount, hotCount: explodingCount + emergingCount, meta: CATEGORY_META[name] || DEFAULT_META }
    }).sort((a, b) => b.hotCount - a.hotCount || b.avgScore - a.avgScore)
  }, [allTopics])

  const selectedTopics = useMemo(() => {
    if (!selectedCategory) return []
    return allTopics.filter(t => t.primary_category === selectedCategory).sort((a, b) => (b.opportunity_score || 0) - (a.opportunity_score || 0))
  }, [allTopics, selectedCategory])

  const totalExploding = allTopics.filter(t => t.stage === 'exploding').length
  const totalEmerging = allTopics.filter(t => t.stage === 'emerging').length

  if (isLoading) return <div className="p-6 text-brand-400/40">Loading categories...</div>

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Grid3X3 className="h-6 w-6 text-brand-400" />
            Category Explorer
          </h1>
          <p className="text-sm text-brand-300/50 mt-1">
            {categories.length} categories · {allTopics.length} topics · {totalExploding} exploding · {totalEmerging} emerging
          </p>
        </div>
      </div>

      {selectedCategory && (
        <button onClick={() => setSelectedCategory(null)}
          className="flex items-center gap-1.5 text-sm text-brand-400 hover:text-brand-300 font-medium mb-4 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to all categories
        </button>
      )}

      {!selectedCategory ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map(cat => (
            <div key={cat.name} onClick={() => setSelectedCategory(cat.name)}
              className={clsx('group rounded-xl border p-5 cursor-pointer transition-all duration-200 hover:-translate-y-0.5', cat.meta.border, 'hover:shadow-lg hover:shadow-black/20')}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{cat.meta.emoji}</span>
                  <div>
                    <h3 className={clsx('font-bold text-base', cat.meta.accent)}>{cat.name}</h3>
                    <p className="text-xs text-brand-400/40">{cat.count} topics</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-brand-400/20 group-hover:text-brand-400/50 transition-colors" />
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 text-center p-2 bg-surface/60 rounded-lg">
                  <p className="text-lg font-bold text-brand-200">{cat.avgScore.toFixed(1)}</p>
                  <p className="text-[10px] text-brand-400/40 uppercase">Avg Score</p>
                </div>
                {cat.explodingCount > 0 && (
                  <div className="flex-1 text-center p-2 bg-surface/60 rounded-lg">
                    <p className="text-lg font-bold text-orange-400">{cat.explodingCount}</p>
                    <p className="text-[10px] text-brand-400/40 uppercase">Exploding</p>
                  </div>
                )}
                <div className="flex-1 text-center p-2 bg-surface/60 rounded-lg">
                  <p className="text-lg font-bold text-emerald-400">{cat.emergingCount}</p>
                  <p className="text-[10px] text-brand-400/40 uppercase">Emerging</p>
                </div>
              </div>

              <div className="h-1.5 rounded-full overflow-hidden flex bg-surface/60 mb-4">
                {['exploding', 'emerging', 'peaking', 'declining', 'unknown'].map(stage => {
                  const count = cat.stages[stage] || 0
                  if (count === 0) return null
                  return <div key={stage} className={STAGE_BAR[stage]} style={{ width: `${(count / cat.count) * 100}%` }} title={`${stage}: ${count}`} />
                })}
              </div>

              <div className="space-y-2">
                {cat.topTopics.map((t, i) => (
                  <div key={t.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-[10px] text-brand-400/30 w-4 text-right">{i + 1}.</span>
                      <span className="text-xs font-medium text-brand-200 truncate">{t.name}</span>
                      <span className={clsx('text-[9px] px-1.5 py-0.5 rounded-full font-medium capitalize flex-shrink-0', STAGE_STYLES[t.stage] || STAGE_STYLES.unknown)}>
                        {t.stage}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-brand-300 ml-2 tabular-nums">{t.opportunity_score?.toFixed(1) || '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div>
          {(() => {
            const cat = categories.find(c => c.name === selectedCategory)
            if (!cat) return null
            return (
              <div className={clsx('rounded-xl border p-6 mb-6', cat.meta.border)}>
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-4xl">{cat.meta.emoji}</span>
                  <div>
                    <h2 className={clsx('text-2xl font-bold', cat.meta.accent)}>{selectedCategory}</h2>
                    <p className="text-sm text-brand-300/50">{cat.count} topics · Avg score: {cat.avgScore.toFixed(1)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {['exploding', 'emerging', 'peaking', 'declining', 'unknown'].map(stage => {
                    const count = cat.stages[stage] || 0
                    if (count === 0) return null
                    return <span key={stage} className={clsx('text-xs px-2.5 py-1 rounded-full font-medium capitalize', STAGE_STYLES[stage])}>{stage}: {count}</span>
                  })}
                </div>
              </div>
            )
          })()}

          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-line">
                  <th className="text-left text-xs text-brand-300/50 font-medium uppercase tracking-wider p-4 w-8">#</th>
                  <th className="text-left text-xs text-brand-300/50 font-medium uppercase tracking-wider p-4">Topic</th>
                  <th className="text-left text-xs text-brand-300/50 font-medium uppercase tracking-wider p-4">Stage</th>
                  <th className="text-left text-xs text-brand-300/50 font-medium uppercase tracking-wider p-4">Sparkline</th>
                  <th className="text-right text-xs text-brand-300/50 font-medium uppercase tracking-wider p-4">Opportunity</th>
                  <th className="text-right text-xs text-brand-300/50 font-medium uppercase tracking-wider p-4">Competition</th>
                  <th className="p-4 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {selectedTopics.map((t, i) => (
                  <tr key={t.id} onClick={() => navigate(`/topics/${t.id}`)}
                    className="cursor-pointer transition-colors hover:bg-surface-2/50">
                    <td className="p-4 text-xs text-brand-400/40 font-medium">{i + 1}</td>
                    <td className="p-4"><p className="text-sm font-semibold text-brand-100">{t.name}</p></td>
                    <td className="p-4">
                      <span className={clsx('text-xs px-2.5 py-1 rounded-full font-medium capitalize', STAGE_STYLES[t.stage] || STAGE_STYLES.unknown)}>{t.stage}</span>
                    </td>
                    <td className="p-4">{t.sparkline && t.sparkline.length > 1 && <MiniSparkline data={t.sparkline} />}</td>
                    <td className="p-4 text-right">
                      <span className={clsx('text-sm font-bold tabular-nums',
                        (t.opportunity_score || 0) >= 70 ? 'text-emerald-400' : (t.opportunity_score || 0) >= 40 ? 'text-yellow-400' : 'text-red-400')}>
                        {t.opportunity_score?.toFixed(1) || '—'}
                      </span>
                    </td>
                    <td className="p-4 text-right"><span className="text-sm text-brand-300/50 tabular-nums">{t.competition_index?.toFixed(1) || '—'}</span></td>
                    <td className="p-4"><ArrowUpRight className="h-4 w-4 text-brand-400/20" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {selectedTopics.length === 0 && <div className="p-12 text-center text-brand-400/40 text-sm">No topics found in this category.</div>}
          </div>
        </div>
      )}
    </div>
  )
}

function MiniSparkline({ data }: { data: number[] }) {
  const w = 64, h = 20
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`).join(' ')
  const color = data[data.length - 1] >= data[0] ? '#10B981' : '#EF4444'
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
