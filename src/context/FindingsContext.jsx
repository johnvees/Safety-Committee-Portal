import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../api'
import { useAuth } from './AuthContext'

const FindingsContext = createContext()

const uid = () => `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
const now = () => new Date().toISOString()

function buildUpdateNotifications(old, data, actorName) {
  const notifs = []
  const by = actorName ? ` oleh ${actorName}` : ''

  // Checklist item changes — one notification per changed item
  if (old.checklist && data.checklist) {
    data.checklist.forEach(c => {
      const prev = old.checklist.find(p => p.id === c.id)
      if (prev && prev.done !== c.done) {
        notifs.push({
          id: uid(),
          type: 'checklist',
          message: `Item "${c.text}" di "${data.name}" telah ${c.done ? 'diselesaikan ✓' : 'dibatalkan'}${by}`,
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
      message: `Biaya temuan "${data.name}" telah diperbarui${by}`,
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
      message: `Deadline temuan "${data.name}" diperbarui${data.deadline ? ` → ${data.deadline}` : ''}${by}`,
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
      message: `Detail temuan "${data.name}" diperbarui${by}`,
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
      showToast('Gagal memuat data. Pastikan json-server berjalan.', 'error')
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
      message: `Temuan baru "${data.name}" ditambahkan oleh ${user?.name || 'seseorang'}`,
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
    setFindings(prev => [created, ...prev])
    showToast('Temuan baru berhasil disimpan!', 'success')
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
    setFindings(prev => prev.map(f => f.id === id ? updated : f))
    return updated
  }

  const deleteFinding = async (id) => {
    await api.deleteFinding(id)
    setFindings(prev => prev.filter(f => f.id !== id))
    showToast('Temuan berhasil dihapus.', 'success')
  }

  return (
    <FindingsContext.Provider value={{ findings, loading, toast, showToast, loadFindings, createFinding, updateFinding, deleteFinding }}>
      {children}
    </FindingsContext.Provider>
  )
}

export const useFindings = () => useContext(FindingsContext)
