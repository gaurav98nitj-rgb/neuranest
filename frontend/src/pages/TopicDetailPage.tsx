import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTopic, useTimeseries, useForecast, useCompetition, useReviewsSummary, useGenNextSpec, useAddToWatchlist } from '../hooks/useData'
import { ArrowLeft, Eye, TrendingUp, Shield, MessageSquare, Lightbulb, Star } from 'lucide-react'
import { ComposedChart, AreaChart, Area, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid, Legend, ReferenceLine } from 'recharts'
import clsx from 'clsx'

const tabs = [
  { id: 'trend', label: 'Trend & Forecast', icon: TrendingUp },
  { id: 'competition', label: 'Competition', icon: Shield },
  { id: 'reviews', label: 'Review Intelligence', icon: MessageSquare },
  { id: 'gennext', label: 'Gen-Next Spec', icon: Lightbulb },
]

export default function TopicDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('trend')
  const { data: topic, isLoading } = useTopic(id!)
  const addToWatchlist = useAddToWatchlist()

  if (isLoading) return <div className="p-6 text-gray-400">Loading...</div>
  if (!topic) return <div className="p-6 text-red-500">Topic not found</div>

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-brand-600 mb-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{topic.name}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className={clsx('text-xs font-medium px-2.5 py-0.5 rounded-full capitalize',
              { 'bg-green-100 text-green-800': topic.stage === 'emerging',
                'bg-orange-100 text-orange-800': topic.stage === 'exploding',
                'bg-yellow-100 text-yellow-800': topic.stage === 'peaking',
                'bg-red-100 text-red-800': topic.stage === 'declining' }
            )}>{topic.stage}</span>
            {topic.primary_category && <span className="text-sm text-gray-500">{topic.primary_category}</span>}
          </div>
        </div>
        <button
          onClick={() => addToWatchlist.mutate(id!)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 text-sm"
        >
          <Eye className="h-4 w-4" /> Add to Watchlist
        </button>
      </div>

      {/* Score Cards */}
      {topic.latest_scores && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {Object.entries(topic.latest_scores).map(([type, data]: [string, any]) => (
            <div key={type} className="card p-4">
              <p className="text-xs text-gray-500 uppercase font-medium">{type.replace('_', ' ')}</p>
              <p className="text-2xl font-bold mt-1">{data.value?.toFixed(1) || '—'}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === tab.id
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            <tab.icon className="h-4 w-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'trend' && <TrendTab topicId={id!} />}
      {activeTab === 'competition' && <CompetitionTab topicId={id!} />}
      {activeTab === 'reviews' && <ReviewsTab topicId={id!} />}
      {activeTab === 'gennext' && <GenNextTab topicId={id!} />}
    </div>
  )
}

function TrendTab({ topicId }: { topicId: string }) {
  const { data: ts } = useTimeseries(topicId)
  const { data: forecast } = useForecast(topicId)

  // Aggregate timeseries by date (average across sources)
  const dateMap: Record<string, { sum: number; count: number; sources: Record<string, number> }> = {}
  for (const p of (ts?.data || [])) {
    const d = p.date
    if (!dateMap[d]) dateMap[d] = { sum: 0, count: 0, sources: {} }
    const val = p.normalized_value || p.raw_value || 0
    dateMap[d].sum += val
    dateMap[d].count += 1
    dateMap[d].sources[p.source] = val
  }

  // Build merged chart data with historical + forecast
  const historical = Object.entries(dateMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { sum, count, sources }]) => ({
      date,
      value: Math.round((sum / count) * 10) / 10,
      google: sources['google_trends'] || null,
      reddit: sources['reddit'] || null,
    }))

  const forecastData = (forecast?.forecasts || [])
    .filter((f: any) => f.yhat > 0)
    .sort((a: any, b: any) => a.forecast_date.localeCompare(b.forecast_date))
    .map((f: any) => ({
      date: f.forecast_date,
      yhat: Math.round(f.yhat * 10) / 10,
      yhat_lower: Math.round((f.yhat_lower || 0) * 10) / 10,
      yhat_upper: Math.round((f.yhat_upper || 0) * 10) / 10,
    }))

  // Connect forecast to last historical point
  const lastHistorical = historical[historical.length - 1]
  const chartData = [
    ...historical.map(h => ({ ...h, yhat: null as number | null, yhat_lower: null as number | null, yhat_upper: null as number | null })),
    ...(lastHistorical ? [{
      date: lastHistorical.date,
      value: lastHistorical.value,
      google: null as number | null,
      reddit: null as number | null,
      yhat: lastHistorical.value,
      yhat_lower: lastHistorical.value,
      yhat_upper: lastHistorical.value,
    }] : []),
    ...forecastData.map(f => ({
      date: f.date,
      value: null as number | null,
      google: null as number | null,
      reddit: null as number | null,
      yhat: f.yhat,
      yhat_lower: f.yhat_lower,
      yhat_upper: f.yhat_upper,
    })),
  ]

  const todayStr = new Date().toISOString().slice(0, 10)

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold mb-4">Search Interest Over Time</h3>
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 11 }} domain={[0, 'auto']} />
          <Tooltip />
          <Legend />
          <Area type="monotone" dataKey="value" name="Actual (avg)" stroke="#2E86C1" fill="#D6EAF8" strokeWidth={2} dot={false} connectNulls={false} />
          <Area type="monotone" dataKey="yhat_upper" name="Forecast CI" stroke="none" fill="#7FB3D8" fillOpacity={0.15} dot={false} connectNulls={false} />
          <Area type="monotone" dataKey="yhat_lower" stroke="none" fill="#FFFFFF" fillOpacity={1} dot={false} connectNulls={false} />
          <Line type="monotone" dataKey="yhat" name="Forecast" stroke="#2E86C1" strokeWidth={2} strokeDasharray="6 3" dot={false} connectNulls={false} />
          <ReferenceLine x={todayStr} stroke="#999" strokeDasharray="3 3" label={{ value: "Today", position: "top", fontSize: 11 }} />
        </ComposedChart>
      </ResponsiveContainer>
      {forecast && (
        <p className="text-xs text-gray-400 mt-2">
          Forecast: {forecast.model_version} | {forecastData.length} points | Generated: {new Date(forecast.generated_at).toLocaleDateString()}
        </p>
      )}
    </div>
  )
}

function CompetitionTab({ topicId }: { topicId: string }) {
  const { data: comp } = useCompetition(topicId)
  if (!comp) return <div className="text-gray-400">Loading competition data...</div>

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Listings', value: comp.listing_count },
          { label: 'Median Price', value: comp.median_price ? `$${comp.median_price}` : '—' },
          { label: 'Median Reviews', value: comp.median_reviews },
          { label: 'Avg Rating', value: comp.avg_rating ? `${comp.avg_rating} ★` : '—' },
        ].map(m => (
          <div key={m.label} className="card p-4">
            <p className="text-xs text-gray-500 uppercase">{m.label}</p>
            <p className="text-xl font-bold mt-1">{m.value ?? '—'}</p>
          </div>
        ))}
      </div>

      {/* Top ASINs */}
      {comp.top_asins?.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Top Competing Products</h3>
          <div className="grid grid-cols-2 gap-4">
            {comp.top_asins.map((a: any) => (
              <div key={a.asin} className="flex gap-3 p-3 border border-gray-100 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium line-clamp-2">{a.title || a.asin}</p>
                  <p className="text-xs text-gray-500 mt-1">{a.brand} · ${a.price} · {a.rating}★ · {a.review_count} reviews</p>
                </div>
                <span className="text-xs text-gray-400">#{a.rank}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ReviewsTab({ topicId }: { topicId: string }) {
  const { data: reviews } = useReviewsSummary(topicId)
  if (!reviews) return <div className="text-gray-400">Loading review insights...</div>

  return (
    <div className="space-y-6">
      <div className="text-sm text-gray-500">
        Analyzed {reviews.total_reviews_analyzed} reviews across {reviews.asins_covered} products
      </div>
      <div className="grid grid-cols-2 gap-6">
        {/* Pros */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-green-700 mb-4">✓ Top Pros</h3>
          {reviews.pros.map((p: any, i: number) => (
            <div key={i} className="mb-3 pb-3 border-b border-gray-100 last:border-0">
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm capitalize">{p.aspect.replace('_', ' ')}</span>
                <span className="text-xs text-gray-500">{p.mention_count} mentions</span>
              </div>
              {p.sample && <p className="text-xs text-gray-500 mt-1 italic">"{p.sample}"</p>}
            </div>
          ))}
        </div>

        {/* Cons */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-red-700 mb-4">✗ Top Cons</h3>
          {reviews.cons.map((c: any, i: number) => (
            <div key={i} className="mb-3 pb-3 border-b border-gray-100 last:border-0">
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm capitalize">{c.aspect.replace('_', ' ')}</span>
                <span className="text-xs text-gray-500">{c.mention_count} mentions</span>
              </div>
              {c.sample && <p className="text-xs text-gray-500 mt-1 italic">"{c.sample}"</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Pain Points */}
      {reviews.top_pain_points?.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">🔥 Top Pain Points</h3>
          {reviews.top_pain_points.map((pp: any, i: number) => (
            <div key={i} className="flex items-center gap-4 mb-3">
              <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full" style={{ width: `${pp.severity}%` }} />
              </div>
              <span className="text-sm font-medium capitalize flex-1">{pp.aspect.replace('_', ' ')}</span>
              <span className="text-xs text-gray-500">{pp.evidence}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function GenNextTab({ topicId }: { topicId: string }) {
  const { data: spec, isLoading, error } = useGenNextSpec(topicId)
  if (isLoading) return <div className="text-gray-400">Loading Gen-Next spec...</div>
  if (error) return <div className="card p-6 text-center text-gray-500">Gen-Next spec not available. Upgrade to Pro for full access.</div>
  if (!spec) return null

  return (
    <div className="space-y-6">
      <p className="text-xs text-gray-400">Version {spec.version} · Generated {new Date(spec.generated_at).toLocaleDateString()} · Model: {spec.model_used}</p>

      <div className="grid grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-red-700 mb-4">🔧 Must Fix</h3>
          {spec.must_fix.map((item: any, i: number) => (
            <div key={i} className="mb-3 pb-3 border-b border-gray-100 last:border-0">
              <div className="flex items-center gap-2">
                <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium',
                  item.severity === 'critical' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                )}>{item.severity}</span>
                <span className="text-sm font-medium">{item.issue}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{item.evidence}</p>
            </div>
          ))}
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-green-700 mb-4">✨ Must Add</h3>
          {spec.must_add.map((item: any, i: number) => (
            <div key={i} className="mb-3 pb-3 border-b border-gray-100 last:border-0">
              <div className="flex items-center gap-2">
                <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-medium">P{item.priority}</span>
                <span className="text-sm font-medium">{item.feature}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{item.demand_signal}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-purple-700 mb-4">💡 Differentiators</h3>
        <div className="grid grid-cols-2 gap-4">
          {spec.differentiators.map((d: any, i: number) => (
            <div key={i} className="p-4 bg-purple-50 rounded-lg">
              <p className="font-medium text-sm">{d.idea}</p>
              <p className="text-xs text-gray-600 mt-1">{d.rationale}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-brand-700 mb-4">🎯 Positioning</h3>
        <div className="grid grid-cols-2 gap-4">
          {spec.positioning.target_price && <div><p className="text-xs text-gray-500">Target Price</p><p className="text-lg font-bold">${spec.positioning.target_price}</p></div>}
          {spec.positioning.target_rating && <div><p className="text-xs text-gray-500">Target Rating</p><p className="text-lg font-bold">{spec.positioning.target_rating} ★</p></div>}
          {spec.positioning.tagline && <div className="col-span-2"><p className="text-xs text-gray-500">Tagline</p><p className="text-lg font-semibold italic">"{spec.positioning.tagline}"</p></div>}
          {spec.positioning.target_demographic && <div className="col-span-2"><p className="text-xs text-gray-500">Target Demographic</p><p className="text-sm">{spec.positioning.target_demographic}</p></div>}
        </div>
      </div>
    </div>
  )
}
