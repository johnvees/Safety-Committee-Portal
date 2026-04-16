import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { FindingsProvider } from './context/FindingsContext'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { NotifProvider } from './context/NotifContext'
import Sidebar from './components/Sidebar'
import Toast from './components/Toast'
import DashboardPage from './pages/DashboardPage'
import FindingsPage from './pages/FindingsPage'
import FindingDetailPage from './pages/FindingDetailPage'
import ArchivePage from './pages/ArchivePage'
import CostsPage from './pages/CostsPage'
import GuidelinesPage from './pages/GuidelinesPage'
import NotificationsPage from './pages/NotificationsPage'
import LoginPage from './pages/LoginPage'
import UsersPage from './pages/UsersPage'
import LandingPage from './pages/LandingPage'

/**
 * AuthGate — shown when no user is logged in.
 * Renders the public LandingPage first. When the user clicks "Sign In",
 * it swaps to the LoginPage without a full navigation, keeping it seamless.
 */
function AuthGate() {
  // false = show landing; true = show login form
  const [showLogin, setShowLogin] = useState(false)
  if (showLogin) return <LoginPage />
  return <LandingPage onLogin={() => setShowLogin(true)} />
}

/**
 * ProtectedRoute — wraps pages that only certain roles can access.
 * If the logged-in user's role doesn't include the target page,
 * they are silently redirected to the Dashboard (/).
 *
 * @param {string} page - The page key to check (e.g. 'archive', 'users')
 * @param {ReactNode} children - The page component to render if access is granted
 */
function ProtectedRoute({ page, children }) {
  const { canAccessPage } = useAuth()
  if (!canAccessPage(page)) return <Navigate to="/" replace />
  return children
}

/**
 * AppInner — the main shell once providers are set up.
 * Decides whether to show the auth flow or the full dashboard layout.
 * The sidebar spacer div pushes the <main> content right by the same amount
 * the fixed-position sidebar takes up, so content never slides under it.
 */
function AppInner() {
  const { sidebarOpen } = useTheme()
  const { user } = useAuth()

  // Not logged in → show landing / login screens
  if (!user) {
    return <AuthGate />
  }

  return (
    <div className="min-h-screen bg-dark-900 text-gray-200 flex">
      {/* Spacer that mirrors sidebar width on desktop so <main> doesn't hide behind the fixed sidebar */}
      <div className={`hidden md:block shrink-0 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-16'}`} />
      <Sidebar />
      <main className="flex-1 min-w-0 p-4 md:p-6 lg:p-8 overflow-y-auto">
        <Routes>
          {/* Public (authenticated) routes — all logged-in roles can access */}
          <Route path="/" element={<DashboardPage />} />
          <Route path="/findings" element={<FindingsPage />} />
          <Route path="/findings/:id" element={<FindingDetailPage />} />
          <Route path="/guidelines" element={<GuidelinesPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />

          {/* Role-restricted routes — redirect to / if not allowed */}
          <Route path="/archive" element={
            <ProtectedRoute page="archive"><ArchivePage /></ProtectedRoute>
          } />
          <Route path="/costs" element={
            <ProtectedRoute page="costs"><CostsPage /></ProtectedRoute>
          } />
          <Route path="/users" element={
            <ProtectedRoute page="users"><UsersPage /></ProtectedRoute>
          } />

          {/* Catch-all — redirect unknown paths to Dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Global toast notification (success / error / info pop-ups) */}
      <Toast />
    </div>
  )
}

/**
 * App — the root component.
 * Wraps everything in context providers in the correct order:
 * BrowserRouter → ThemeProvider → AuthProvider → FindingsProvider → NotifProvider
 *
 * Provider order matters: lower providers can consume higher ones.
 * e.g. FindingsProvider uses useAuth() so AuthProvider must be above it.
 */
export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <FindingsProvider>
            <NotifProvider>
              <AppInner />
            </NotifProvider>
          </FindingsProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
