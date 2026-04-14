import { useFindings } from '../context/FindingsContext'
import { useAuth } from '../context/AuthContext'
import { useNotif } from '../context/NotifContext'
import { matchesNotifUser } from '../utils/notifUtils'
import { getType, getDaysLeft, isCompleted, formatDate, formatDateTime } from '../constants'
import { Bell, AlertTriangle, Clock, CheckCircle2, UserCheck, X, BellOff, PlusCircle, PencilLine, DollarSign, CalendarClock, ChevronDown, ChevronUp, Trash2, AtSign } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DateFilter, { matchesDateFilter, usePersistentDateFilter } from '../components/DateFilter'

const FOCUS_MAP = {
  checklist:        'checklist',
  completed:        'checklist',
  cost_updated:     'cost',
  deadline_updated: 'deadline',
  overdue:          'deadline',
  deadline_warning: 'deadline',
  mention:          'discussion',
}

const READ_PAGE_SIZE = 10

export default function NotificationsPage() {
  const { findings } = useFindings()
  const { user } = useAuth()
  const { dismissed, readSet, dismiss, markRead, isRead } = useNotif()
  const navigate = useNavigate()
  const [dateRange, setDateRange] = usePersistentDateFilter('notifications-date')
  const [showRead, setShowRead] = useState(false)
  const [readVisible, setReadVisible] = useState(READ_PAGE_SIZE)

  const deleteNotif = (e, n) => {
    e.stopPropagation()
    dismiss(n.id)
  }

  const deleteAllRead = () => {
    dismiss(...allNotifs.filter(n => isRead(n)).map(n => n.id))
  }

  const allNotifs = useMemo(() => {
    if (!user) return []
    const notifs = []

    findings.forEach(f => {
      ;(f.notifications || []).forEach(n => {
        if (matchesNotifUser(n, f, user)) {
          notifs.push({ ...n, findingId: f.id, findingName: f.name, findingType: f.type })
        }
      })

      const days = getDaysLeft(f.deadline)
      if (days !== null && days < 0 && !isCompleted(f))
        notifs.push({ id: `auto-od-${f.id}`, type: 'overdue', message: `"${f.name}" sudah ${Math.abs(days)} hari melewati deadline!`, date: new Date().toISOString().slice(0, 10), findingId: f.id, findingName: f.name, findingType: f.type, auto: true })
      if (days !== null && days > 0 && days <= 3 && !isCompleted(f))
        notifs.push({ id: `auto-warn-${f.id}`, type: 'deadline_warning', message: `"${f.name}" deadline ${days} hari lagi (${formatDate(f.deadline)})`, date: new Date().toISOString().slice(0, 10), findingId: f.id, findingName: f.name, findingType: f.type, auto: true })
      if (isCompleted(f))
        notifs.push({ id: `auto-done-${f.id}`, type: 'completed', message: `"${f.name}" telah diselesaikan dan masuk arsip`, date: f.createdAt, findingId: f.id, findingName: f.name, findingType: f.type, auto: true })
    })

    return notifs.filter(n => !dismissed.has(n.id)).sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [findings, dismissed, user])

  const filtered  = allNotifs.filter(n => matchesDateFilter(n.date, dateRange))
  const unread    = filtered.filter(n => !isRead(n))
  const read      = filtered.filter(n =>  isRead(n))

  const iconMap = {
    overdue:          { icon: AlertTriangle, color: '#ef4444', bg: '#fef2f2' },
    deadline_warning: { icon: Clock,         color: '#f59e0b', bg: '#fffbeb' },
    completed:        { icon: CheckCircle2,  color: '#10b981', bg: '#ecfdf5' },
    assigned:         { icon: UserCheck,     color: '#6366f1', bg: '#eef2ff' },
    created:          { icon: PlusCircle,    color: '#6366f1', bg: '#eef2ff' },
    updated:          { icon: PencilLine,    color: '#8b5cf6', bg: '#f5f3ff' },
    checklist:        { icon: CheckCircle2,  color: '#10b981', bg: '#ecfdf5' },
    cost_updated:     { icon: DollarSign,    color: '#f59e0b', bg: '#fffbeb' },
    deadline_updated: { icon: CalendarClock, color: '#f59e0b', bg: '#fffbeb' },
    mention:          { icon: AtSign,        color: '#6366f1', bg: '#eef2ff' },
  }

  const handleClick = (n) => {
    if (!isRead(n)) markRead(n.id)
    const focus = FOCUS_MAP[n.type]
    navigate(`/findings/${n.findingId}${focus ? `?focus=${focus}` : ''}`)
  }

  const renderUnread = (n) => {
    const style = iconMap[n.type] || iconMap.assigned
    const Icon  = style.icon
    const type  = getType(n.findingType)
    return (
      <div
        key={n.id}
        onClick={() => handleClick(n)}
        className="flex items-start gap-4 px-5 py-4 rounded-xl transition cursor-pointer bg-dark-900 border border-dark-700 hover:border-indigo-500/50 hover:bg-dark-900/80"
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: style.bg + '20', color: style.color }}><Icon size={20} /></div>
        <div className="flex-1 min-w-0">
          <p className="text-base text-gray-200 leading-snug">{n.message}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-xs text-gray-500">{formatDateTime(n.date)}</span>
            {type && <span className="text-xs font-bold px-2 py-0.5 rounded-lg" style={{ background: type.color + '15', color: type.color }}>{type.short}</span>}
          </div>
        </div>
        {!n.auto && (
          <button
            onClick={e => { e.stopPropagation(); markRead(n.id) }}
            className="text-gray-600 hover:text-gray-300 p-1 rounded-lg hover:bg-dark-700 transition shrink-0 mt-0.5"
            title="Tandai sudah dibaca"
          ><X size={15} /></button>
        )}
      </div>
    )
  }

  const renderRead = (n) => {
    const style = iconMap[n.type] || iconMap.assigned
    const Icon  = style.icon
    return (
      <div
        key={n.id}
        onClick={() => handleClick(n)}
        className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition cursor-pointer hover:bg-dark-900/60 group"
      >
        <Icon size={14} style={{ color: style.color }} className="shrink-0 opacity-50" />
        <p className="flex-1 text-sm text-gray-500 truncate group-hover:text-gray-400">{n.message}</p>
        <span className="text-xs text-gray-700 shrink-0">{formatDateTime(n.date)}</span>
        <button
          onClick={e => deleteNotif(e, n)}
          className="text-red-500/60 hover:text-red-400 p-1 rounded-lg hover:bg-red-500/10 transition shrink-0"
          title="Hapus notifikasi"
        ><Trash2 size={13} /></button>
      </div>
    )
  }

  const readSlice  = read.slice(0, readVisible)
  const hasMoreRead = readVisible < read.length

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-100 tracking-tight flex items-center gap-3"><Bell size={28} className="text-amber-400" /> Notifikasi</h1>
        <p className="text-base text-gray-400 mt-1">Deadline, overdue, dan status update untuk manajemen</p>
      </div>

      <div className="bg-dark-800 border border-dark-700 rounded-2xl px-5 py-4">
        <DateFilter value={dateRange} onChange={setDateRange} />
      </div>

      {unread.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            Belum Dibaca
            <span className="bg-amber-400/20 text-amber-400 text-xs font-bold px-2 py-0.5 rounded-full">{unread.length}</span>
          </h3>
          <div className="space-y-2">{unread.map(renderUnread)}</div>
        </div>
      )}

      {read.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => { setShowRead(v => !v); setReadVisible(READ_PAGE_SIZE) }}
              className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-400 transition select-none"
            >
              {showRead ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              Sudah Dibaca ({read.length})
            </button>
            <button
              onClick={deleteAllRead}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-red-400 transition px-2 py-1 rounded-lg hover:bg-red-500/10"
              title="Hapus semua yang sudah dibaca"
            >
              <Trash2 size={13} /> Hapus semua
            </button>
          </div>

          {showRead && (
            <div className="bg-dark-800 border border-dark-700 rounded-2xl overflow-hidden">
              <div className="divide-y divide-dark-700/50">
                {readSlice.map(renderRead)}
              </div>
              {hasMoreRead && (
                <button
                  onClick={() => setReadVisible(v => v + READ_PAGE_SIZE)}
                  className="w-full py-3 text-sm text-gray-600 hover:text-gray-400 hover:bg-dark-900/40 transition font-semibold"
                >
                  Lihat {Math.min(READ_PAGE_SIZE, read.length - readVisible)} lagi dari {read.length - readVisible} tersisa
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-24 text-gray-500"><BellOff size={56} className="mx-auto mb-4 opacity-25" /><p className="text-lg">Tidak ada notifikasi pada rentang ini.</p></div>
      )}
    </div>
  )
}
