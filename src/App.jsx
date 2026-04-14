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

// Shows LandingPage first; "Masuk" button switches to LoginPage
function AuthGate() {
  const [showLogin, setShowLogin] = useState(false)
  if (showLogin) return <LoginPage />
  return <LandingPage onLogin={() => setShowLogin(true)} />
}

// Guard component — redirects to / if page is not accessible
function ProtectedRoute({ page, children }) {
  const { canAccessPage } = useAuth()
  if (!canAccessPage(page)) return <Navigate to="/" replace />
  return children
}

function AppInner() {
  const { sidebarOpen } = useTheme()
  const { user } = useAuth()

  if (!user) {
    return <AuthGate />
  }

  return (
    <div className="min-h-screen bg-dark-900 text-gray-200 flex">
      {/* Spacer that mirrors sidebar width on desktop */}
      <div className={`hidden md:block shrink-0 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-16'}`} />
      <Sidebar />
      <main className="flex-1 min-w-0 p-4 md:p-6 lg:p-8 overflow-y-auto">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/findings" element={<FindingsPage />} />
          <Route path="/findings/:id" element={<FindingDetailPage />} />
          <Route path="/archive" element={
            <ProtectedRoute page="archive"><ArchivePage /></ProtectedRoute>
          } />
          <Route path="/costs" element={
            <ProtectedRoute page="costs"><CostsPage /></ProtectedRoute>
          } />
          <Route path="/guidelines" element={<GuidelinesPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/users" element={
            <ProtectedRoute page="users"><UsersPage /></ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Toast />
    </div>
  )
}

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
