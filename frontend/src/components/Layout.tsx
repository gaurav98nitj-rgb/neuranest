import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../lib/store'
import { Eye, Bell, Search, LogOut, BarChart3, LayoutDashboard } from 'lucide-react'
import clsx from 'clsx'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/explore', label: 'Explorer', icon: Search },
  { to: '/watchlist', label: 'Watchlist', icon: Eye },
  { to: '/alerts', label: 'Alerts', icon: Bell },
]

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/auth/login')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-brand-700 text-white flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-brand-200" />
          <div>
            <h1 className="text-lg font-bold">NeuraNest</h1>
            <p className="text-xs text-brand-300">Gen-Next Intelligence</p>
          </div>
        </div>
        <nav className="flex-1 px-3 mt-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-600 text-white'
                    : 'text-brand-200 hover:bg-brand-600/50 hover:text-white'
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-brand-600">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <p className="font-medium truncate">{user?.email || 'User'}</p>
              <p className="text-brand-300 text-xs capitalize">{user?.role || 'viewer'}</p>
            </div>
            <button onClick={handleLogout} className="text-brand-300 hover:text-white p-1">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
