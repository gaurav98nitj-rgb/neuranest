import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../lib/store'
import { authApi } from '../lib/api'
import { TrendingUp } from 'lucide-react'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [orgName, setOrgName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const login = useAuthStore(s => s.login)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const { data } = await authApi.signup({ email, password, org_name: orgName || undefined })
      login(data.access_token, data.refresh_token, { id: '', email, role: 'admin' })
      navigate('/explore')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Signup failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-brand-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(46,134,193,0.06) 1px, transparent 0)`,
          backgroundSize: '48px 48px',
        }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-500/8 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-white" style={{ fontFamily: "'Instrument Sans', 'DM Sans', sans-serif", letterSpacing: '-0.02em' }}>NeuraNest</span>
        </div>

        <div className="bg-surface-1 border border-line rounded-2xl p-8">
          <h2 className="text-xl font-bold text-white mb-1 text-center">Start your free trial</h2>
          <p className="text-sm text-brand-400/50 mb-6 text-center">7 days full access · No credit card required</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg">{error}</div>}
            <div>
              <label className="block text-xs text-brand-300/50 uppercase tracking-wider mb-1.5 font-medium">Organization</label>
              <input type="text" placeholder="Company name (optional)" value={orgName} onChange={e => setOrgName(e.target.value)}
                className="w-full px-4 py-3 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-brand-300/50 uppercase tracking-wider mb-1.5 font-medium">Email</label>
              <input type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full px-4 py-3 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-brand-300/50 uppercase tracking-wider mb-1.5 font-medium">Password</label>
              <input type="password" placeholder="Min 8 characters" value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
                className="w-full px-4 py-3 text-sm" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-brand-500 text-white rounded-lg font-semibold hover:bg-brand-400 disabled:opacity-50 transition-colors text-sm">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-brand-400/40 mt-5">
            Already have an account? <Link to="/auth/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">Sign in</Link>
          </p>
        </div>

        <p className="text-center text-xs text-brand-400/20 mt-6">
          <Link to="/" className="hover:text-brand-400/40 transition-colors">← Back to home</Link>
        </p>
      </div>
    </div>
  )
}
