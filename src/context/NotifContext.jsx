import { createContext, useContext, useState, useMemo, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { useFindings } from './FindingsContext'
import { matchesNotifUser } from '../utils/notifUtils'
import { getDaysLeft, isCompleted } from '../constants'

// The React context object for notifications state
const NotifContext = createContext()

/**
 * Read the currently logged-in user's username from localStorage.
 * Used to namespace per-user storage keys (dismissed/read sets).
 * Returns 'guest' as a safe fallback.
 */
function storedUsername() {
  try { return JSON.parse(localStorage.getItem('auth_user') || 'null')?.username || 'guest' }
  catch { return 'guest' }
}

/**
 * Load a persisted Set of notification IDs from localStorage.
 * Keyed by type ('dismissed' or 'read') and username so each user has independent state.
 * @param {'dismissed'|'read'} type
 * @param {string} username
 * @returns {Set<string>}
 */
function loadSet(type, username) {
  try { return new Set(JSON.parse(localStorage.getItem(`notif_${type}_${username}`) || '[]')) }
  catch { return new Set() }
}

/**
 * NotifProvider — manages per-user notification read/dismiss state.
 *
 * Notifications have two separate local states:
 *   - dismissed: the user has explicitly closed/dismissed a notification (it hides permanently)
 *   - read: the user has viewed the notification (removes the unread badge)
 *
 * Both are persisted to localStorage so they survive page refreshes.
 * When the logged-in user changes, the sets are re-loaded for the new user.
 */
export function NotifProvider({ children }) {
  const { user } = useAuth()
  const { findings, deletionLog } = useFindings()

  // Username used as the localStorage key suffix — falls back to 'guest'
  const username = user?.username || 'guest'

  // Initialise both sets from localStorage for whoever was logged in at mount time
  const [dismissed, setDismissed] = useState(() => loadSet('dismissed', storedUsername()))
  const [readSet,   setReadSet]   = useState(() => loadSet('read',      storedUsername()))

  // Re-load from localStorage whenever the logged-in user changes (login / logout / switch)
  useEffect(() => {
    setDismissed(loadSet('dismissed', username))
    setReadSet(loadSet('read', username))
  }, [username])

  /**
   * Permanently hide one or more notifications for the current user.
   * Accepts any number of notification IDs as arguments.
   * @param {...string} ids - Notification IDs to dismiss
   */
  const dismiss = (...ids) => {
    setDismissed(prev => {
      const next = new Set([...prev, ...ids])
      localStorage.setItem(`notif_dismissed_${username}`, JSON.stringify([...next]))
      return next
    })
  }

  /**
   * Mark a single notification as read (removes the unread dot).
   * No-op if already in the readSet.
   * @param {string} nid - Notification ID
   */
  const markRead = (nid) => {
    setReadSet(prev => {
      if (prev.has(nid)) return prev // already read — nothing to do
      const next = new Set([...prev, nid])
      localStorage.setItem(`notif_read_${username}`, JSON.stringify([...next]))
      return next
    })
  }

  /**
   * Determine whether a notification should be considered "read".
   * A notification is read if:
   *   1. The user has explicitly read it (readSet contains its ID), OR
   *   2. The DB already had n.read === true (legacy / server-side data), OR
   *   3. It's an auto-generated "completed" notification (always shown as read)
   * @param {object} n - Notification object
   */
  const isRead = (n) => readSet.has(n.id) || n.read === true || (n.auto && n.type === 'completed')

  /**
   * Total count of unread notifications for the current user.
   * Recalculated whenever findings, deletionLog, dismissed, or readSet changes.
   * Includes:
   *   - Stored notifications embedded in findings (filtered by targetRule/targetUsername)
   *   - Auto-generated overdue warnings (deadline < today)
   *   - Auto-generated deadline warnings (deadline within 3 days)
   *   - Deletion log entries (visible to everyone)
   */
  const unreadCount = useMemo(() => {
    if (!user) return 0
    let count = 0

    findings.forEach(f => {
      // Count stored notifications that belong to this user and haven't been read/dismissed
      count += (f.notifications || []).filter(n =>
        matchesNotifUser(n, f, user) &&
        !dismissed.has(n.id) &&
        !readSet.has(n.id) &&
        !n.read
      ).length

      const days = getDaysLeft(f.deadline)
      // Auto-notification: finding is overdue (past deadline, not completed)
      if (days !== null && days < 0 && !isCompleted(f) && !dismissed.has(`auto-od-${f.id}`)) count++
      // Auto-notification: deadline is within 3 days (warning)
      if (days !== null && days > 0 && days <= 3 && !isCompleted(f) && !dismissed.has(`auto-warn-${f.id}`)) count++
    })

    // Deletion log entries — globally visible to all users (no targetRule filtering)
    ;(deletionLog || []).forEach(n => {
      if (!dismissed.has(n.id) && !readSet.has(n.id)) count++
    })

    return count
  }, [findings, deletionLog, user, dismissed, readSet])

  return (
    <NotifContext.Provider value={{
      dismissed,    // Set<string> of dismissed notification IDs for the current user
      readSet,      // Set<string> of read notification IDs for the current user
      dismiss,      // Function to dismiss one or more notifications
      markRead,     // Function to mark a single notification as read
      isRead,       // Function(n) → boolean
      unreadCount,  // Number — drives the badge on the sidebar bell icon
    }}>
      {children}
    </NotifContext.Provider>
  )
}

/** Hook to consume the notifications context. Must be used inside NotifProvider. */
export const useNotif = () => useContext(NotifContext)
