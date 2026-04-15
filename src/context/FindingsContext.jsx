import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../api'
import { useAuth } from './AuthContext'

const FindingsContext = createContext()

const uid = () => `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
const now = () => new Date().toISOString()

function buildUpdateNotifications(old, data, actorName) {
  const notifs = []
  const by = actorName ? ` by ${actorName}` : ''

  // Checklist item changes — one notification per changed item
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
          targetRule: 'all',
        })
      }
    })
  }

  // Cost changes
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

  // General field changes
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

export function FindingsProvider({ children }) {
  const { user } = useAuth()
  const [findings, setFindings] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  // ── Photo cache ────────────────────────────────────────────────────────────
  // Photos are stripped from the list endpoint to keep payloads small.
  // This cache holds them separately, keyed by finding ID.
  // fetchPhotos is a no-op if photos are already cached or currently fetching.
  const [photoCache, setPhotoCache] = useState({})
  const photoCacheRef = useRef({})
  const fetchingRef = useRef(new Set())

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

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }, [])

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

  // Silent refresh — no loading spinner, used by SSE to sync state
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

  useEffect(() => { loadFindings() }, [loadFindings])

  // SSE — subscribe to server-pushed change events
  useEffect(() => {
    const es = new EventSource(`http://${window.location.hostname}:3001/events`)
    es.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data)
        if (payload.type === 'change' && payload.resource === 'findings') {
          silentRefresh()
        }
      } catch {}
    }
    // EventSource auto-reconnects on error — no manual handling needed
    return () => {
      es.close()
      clearTimeout(refreshTimer.current)
    }
  }, [silentRefresh])

  const createFinding = async (data) => {
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
    const { photos: _cp, ...createdWithoutPhotos } = created
    photoCacheRef.current[created.id] = created.photos || []
    setPhotoCache(prev => ({ ...prev, [created.id]: created.photos || [] }))
    setFindings(prev => [createdWithoutPhotos, ...prev])
    showToast('New finding saved successfully!', 'success')
    return created
  }

  const updateFinding = async (id, data) => {
    const old = findings.find(f => f.id === id)
    let newNotifs = []

    if (old) {
      newNotifs = buildUpdateNotifications(old, data, user?.name)
    }

    const existingNotifs = data.notifications || []
    const merged = newNotifs.length > 0
      ? [...existingNotifs, ...newNotifs]
      : existingNotifs

    const updated = await api.updateFinding(id, { ...data, notifications: merged })
    // Strip photos before storing in context — keeping them in state would leak
    // them into subsequent PATCH bodies and cause thumbnails to blink on SSE refresh.
    const { photos: _, ...updatedWithoutPhotos } = updated
    // If photos were part of this save (edit form), update the cache
    if (updated.photos !== undefined) {
      photoCacheRef.current[id] = updated.photos
      setPhotoCache(prev => ({ ...prev, [id]: updated.photos }))
    }
    setFindings(prev => prev.map(f => f.id === id ? updatedWithoutPhotos : f))
    return updated
  }

  const deleteFinding = async (id) => {
    await api.deleteFinding(id)
    delete photoCacheRef.current[id]
    setPhotoCache(prev => { const next = { ...prev }; delete next[id]; return next })
    setFindings(prev => prev.filter(f => f.id !== id))
    showToast('Finding deleted successfully.', 'success')
  }

  return (
    <FindingsContext.Provider value={{ findings, loading, toast, showToast, loadFindings, createFinding, updateFinding, deleteFinding, photoCache, fetchPhotos }}>
      {children}
    </FindingsContext.Provider>
  )
}

export const useFindings = () => useContext(FindingsContext)
