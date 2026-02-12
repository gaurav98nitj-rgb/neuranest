import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './lib/store'
import Layout from './components/Layout'
import DashboardPage from './pages/DashboardPage'
import ExplorerPage from './pages/ExplorerPage'
import TopicDetailPage from './pages/TopicDetailPage'
import WatchlistPage from './pages/WatchlistPage'
import AlertsPage from './pages/AlertsPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuth = useAuthStore((s) => s.isAuthenticated)
  if (!isAuth) return <Navigate to="/auth/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/signup" element={<SignupPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="explore" element={<ExplorerPage />} />
        <Route path="topics/:id" element={<TopicDetailPage />} />
        <Route path="watchlist" element={<WatchlistPage />} />
        <Route path="alerts" element={<AlertsPage />} />
      </Route>
    </Routes>
  )
}
