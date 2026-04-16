import { createContext, useContext, useState, useMemo, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { useFindings } from './FindingsContext'
import { matchesNotifUser } from '../utils/notifUtils'
import { getDaysLeft, isCompleted } from '../constants'

const NotifContext = createContext()

function storedUsername() {
  try { return JSON.parse(localStorage.getItem('auth_user') || 'null')?.username || 'guest' }
  catch { return 'guest' }
}

function loadSet(type, username) {
  try { return new Set(JSON.parse(localStorage.getItem(`notif_${type}_${username}`) || '[]')) }
  catch { return new Set() }
}

export function NotifProvider({ children }) {
  const { user } = useAuth()
  const { findings, deletionLog } = useFindings()

  const username = user?.username || 'guest'

  const [dismissed, setDismissed] = useState(() => loadSet('dismissed', storedUsername()))
  const [readSet,   setReadSet]   = useState(() => loadSet('read',      storedUsername()))

  // Re-load from localStorage whenever the logged-in user changes (login / logout / switch)
  useEffect(() => {
    setDismissed(loadSet('dismissed', username))
    setReadSet(loadSet('read', username))
  }, [username])

  const dismiss = (...ids) => {
    setDismissed(prev => {
      const next = new Set([...prev, ...ids])
      localStorage.setItem(`notif_dismissed_${username}`, JSON.stringify([...next]))
      return next
    })
  }

  const markRead = (nid) => {
    setReadSet(prev => {
      if (prev.has(nid)) return prev
      const next = new Set([...prev, nid])
      localStorage.setItem(`notif_read_${username}`, JSON.stringify([...next]))
      return next
    })
  }

  // A notification counts as read if: user has explicitly read it (readSet)
  // OR the DB already had it marked read (n.read === true, legacy data)
  // OR it's the "completed" auto-notification
  const isRead = (n) => readSet.has(n.id) || n.read === true || (n.auto && n.type === 'completed')

  const unreadCount = useMemo(() => {
    if (!user) return 0
    let count = 0
    findings.forEach(f => {
      // Stored notifications
      count += (f.notifications || []).filter(n =>
        matchesNotifUser(n, f, user) &&
        !dismissed.has(n.id) &&
        !readSet.has(n.id) &&
        !n.read
      ).length

      // Auto: overdue
      const days = getDaysLeft(f.deadline)
      if (days !== null && days < 0 && !isCompleted(f) && !dismissed.has(`auto-od-${f.id}`)) count++
      // Auto: deadline warning ≤3 days
      if (days !== null && days > 0 && days <= 3 && !isCompleted(f) && !dismissed.has(`auto-warn-${f.id}`)) count++
    })
    // Deletion log notifications (global — visible to all users except the actor)
    ;(deletionLog || []).forEach(n => {
      if (!dismissed.has(n.id) && !readSet.has(n.id)) count++
    })
    return count
  }, [findings, deletionLog, user, dismissed, readSet])

  return (
    <NotifContext.Provider value={{ dismissed, readSet, dismiss, markRead, isRead, unreadCount }}>
      {children}
    </NotifContext.Provider>
  )
}

export const useNotif = () => useContext(NotifContext)
