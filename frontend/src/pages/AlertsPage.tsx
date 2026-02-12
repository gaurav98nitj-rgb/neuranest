import { useState } from 'react'
import { useAlerts, useCreateAlert, useDeleteAlert, useAlertEvents, useTopics } from '../hooks/useData'
import { Bell, Plus, Trash2, X, ChevronDown, ChevronRight, Zap, TrendingUp, DollarSign, Users, Clock, AlertTriangle } from 'lucide-react'
import clsx from 'clsx'

const ALERT_TYPES = [
  { value: 'stage_change', label: 'Stage Change', desc: 'Notify when a topic changes trend stage', icon: TrendingUp, color: 'text-green-600 bg-green-50' },
  { value: 'score_threshold', label: 'Score Threshold', desc: 'Notify when opportunity score crosses a value', icon: Zap, color: 'text-amber-600 bg-amber-50' },
  { value: 'new_competitor', label: 'New Competitor', desc: 'Notify when new brands enter the space', icon: Users, color: 'text-blue-600 bg-blue-50' },
  { value: 'price_drop', label: 'Price Drop', desc: 'Notify when median market price drops', icon: DollarSign, color: 'text-purple-600 bg-purple-50' },
]

function CreateAlertModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [step, setStep] = useState(1)
  const [alertType, setAlertType] = useState('')
  const [topicId, setTopicId] = useState('')
  const [threshold, setThreshold] = useState(70)
  const [direction, setDirection] = useState('above')
  const [topicSearch, setTopicSearch] = useState('')

  const { data: topicsData } = useTopics({ page_size: 100, sort: '-opportunity_score' })
  const topics = topicsData?.data || []
  const filteredTopics = topics.filter((t: any) =>
    t.name.toLowerCase().includes(topicSearch.toLowerCase())
  )

  const createMutation = useCreateAlert()

  const handleCreate = async () => {
    const config: Record<string, any> = {}
    if (alertType === 'score_threshold') {
      config.threshold = threshold
      config.direction = direction
      config.score_type = 'opportunity'
    } else if (alertType === 'stage_change') {
      config.notify_on = ['emerging', 'exploding']
    } else if (alertType === 'price_drop') {
      config.pct_threshold = 10
    } else if (alertType === 'new_competitor') {
      config.min_new_brands = 1
    }

    createMutation.mutate(
      { topic_id: topicId || null, alert_type: alertType, config_json: config },
      { onSuccess: () => { onCreated(); onClose() } }
    )
  }

  const selectedType = ALERT_TYPES.find(t => t.value === alertType)
  const selectedTopic = topics.find((t: any) => t.id === topicId)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Create Alert</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Step 1: Alert Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Alert Type</label>
            <div className="grid grid-cols-2 gap-2">
              {ALERT_TYPES.map(type => {
                const Icon = type.icon
                return (
                  <button key={type.value} onClick={() => setAlertType(type.value)}
                    className={clsx('flex items-start gap-3 p-3 rounded-lg border-2 text-left transition-all',
                      alertType === type.value
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-gray-200 hover:border-gray-300')}>
                    <div className={clsx('p-1.5 rounded-lg', type.color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{type.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{type.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Step 2: Topic Selection */}
          {alertType && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Topic <span className="text-gray-400 font-normal">(optional — leave blank for all topics)</span>
              </label>
              <input type="text" placeholder="Search topics..." value={topicSearch}
                onChange={(e) => setTopicSearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 mb-2" />
              <div className="max-h-36 overflow-y-auto border border-gray-200 rounded-lg divide-y">
                <button onClick={() => setTopicId('')}
                  className={clsx('w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors',
                    !topicId && 'bg-brand-50 font-medium text-brand-700')}>
                  All Topics (global alert)
                </button>
                {filteredTopics.map((t: any) => (
                  <button key={t.id} onClick={() => setTopicId(t.id)}
                    className={clsx('w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center justify-between',
                      topicId === t.id && 'bg-brand-50 font-medium text-brand-700')}>
                    <span>{t.name}</span>
                    <span className={clsx('text-xs px-1.5 py-0.5 rounded-full capitalize',
                      t.stage === 'emerging' && 'bg-green-100 text-green-700',
                      t.stage === 'exploding' && 'bg-orange-100 text-orange-700',
                      t.stage === 'peaking' && 'bg-yellow-100 text-yellow-700',
                      t.stage === 'declining' && 'bg-red-100 text-red-700',
                    )}>{t.stage}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Config */}
          {alertType === 'score_threshold' && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Threshold Configuration</label>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">Notify when score is</span>
                <select value={direction} onChange={(e) => setDirection(e.target.value)}
                  className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm">
                  <option value="above">above</option>
                  <option value="below">below</option>
                </select>
                <input type="number" min={0} max={100} value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-center" />
              </div>
              <input type="range" min={0} max={100} value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full accent-brand-600" />
              <div className="flex justify-between text-xs text-gray-400">
                <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
          <button onClick={handleCreate} disabled={!alertType || createMutation.isPending}
            className="px-5 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50">
            {createMutation.isPending ? 'Creating...' : 'Create Alert'}
          </button>
        </div>
      </div>
    </div>
  )
}

function AlertCard({ alert, onDelete, onToggleEvents }: {
  alert: any; onDelete: (id: string) => void; onToggleEvents: (id: string) => void
}) {
  const typeInfo = ALERT_TYPES.find(t => t.value === alert.alert_type) || ALERT_TYPES[0]
  const Icon = typeInfo.icon

  const configSummary = () => {
    const c = alert.config_json || {}
    if (alert.alert_type === 'score_threshold') return `Score ${c.direction || 'above'} ${c.threshold || 70}`
    if (alert.alert_type === 'stage_change') return `Stages: ${(c.notify_on || ['emerging', 'exploding']).join(', ')}`
    if (alert.alert_type === 'price_drop') return `Price drop > ${c.pct_threshold || 10}%`
    if (alert.alert_type === 'new_competitor') return `${c.min_new_brands || 1}+ new brands`
    return ''
  }

  return (
    <div className="card p-0 overflow-hidden">
      <div className="flex items-center">
        <div className={clsx('p-4', typeInfo.color)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-gray-900">{typeInfo.label}</span>
            <span className={clsx('text-xs px-1.5 py-0.5 rounded-full',
              alert.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
              {alert.is_active ? 'Active' : 'Paused'}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{configSummary()}</p>
          {alert.topic_name && (
            <p className="text-xs text-brand-600 mt-0.5">Topic: {alert.topic_name}</p>
          )}
        </div>
        <div className="flex items-center gap-1 pr-4">
          <button onClick={() => onToggleEvents(alert.id)}
            className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="View events">
            <Clock className="h-4 w-4" />
          </button>
          <button onClick={() => onDelete(alert.id)}
            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete alert">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function EventTimeline({ alertId }: { alertId: string }) {
  const { data: events, isLoading } = useAlertEvents(alertId)

  if (isLoading) return <div className="p-4 text-sm text-gray-400">Loading events...</div>
  if (!events?.length) return (
    <div className="p-4 text-center">
      <p className="text-sm text-gray-400">No events triggered yet.</p>
      <p className="text-xs text-gray-300 mt-1">Events will appear here when alert conditions are met.</p>
    </div>
  )

  return (
    <div className="p-4 space-y-2">
      {events.map((e: any) => (
        <div key={e.id} className="flex items-start gap-3 text-sm">
          <div className={clsx('w-2 h-2 mt-1.5 rounded-full flex-shrink-0',
            e.delivered ? 'bg-green-400' : 'bg-amber-400')} />
          <div className="flex-1 min-w-0">
            <p className="text-gray-700">{e.payload_json?.message || 'Alert triggered'}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {new Date(e.triggered_at).toLocaleString()}
              {e.delivered && <span className="text-green-600 ml-2">✓ Delivered</span>}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function AlertsPage() {
  const [showCreate, setShowCreate] = useState(false)
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null)

  const { data: alerts, isLoading, refetch } = useAlerts()
  const deleteMutation = useDeleteAlert()

  const handleDelete = (id: string) => {
    if (confirm('Delete this alert?')) {
      deleteMutation.mutate(id)
    }
  }

  const activeCount = (alerts || []).filter((a: any) => a.is_active).length

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alerts</h1>
          <p className="text-sm text-gray-500 mt-1">
            {activeCount} active alert{activeCount !== 1 ? 's' : ''}
            <span className="text-gray-300 mx-2">·</span>
            <span className="text-gray-400">Pro plan: 20 max</span>
          </p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 text-sm font-medium">
          <Plus className="h-4 w-4" /> New Alert
        </button>
      </div>

      {/* Alert list */}
      {isLoading ? (
        <div className="text-center py-16 text-gray-400">Loading alerts...</div>
      ) : !alerts?.length ? (
        <div className="card p-12 text-center">
          <Bell className="h-16 w-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No alerts configured</h3>
          <p className="text-sm text-gray-400 mb-6">Create alerts to get notified when trends change, scores spike, or new competitors appear.</p>
          <button onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 text-sm font-medium">
            <Plus className="h-4 w-4" /> Create Your First Alert
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert: any) => (
            <div key={alert.id}>
              <AlertCard alert={alert} onDelete={handleDelete}
                onToggleEvents={(id) => setExpandedAlert(expandedAlert === id ? null : id)} />
              {expandedAlert === alert.id && (
                <div className="ml-4 mt-1 border border-gray-100 rounded-lg bg-gray-50">
                  <EventTimeline alertId={alert.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* How it works */}
      {alerts && alerts.length > 0 && (
        <div className="mt-8 p-5 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" /> How Alerts Work
          </h3>
          <div className="grid grid-cols-3 gap-4 text-xs text-gray-500">
            <div>
              <p className="font-medium text-gray-700 mb-1">Evaluation</p>
              <p>Alerts are evaluated hourly against the latest scores and stage classifications.</p>
            </div>
            <div>
              <p className="font-medium text-gray-700 mb-1">Delivery</p>
              <p>Triggered alerts are delivered via email (MVP) and shown in-app on this page.</p>
            </div>
            <div>
              <p className="font-medium text-gray-700 mb-1">Limits</p>
              <p>Pro plan supports up to 20 active alerts. Upgrade for more capacity.</p>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <CreateAlertModal onClose={() => setShowCreate(false)} onCreated={() => refetch()} />
      )}
    </div>
  )
}
