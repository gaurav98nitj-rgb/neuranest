import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../lib/store'
import { Eye, Bell, Search, LogOut, BarChart3, LayoutDashboard, Grid3X3, TrendingUp } from 'lucide-react'
import clsx from 'clsx'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/explore', label: 'Explorer', icon: Search },
  { to: '/categories', label: 'Categories', icon: Grid3X3 },
  { to: '/watchlist', label: 'Watchlist', icon: Eye },
  { to: '/alerts', label: 'Alerts', icon: Bell },
]

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="flex h-screen bg-surface">
      <aside className="w-64 bg-surface-1 border-r border-line flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white" style={{ fontFamily: "'Instrument Sans', 'DM Sans', sans-serif", letterSpacing: '-0.02em' }}>NeuraNest</h1>
            <p className="text-[10px] text-brand-400 uppercase tracking-wider">Trend Intelligence</p>
          </div>
        </div>
        <nav className="flex-1 px-3 mt-2 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-brand-500/20 text-brand-300 border border-brand-500/25'
                    : 'text-brand-200/60 hover:bg-surface-2 hover:text-brand-200 border border-transparent'
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-line">
          <div className="flex items-center justify-between">
            <div className="text-sm min-w-0">
              <p className="font-medium text-brand-200 truncate">{user?.email || 'User'}</p>
              <p className="text-brand-400/60 text-xs capitalize">{user?.role || 'viewer'}</p>
            </div>
            <button onClick={handleLogout} className="text-brand-400/60 hover:text-brand-300 p-1.5 rounded-lg hover:bg-surface-2 transition-colors">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto bg-surface">
        <Outlet />
      </main>
    </div>
  )
}
