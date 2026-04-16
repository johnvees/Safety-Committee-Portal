import { NavLink, useLocation } from 'react-router-dom'
import {
  AlertTriangle, LayoutDashboard, ClipboardList, Archive,
  Bell, BookOpen, DollarSign, X, Menu, ChevronLeft, ChevronRight, Sun, Moon, LogOut, Users
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useAuth, ROLE_LABELS } from '../context/AuthContext'
import { useNotif } from '../context/NotifContext'

/**
 * Sidebar — the main navigation rail on the left side of the dashboard.
 *
 * Behaviour:
 *   - Desktop: collapsible between a 64px wide icon rail and a full 256px panel.
 *   - Mobile: hidden off-screen, toggled by a floating button (top-left).
 *             Tapping the dark overlay closes it.
 *
 * Shows only the nav links the current user has access to (via canAccessPage).
 * The Notifications link shows a badge with the unread count.
 */
export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen, isDark, toggleTheme } = useTheme()
  const { user, logout, canAccessPage } = useAuth()
  const location = useLocation()

  // Total unread notifications — displayed as a badge on the Bell link
  const { unreadCount: unreadNotifs } = useNotif()

  // Full list of nav links. Each entry maps to one sidebar item.
  // 'page' matches the keys in PAGE_ACCESS (AuthContext) for access control.
  const allLinks = [
    { to: '/',              icon: LayoutDashboard, label: 'Dashboard',     badge: null,                page: 'dashboard'     },
    { to: '/findings',      icon: ClipboardList,   label: 'Findings',      badge: null,                page: 'findings'      },
    { to: '/archive',       icon: Archive,          label: 'Archive',       badge: null,                page: 'archive'       },
    { to: '/costs',         icon: DollarSign,       label: 'Costs',         badge: null,                page: 'costs'         },
    { to: '/guidelines',    icon: BookOpen,         label: 'Guideline',     badge: null,                page: 'guidelines'    },
    { to: '/notifications', icon: Bell,             label: 'Notifications', badge: unreadNotifs || null, page: 'notifications' },
    { to: '/users',         icon: Users,            label: 'Users',         badge: null,                page: 'users'         },
  ]

  // Filter to only links the current user's role can access
  const links = allLinks.filter(l => canAccessPage(l.page))

  // Role badge metadata (color, label) for the user footer in the sidebar
  const roleInfo = user ? (ROLE_LABELS[user.role] || ROLE_LABELS.viewer) : null

  // Derive 1–2 letter initials from the user's full name (e.g. "John Doe" → "JD")
  const initials = user ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : 'U'

  /** Toggle sidebar open/closed */
  const toggle = () => setSidebarOpen(o => !o)

  /** Close sidebar on mobile after the user navigates to a page */
  const closeMobile = () => { if (window.innerWidth < 768) setSidebarOpen(false) }

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={toggle}
        className="md:hidden fixed top-4 left-4 z-[60] bg-dark-800 border border-dark-700 rounded-xl p-3 text-gray-400 shadow-lg"
      >
        {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={toggle} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-screen z-50 bg-dark-800 border-r border-dark-700
        flex flex-col transition-all duration-300 overflow-hidden
        ${sidebarOpen ? 'w-64 translate-x-0' : 'md:w-16 -translate-x-full md:translate-x-0'}
      `}>

        {/* Header: Logo + collapse toggle */}
        <div className={`flex items-center border-b border-dark-700 shrink-0 min-h-[72px] ${sidebarOpen ? 'px-4 gap-3' : 'px-2 flex-col justify-center gap-1.5'}`}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 shrink-0">
            <AlertTriangle size={20} />
          </div>
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-extrabold text-gray-100 tracking-tight leading-tight">Findings</h1>
              <p className="text-xs text-gray-500 leading-tight">Management System</p>
            </div>
          )}
          <button
            onClick={toggle}
            className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-dark-700 transition shrink-0"
            title={sidebarOpen ? 'Tutup sidebar' : 'Buka sidebar'}
          >
            {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {links.map(link => {
            const Icon = link.icon
            const isActive = location.pathname === link.to
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={closeMobile}
                title={!sidebarOpen ? link.label : undefined}
                className={`relative flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all group
                  ${!sidebarOpen ? 'justify-center' : ''}
                  ${isActive
                    ? 'bg-indigo-500/15 text-indigo-300'
                    : 'text-gray-400 hover:bg-dark-700 hover:text-gray-200'
                  }`}
              >
                <Icon size={21} className={`shrink-0 ${isActive ? 'text-indigo-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
                {sidebarOpen && <span className="flex-1">{link.label}</span>}
                {sidebarOpen && link.badge && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-indigo-500/30 text-indigo-200' : 'bg-dark-700 text-gray-400'
                  }`}>
                    {link.badge}
                  </span>
                )}
                {!sidebarOpen && link.badge && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-400 rounded-full" />
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Footer: theme toggle + user info + logout */}
        <div className="shrink-0 border-t border-dark-700 p-2 space-y-1">
          <button
            onClick={toggleTheme}
            title={isDark ? 'Ganti ke Light Mode' : 'Ganti ke Dark Mode'}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-dark-700 hover:text-gray-200 transition ${!sidebarOpen ? 'justify-center' : ''}`}
          >
            {isDark
              ? <Sun size={19} className="shrink-0 text-amber-400" />
              : <Moon size={19} className="shrink-0 text-indigo-400" />
            }
            {sidebarOpen && <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>

          {/* User info row */}
          <div className={`flex items-center gap-3 px-3 py-2 ${!sidebarOpen ? 'justify-center' : ''}`}>
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: roleInfo?.color + '25', color: roleInfo?.color }}
            >
              {initials}
            </div>
            {sidebarOpen && user && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-300 truncate">{user.name}</p>
                <p className="text-xs truncate" style={{ color: roleInfo?.color }}>{roleInfo?.label} · {user.department}</p>
              </div>
            )}
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            title="Keluar"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition ${!sidebarOpen ? 'justify-center' : ''}`}
          >
            <LogOut size={18} className="shrink-0" />
            {sidebarOpen && <span>Keluar</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
