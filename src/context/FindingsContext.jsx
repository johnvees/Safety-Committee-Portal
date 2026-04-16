import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../api'
import { useAuth } from './AuthContext'

// The React context object shared across all consuming components
const FindingsContext = createContext()

/** Generate a unique notification ID using current timestamp + random suffix */
const uid = () => `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

/** Return the current timestamp as an ISO string */
const now = () => new Date().toISOString()

/**
 * Compare the old and new versions of a finding and generate automatic
 * in-app notifications for each meaningful change.
 * This is called inside updateFinding before the API request is sent.
 *
 * @param {object} old - The finding object as it was before the edit
 * @param {object} data - The new finding data being saved
 * @param {string} actorName - Display name of the user making the change
 * @returns {Array} Array of notification objects to append to the finding
 */
function buildUpdateNotifications(old, data, actorName) {
  const notifs = []
  const by = actorName ? ` by ${actorName}` : '' // suffix for notification messages

  // Checklist item changes — one notification per toggled item
  if (old.checklist && data.checklist) {
    data.checklist.forEach(c => {
      const prev = old.checklist.find(p => p.id === c.id)
      if (prev && prev.done !== c.done) {
        notifs.push({
          id: uid(),
          type: 'checklist',
          message: `Item "${c.text}" in "${data.name}" has been ${c.done ? 'completed ✓' : 'unchecked'}${by}`,
          date: now(),
          read: false,
          targetRule: 'all', // visible to all users
        })
      }
    })
  }

  // Cost changes — check both item list and the computed total
  const estChanged =
    JSON.stringify(old.costItems) !== JSON.stringify(data.costItems) ||
    old.estimatedCost !== data.estimatedCost
  const actChanged =
    JSON.stringify(old.actualCostItems) !== JSON.stringify(data.actualCostItems) ||
    old.actualCost !== data.actualCost
  if (estChanged || actChanged) {
    notifs.push({
      id: uid(),
      type: 'cost_updated',
      message: `Cost for "${data.name}" has been updated${by}`,
      date: now(),
      read: false,
      targetRule: 'all',
    })
  }

  // Deadline change
  if (old.deadline !== data.deadline) {
    notifs.push({
      id: uid(),
      type: 'deadline_updated',
      message: `Deadline for "${data.name}" updated${data.deadline ? ` → ${data.deadline}` : ''}${by}`,
      date: now(),
      read: false,
      targetRule: 'all',
    })
  }

  // General field changes (name, area, type, description, priority, etc.)
  const generalFields = ['name', 'area', 'type', 'description', 'priority', 'reportedBy', 'findingDate', 'guideline', 'costNotes']
  const generalChanged = generalFields.some(k => old[k] !== data[k])
  if (generalChanged) {
    notifs.push({
      id: uid(),
      type: 'updated',
      message: `Details of "${data.name}" updated${by}`,
      date: now(),
      read: false,
      targetRule: 'all',
    })
  }

  return notifs
}

/**
 * FindingsProvider — the central data store for findings.
 *
 * Responsibilities:
 * - Fetch and cache the findings list from the API on mount
 * - Keep findings in sync in real-time via Server-Sent Events (SSE)
 * - Expose CRUD operations (createFinding, updateFinding, deleteFinding)
 * - Manage a photo cache (photos are excluded from the list endpoint for performance)
 * - Drive the global toast notification system
 */
export function FindingsProvider({ children }) {
  const { user } = useAuth()

  // ── Core state ─────────────────────────────────────────────────────────────
  const [findings, setFindings] = useState([])     // All findings (without photos)
  const [loading, setLoading] = useState(true)     // True during the initial fetch
  const [toast, setToast] = useState(null)         // Active toast message (or null)
  const [deletionLog, setDeletionLog] = useState([]) // Audit log of deleted findings

  // ── Photo cache ────────────────────────────────────────────────────────────
  // The /findings list endpoint strips photos to keep payloads small (~50KB vs ~3MB).
  // Photos are fetched lazily per finding and stored here, keyed by finding ID.
  // photoCacheRef mirrors photoCache but is accessible synchronously (inside callbacks).
  const [photoCache, setPhotoCache] = useState({})
  const photoCacheRef = useRef({})       // Ref copy — avoids stale closure in callbacks
  const fetchingRef = useRef(new Set())  // Tracks in-flight photo requests to avoid duplicates

  /**
   * Lazy-load photos for a single finding.
   * No-op if photos are already cached or a fetch is already in progress.
   * @param {string} id - Finding ID
   */
  const fetchPhotos = useCallback(async (id) => {
    if (photoCacheRef.current[id] !== undefined || fetchingRef.current.has(id)) return
    fetchingRef.current.add(id)
    try {
      const full = await api.getFinding(id)
      photoCacheRef.current[id] = full.photos || []
      setPhotoCache(prev => ({ ...prev, [id]: photoCacheRef.current[id] }))
    } catch {} finally {
      fetchingRef.current.delete(id)
    }
  }, [])

  /**
   * Show a brief pop-up toast message.
   * Automatically dismisses itself after 3.5 seconds.
   * @param {string} message - The message text to display
   * @param {'info'|'success'|'error'} type - Controls the toast color/icon
   */
  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }, [])

  /** Fetch the deletion audit log from the server */
  const loadDeletionLog = useCallback(async () => {
    try {
      const data = await api.getDeletionLog()
      setDeletionLog(data)
    } catch {}
  }, [])

  /** Full findings fetch — shows a loading spinner while in progress */
  const loadFindings = useCallback(async () => {
    try {
      setLoading(true)
      const data = await api.getFindings()
      setFindings(data)
    } catch {
      showToast('Failed to load data. Make sure the server is running.', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  // ── Silent refresh (SSE-triggered) ────────────────────────────────────────
  // Refreshes the findings list in the background without a loading spinner.
  // Debounced by 150ms so rapid SSE events don't cause multiple simultaneous requests.
  const refreshTimer = useRef(null)
  const silentRefresh = useCallback(() => {
    clearTimeout(refreshTimer.current)
    refreshTimer.current = setTimeout(async () => {
      try {
        const data = await api.getFindings()
        setFindings(data)
      } catch {}
    }, 150)
  }, [])

  // Fetch data on mount
  useEffect(() => { loadFindings() }, [loadFindings])
  useEffect(() => { loadDeletionLog() }, [loadDeletionLog])

  // ── Server-Sent Events (SSE) ───────────────────────────────────────────────
  // The server broadcasts a 'change' event whenever findings or deletionLog change.
  // This keeps all open browser tabs / devices in sync without polling.
  useEffect(() => {
    const es = new EventSource(`http://${window.location.hostname}:3001/events`)
    es.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data)
        if (payload.type === 'change') {
          if (payload.resource === 'findings')    silentRefresh()
          if (payload.resource === 'deletionLog') loadDeletionLog()
        }
      } catch {}
    }
    // EventSource auto-reconnects on error — no manual handling needed
    return () => {
      es.close()
      clearTimeout(refreshTimer.current)
    }
  }, [silentRefresh])

  /**
   * Create a new finding.
   * Attaches a "created" notification, sets default status/metadata,
   * and prepends the new record to the local findings list optimistically.
   * @param {object} data - Form data from FindingsPage (name, type, checklist, etc.)
   */
  const createFinding = async (data) => {
    // System notification shown to all users when a new finding is added
    const createdNotif = {
      id: uid(),
      type: 'created',
      message: `New finding "${data.name}" added by ${user?.name || 'someone'}`,
      date: now(),
      read: false,
      targetRule: 'all',
    }
    const created = await api.createFinding({
      ...data,
      createdAt: new Date().toISOString(),
      status: 'open',
      discussions: [],
      followUps: [],
      notifications: [createdNotif],
    })
    // Strip photos from the state entry; keep them only in photoCache
    const { photos: _cp, ...createdWithoutPhotos } = created
    photoCacheRef.current[created.id] = created.photos || []
    setPhotoCache(prev => ({ ...prev, [created.id]: created.photos || [] }))
    setFindings(prev => [createdWithoutPhotos, ...prev]) // newest first
    showToast('New finding saved successfully!', 'success')
    return created
  }

  /**
   * Update an existing finding.
   * Automatically generates change notifications by comparing old vs new data.
   * Photos are stripped from the in-memory state after the save to keep payloads small.
   * @param {string} id - Finding ID to update
   * @param {object} data - The complete updated finding object
   */
  const updateFinding = async (id, data) => {
    const old = findings.find(f => f.id === id) // snapshot before update
    let newNotifs = []

    // Generate notifications only if we have the old state to compare against
    if (old) {
      newNotifs = buildUpdateNotifications(old, data, user?.name)
    }

    // Merge new auto-notifications with any manually attached ones (e.g. @mentions)
    const existingNotifs = data.notifications || []
    const merged = newNotifs.length > 0
      ? [...existingNotifs, ...newNotifs]
      : existingNotifs

    const updated = await api.updateFinding(id, { ...data, notifications: merged })

    // Strip photos before storing in context — keeping them in state would leak
    // them into subsequent PATCH bodies and cause thumbnails to blink on SSE refresh.
    const { photos: _, ...updatedWithoutPhotos } = updated

    // If photos were included in this save (e.g. edit form), refresh the photo cache
    if (updated.photos !== undefined) {
      photoCacheRef.current[id] = updated.photos
      setPhotoCache(prev => ({ ...prev, [id]: updated.photos }))
    }
    setFindings(prev => prev.map(f => f.id === id ? updatedWithoutPhotos : f))
    return updated
  }

  /**
   * Delete a finding permanently.
   * Records a deletion log entry for the Notifications audit trail,
   * then removes the finding from local state and clears its photo cache.
   * @param {string} id - Finding ID to delete
   */
  const deleteFinding = async (id) => {
    const finding = findings.find(f => f.id === id)
    // Build an audit log entry visible to all users in Notifications
    const entry = {
      id: uid(),
      type: 'deleted',
      message: `Finding "${finding?.name || 'Unknown'}" was deleted by ${user?.name || 'someone'}`,
      date: now(),
      findingName: finding?.name || '',
      findingType: finding?.type || '',
      actorName: user?.name || '',
      targetRule: 'all',
    }
    // Persist the log entry (best-effort — swallow errors so the delete still proceeds)
    try { await api.addDeletionLog(entry); setDeletionLog(prev => [entry, ...prev]) } catch {}

    await api.deleteFinding(id)

    // Clean up photo cache for the deleted finding
    delete photoCacheRef.current[id]
    setPhotoCache(prev => { const next = { ...prev }; delete next[id]; return next })

    setFindings(prev => prev.filter(f => f.id !== id))
    showToast('Finding deleted successfully.', 'success')
  }

  return (
    <FindingsContext.Provider value={{
      findings,       // Array of all finding objects (photos excluded)
      loading,        // Boolean — true while initial fetch is in progress
      toast,          // Active toast state ({ message, type }) or null
      showToast,      // Function to trigger a toast pop-up
      loadFindings,   // Force a full refetch (e.g. pull-to-refresh)
      createFinding,  // Create a new finding
      updateFinding,  // Update an existing finding
      deleteFinding,  // Delete a finding + log the deletion
      deletionLog,    // Array of deletion audit entries
      photoCache,     // { [findingId]: Photo[] } — lazily populated
      fetchPhotos,    // Request photos for a specific finding ID
    }}>
      {children}
    </FindingsContext.Provider>
  )
}

/** Hook to consume the findings context. Must be used inside FindingsProvider. */
export const useFindings = () => useContext(FindingsContext)
