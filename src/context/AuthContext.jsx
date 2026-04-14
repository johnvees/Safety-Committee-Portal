import { createContext, useContext, useState, useCallback } from 'react'
import { api } from '../api'

// ─── Role → allowed action permissions ───────────────────────────────────────
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
  // Executive leadership — read + discussion only
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
  // Field level
  staff: [
    'create_finding',
    'add_discussion',
  ],
  viewer: [],
}

// ─── Role → accessible pages ─────────────────────────────────────────────────
const ALL_ROLES = ['admin', 'president', 'vice_president', 'general_manager', 'manager', 'supervisor', 'staff', 'viewer']
const EXEC_AND_ABOVE = ['admin', 'president', 'vice_president', 'general_manager', 'manager', 'supervisor']

const PAGE_ACCESS = {
  dashboard:     ALL_ROLES,
  findings:      ALL_ROLES,
  archive:       EXEC_AND_ABOVE,
  costs:         EXEC_AND_ABOVE,
  guidelines:    ALL_ROLES,
  notifications: ALL_ROLES,
  users:         ['admin'],
}

export const ROLE_LABELS = {
  president:      { label: 'President',      color: '#b45309', bg: '#fffbeb' },
  vice_president: { label: 'Vice President', color: '#d97706', bg: '#fffbeb' },
  general_manager:{ label: 'General Manager',color: '#7c3aed', bg: '#f5f3ff' },
  manager:        { label: 'Manager',        color: '#6366f1', bg: '#eef2ff' },
  supervisor:     { label: 'Supervisor',     color: '#0ea5e9', bg: '#f0f9ff' },
  staff:          { label: 'Staff',          color: '#10b981', bg: '#ecfdf5' },
  viewer:         { label: 'Viewer',         color: '#9ca3af', bg: '#f9fafb' },
  admin:          { label: 'Admin',          color: '#ef4444', bg: '#fef2f2' },
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('auth_user')
      return stored ? JSON.parse(stored) : null
    } catch { return null }
  })

  const login = useCallback(async (username, password) => {
    const userData = await api.login(username, password)
    localStorage.setItem('auth_user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('auth_user')
    setUser(null)
  }, [])

  const hasPermission = useCallback((permission) => {
    if (!user) return false
    return (ROLE_PERMISSIONS[user.role] || []).includes(permission)
  }, [user])

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

export const useAuth = () => useContext(AuthContext)
