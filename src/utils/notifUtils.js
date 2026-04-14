import { useMemo } from 'react'
import { getDaysLeft, isCompleted } from '../constants'

/**
 * Returns true if a stored notification belongs to the given user.
 * Uses explicit targetUsername (mention) or targetRule (system events).
 */
export function matchesNotifUser(n, f, user) {
  if (!user) return false
  // Explicit target (mention) — always enforced, even for admin
  if (n.targetUsername) return n.targetUsername === user.username
  // Admin sees all rule-based system notifications
  if (user.role === 'admin') return true
  // Rule-based target for system notifications
  const isAssigned = f.assignedTo === user.name
  const isReporter = f.reportedBy === user.name
  const rule = n.targetRule || 'assigned_reporter'
  if (rule === 'all') return true
  if (rule === 'assigned') return isAssigned
  if (rule === 'reporter') return isReporter
  if (rule === 'assigned_reporter') return isAssigned || isReporter
  return false
}

/**
 * Returns total unread notification count for the current user.
 * Includes stored notifications + auto-generated overdue/deadline_warning.
 */
export function useUserUnreadCount(findings, user) {
  return useMemo(() => {
    if (!user) return 0
    let dismissed, readSet
    try { dismissed = new Set(JSON.parse(localStorage.getItem(`notif_dismissed_${user.username}`) || '[]')) }
    catch { dismissed = new Set() }
    try { readSet = new Set(JSON.parse(localStorage.getItem(`notif_read_${user.username}`) || '[]')) }
    catch { readSet = new Set() }

    let count = 0

    findings.forEach(f => {
      // Stored notifications: unread = matches user + not dismissed + not yet read
      // "read" = explicitly read in user's local readSet OR DB field is already true
      count += (f.notifications || []).filter(n =>
        matchesNotifUser(n, f, user) &&
        !dismissed.has(n.id) &&
        !readSet.has(n.id) &&
        !n.read
      ).length

      // Auto: overdue (all users)
      const days = getDaysLeft(f.deadline)
      if (days !== null && days < 0 && !isCompleted(f)) {
        if (!dismissed.has(`auto-od-${f.id}`)) count++
      }
      // Auto: deadline warning — ≤3 days (all users)
      if (days !== null && days > 0 && days <= 3 && !isCompleted(f)) {
        if (!dismissed.has(`auto-warn-${f.id}`)) count++
      }
    })

    return count
  }, [findings, user])
}
