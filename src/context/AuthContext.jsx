import { createContext, useContext, useState, useCallback } from 'react'
import { api } from '../api'

// ─── Role → allowed action permissions ───────────────────────────────────────
// Maps each user role to the list of action-level permissions it grants.
// Used by hasPermission() to show/hide buttons like "Delete Finding".
// To add a new permission: add the string here AND check it with hasPermission() in the UI.
const ROLE_PERMISSIONS = {
  // System administrator — full access including user management
  admin: [
    'create_finding', 'edit_finding', 'delete_finding',
    'view_costs', 'edit_costs',
    'upload_guideline', 'delete_guideline',
    'view_archive', 'restore_archive',
    'add_discussion', 'delete_discussion',
    'manage_users',
  ],
  // Executive leadership — read-only + can join discussions
  president: [
    'view_costs', 'view_archive',
    'add_discussion',
  ],
  vice_president: [
    'view_costs', 'view_archive',
    'add_discussion',
  ],
  // Operational leadership — create/edit findings, manage costs & archive
  general_manager: [
    'create_finding', 'edit_finding',
    'view_costs', 'edit_costs',
    'upload_guideline',
    'view_archive', 'restore_archive',
    'add_discussion', 'delete_discussion',
  ],
  manager: [
    'create_finding', 'edit_finding',
    'view_costs', 'edit_costs',
    'upload_guideline',
    'view_archive', 'restore_archive',
    'add_discussion', 'delete_discussion',
  ],
  supervisor: [
    'create_finding', 'edit_finding',
    'view_costs',
    'view_archive',
    'add_discussion', 'delete_discussion',
  ],
  // Field level — can report findings and participate in discussions
  staff: [
    'create_finding',
    'add_discussion',
  ],
  // Read-only — no actions allowed
  viewer: [],
}

// ─── Role → accessible pages ─────────────────────────────────────────────────
// Controls which sidebar links are visible and which routes are protected.
// Used by canAccessPage() inside ProtectedRoute and Sidebar.
const ALL_ROLES        = ['admin', 'president', 'vice_president', 'general_manager', 'manager', 'supervisor', 'staff', 'viewer']
const EXEC_AND_ABOVE   = ['admin', 'president', 'vice_president', 'general_manager', 'manager', 'supervisor']

const PAGE_ACCESS = {
  dashboard:     ALL_ROLES,       // everyone can see the dashboard
  findings:      ALL_ROLES,       // everyone can browse findings
  archive:       EXEC_AND_ABOVE,  // staff/viewer cannot access archive
  costs:         EXEC_AND_ABOVE,  // staff/viewer cannot see cost data
  guidelines:    ALL_ROLES,       // everyone can read guidelines
  notifications: ALL_ROLES,       // everyone receives notifications
  users:         ['admin'],       // only admin can manage user accounts
}

/**
 * Display metadata for each role: human-readable label plus badge colors.
 * Used in UsersPage, the sidebar footer, and anywhere a role badge is rendered.
 */
export const ROLE_LABELS = {
  president:       { label: 'President',       color: '#b45309', bg: '#fffbeb' },
  vice_president:  { label: 'Vice President',  color: '#d97706', bg: '#fffbeb' },
  general_manager: { label: 'General Manager', color: '#7c3aed', bg: '#f5f3ff' },
  manager:         { label: 'Manager',         color: '#6366f1', bg: '#eef2ff' },
  supervisor:      { label: 'Supervisor',      color: '#0ea5e9', bg: '#f0f9ff' },
  staff:           { label: 'Staff',           color: '#10b981', bg: '#ecfdf5' },
  viewer:          { label: 'Viewer',          color: '#9ca3af', bg: '#f9fafb' },
  admin:           { label: 'Admin',           color: '#ef4444', bg: '#fef2f2' },
}

// The React context object — value is provided by AuthProvider below
const AuthContext = createContext(null)

/**
 * AuthProvider — wraps the entire app and exposes auth state + helpers.
 *
 * Persists the logged-in user object to localStorage so the session
 * survives a page refresh. On mount, it reads that stored value back.
 */
export function AuthProvider({ children }) {
  // Initialise from localStorage so the user stays logged in after a refresh.
  // JSON.parse can throw on corrupt data, so it's guarded with try/catch.
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('auth_user')
      return stored ? JSON.parse(stored) : null
    } catch { return null }
  })

  /**
   * Log in: call the API, persist the returned user object, update state.
   * Throws if credentials are wrong (HTTP 401) or server is unreachable.
   */
  const login = useCallback(async (username, password) => {
    const userData = await api.login(username, password)
    localStorage.setItem('auth_user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }, [])

  /**
   * Log out: clear the persisted session and reset user state to null.
   * This causes AppInner to re-render and show AuthGate.
   */
  const logout = useCallback(() => {
    localStorage.removeItem('auth_user')
    setUser(null)
  }, [])

  /**
   * Check if the logged-in user has a specific action permission.
   * Returns false if no user is logged in.
   * @param {string} permission - e.g. 'delete_finding'
   */
  const hasPermission = useCallback((permission) => {
    if (!user) return false
    return (ROLE_PERMISSIONS[user.role] || []).includes(permission)
  }, [user])

  /**
   * Check if the logged-in user's role is allowed to view a given page.
   * Used in ProtectedRoute and to filter sidebar links.
   * @param {string} page - e.g. 'archive', 'costs', 'users'
   */
  const canAccessPage = useCallback((page) => {
    if (!user) return false
    return (PAGE_ACCESS[page] || []).includes(user.role)
  }, [user])

  return (
    <AuthContext.Provider value={{ user, login, logout, hasPermission, canAccessPage }}>
      {children}
    </AuthContext.Provider>
  )
}

/** Hook to consume the auth context. Must be used inside AuthProvider. */
export const useAuth = () => useContext(AuthContext)
