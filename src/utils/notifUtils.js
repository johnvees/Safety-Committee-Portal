import { useMemo } from 'react'
import { getDaysLeft, isCompleted } from '../constants'

/**
 * Determines whether a stored notification should be shown to the given user.
 *
 * Notifications can be targeted in two ways:
 *   1. targetUsername (string) — a direct @mention; only that user sees it.
 *   2. targetRule (string) — a rule-based audience:
 *      - 'all'               → visible to everyone
 *      - 'assigned'          → only the finding's assignedTo user
 *      - 'reporter'          → only the finding's reportedBy user
 *      - 'assigned_reporter' → either assignedTo or reportedBy (default)
 *
 * Admins always see rule-based notifications regardless of the rule.
 *
 * @param {object} n    - Notification object (has .targetUsername or .targetRule)
 * @param {object} f    - The finding the notification belongs to
 * @param {object} user - The currently logged-in user
 * @returns {boolean}
 */
export function matchesNotifUser(n, f, user) {
  if (!user) return false

  // Explicit mention target — always enforced, even for admin
  if (n.targetUsername) return n.targetUsername === user.username

  // Admins see all rule-based system notifications
  if (user.role === 'admin') return true

  // Rule-based audience check
  const isAssigned = f.assignedTo === user.name
  const isReporter = f.reportedBy === user.name
  const rule = n.targetRule || 'assigned_reporter' // default if no rule specified

  if (rule === 'all')               return true
  if (rule === 'assigned')          return isAssigned
  if (rule === 'reporter')          return isReporter
  if (rule === 'assigned_reporter') return isAssigned || isReporter
  return false
}

/**
 * React hook that computes the total unread notification count for a user.
 * Reads dismissed/read state directly from localStorage rather than via context,
 * so it can be called outside of NotifProvider (e.g. in utility components).
 *
 * Counts:
 *   - Stored finding notifications that match the user and haven't been read/dismissed
 *   - Auto: overdue findings (past deadline, not completed)
 *   - Auto: deadline warnings (≤3 days remaining, not completed)
 *
 * Memoised on [findings, user] — recalculates only when the findings list or
 * the logged-in user changes.
 *
 * @param {Array} findings - Array of finding objects
 * @param {object} user    - The logged-in user object
 * @returns {number} Total unread notification count
 */
export function useUserUnreadCount(findings, user) {
  return useMemo(() => {
    if (!user) return 0

    // Load per-user dismissed and read sets from localStorage
    let dismissed, readSet
    try { dismissed = new Set(JSON.parse(localStorage.getItem(`notif_dismissed_${user.username}`) || '[]')) }
    catch { dismissed = new Set() }
    try { readSet = new Set(JSON.parse(localStorage.getItem(`notif_read_${user.username}`) || '[]')) }
    catch { readSet = new Set() }

    let count = 0

    findings.forEach(f => {
      // Stored notifications: unread = matches user + not dismissed + not yet explicitly read
      // "read" = present in user's local readSet OR the DB field n.read is already true
      count += (f.notifications || []).filter(n =>
        matchesNotifUser(n, f, user) &&
        !dismissed.has(n.id) &&
        !readSet.has(n.id) &&
        !n.read
      ).length

      const days = getDaysLeft(f.deadline)

      // Auto-notification: finding is overdue (shown to all users)
      if (days !== null && days < 0 && !isCompleted(f)) {
        if (!dismissed.has(`auto-od-${f.id}`)) count++
      }
      // Auto-notification: deadline warning — ≤3 days remaining (shown to all users)
      if (days !== null && days > 0 && days <= 3 && !isCompleted(f)) {
        if (!dismissed.has(`auto-warn-${f.id}`)) count++
      }
    })

    return count
  }, [findings, user])
}
