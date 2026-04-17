import { useFindings } from '../context/FindingsContext'
import { useAuth } from '../context/AuthContext'
import { useNotif } from '../context/NotifContext'
import { matchesNotifUser } from '../utils/notifUtils'
import { getType, getDaysLeft, isCompleted, formatDate, formatDateTime } from '../constants'
import { Bell, AlertTriangle, Clock, CheckCircle2, UserCheck, X, BellOff, PlusCircle, PencilLine, DollarSign, CalendarClock, ChevronDown, ChevronUp, Trash2, AtSign, ShieldAlert, ImageIcon, History } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DateFilter, { matchesDateFilter, usePersistentDateFilter } from '../components/DateFilter'

/**
 * Category filter pills shown at the top of the notifications page.
 * 'types: null' means show all notification types (no type filtering).
 */
const CATEGORIES = [
  { key: 'all',      label: 'All',      types: null },
  { key: 'urgent',   label: 'Urgent',   types: ['overdue', 'deadline_warning', 'deadline_updated'] },
  { key: 'mention',  label: 'Mentions', types: ['mention'] },
  { key: 'progress', label: 'Progress', types: ['checklist', 'completed', 'created', 'updated', 'photo_updated', 'followup_updated'] },
  { key: 'cost',     label: 'Cost',     types: ['cost_updated'] },
  { key: 'deleted',  label: 'Deleted',  types: ['deleted'] },
]

/**
 * Maps a notification type to the ?focus= query param value used in FindingDetailPage.
 * Clicking a notification navigates to /findings/:id?focus=<section> which
 * scrolls and highlights the relevant section on the detail page.
 */
const FOCUS_MAP = {
  created:          'header',
  updated:          'header',
  photo_updated:    'photos',
  followup_updated: 'followup',
  checklist:        'checklist',
  completed:        'checklist',
  cost_updated:     'cost',
  deadline_updated: 'deadline',
  overdue:          'deadline',
  deadline_warning: 'deadline',
  mention:          'discussion',
}

// How many "already read" notifications to show per "load more" click
const READ_PAGE_SIZE = 10

/**
 * NotificationsPage — the full notification inbox for the logged-in user.
 *
 * Notification sources:
 *   - Stored notifications embedded in findings (system events + @mentions)
 *   - Auto-generated overdue and deadline-warning notifications (computed on the fly)
 *   - Deletion log entries (global audit trail)
 *
 * Unread notifications are shown first in a dedicated section.
 * Read/dismissed notifications are in a collapsed section with pagination.
 * Clicking a notification navigates to the relevant finding section.
 */
export default function NotificationsPage() {
  const { findings, deletionLog } = useFindings()
  const { user } = useAuth()
  const { dismissed, readSet, dismiss, markRead, isRead } = useNotif()
  const navigate = useNavigate()

  // Date range filter — persisted under 'notifications-date'
  const [dateRange, setDateRange] = usePersistentDateFilter('notifications-date')

  // Whether the "already read" section is expanded
  const [showRead, setShowRead]         = useState(false)
  // How many read notifications are currently visible (pagination)
  const [readVisible, setReadVisible]   = useState(READ_PAGE_SIZE)
  // Active category filter pill ('all', 'urgent', 'mention', etc.)
  const [activeCategory, setActiveCategory] = useState('all')

  /**
   * Dismiss a notification (hides it permanently for this user).
   * Stops propagation so the click doesn't also navigate to the finding.
   */
  const deleteNotif = (e, n) => {
    e.stopPropagation()
    dismiss(n.id)
  }

  /** Dismiss all notifications that are already in the "read" list */
  const deleteAllRead = () => {
    dismiss(...read.map(n => n.id))
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
        notifs.push({ id: `auto-od-${f.id}`, type: 'overdue', message: `"${f.name}" is ${Math.abs(days)} days past deadline!`, date: new Date().toISOString().slice(0, 10), findingId: f.id, findingName: f.name, findingType: f.type, auto: true })
      if (days !== null && days > 0 && days <= 3 && !isCompleted(f))
        notifs.push({ id: `auto-warn-${f.id}`, type: 'deadline_warning', message: `"${f.name}" deadline in ${days} days (${formatDate(f.deadline)})`, date: new Date().toISOString().slice(0, 10), findingId: f.id, findingName: f.name, findingType: f.type, auto: true })
      if (isCompleted(f))
        notifs.push({ id: `auto-done-${f.id}`, type: 'completed', message: `"${f.name}" has been completed and archived`, date: f.createdAt, findingId: f.id, findingName: f.name, findingType: f.type, auto: true })
    })

    // Deletion log: persistent cross-user notifications for deleted findings
    ;(deletionLog || []).forEach(n => notifs.push({ ...n, auto: true }))

    return notifs.filter(n => !dismissed.has(n.id)).sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [findings, deletionLog, dismissed, user])

  const dateFiltered = allNotifs.filter(n => matchesDateFilter(n.date, dateRange))

  const catTypes = CATEGORIES.find(c => c.key === activeCategory)?.types
  const filtered = catTypes ? dateFiltered.filter(n => catTypes.includes(n.type)) : dateFiltered

  const unread = filtered.filter(n => !isRead(n))
  const read   = filtered.filter(n =>  isRead(n))

  // Unread count per category for badge display
  const unreadByCategory = useMemo(() => {
    const counts = {}
    CATEGORIES.forEach(c => {
      counts[c.key] = c.types
        ? dateFiltered.filter(n => !isRead(n) && c.types.includes(n.type)).length
        : dateFiltered.filter(n => !isRead(n)).length
    })
    return counts
  }, [dateFiltered, readSet]) // eslint-disable-line react-hooks/exhaustive-deps

  const iconMap = {
    overdue:          { icon: AlertTriangle, color: '#ef4444', bg: '#fef2f2' },
    deadline_warning: { icon: Clock,         color: '#f59e0b', bg: '#fffbeb' },
    completed:        { icon: CheckCircle2,  color: '#10b981', bg: '#ecfdf5' },
    assigned:         { icon: UserCheck,     color: '#6366f1', bg: '#eef2ff' },
    created:          { icon: PlusCircle,    color: '#6366f1', bg: '#eef2ff' },
    updated:          { icon: PencilLine,    color: '#8b5cf6', bg: '#f5f3ff' },
    photo_updated:    { icon: ImageIcon,     color: '#06b6d4', bg: '#ecfeff' },
    followup_updated: { icon: History,       color: '#22d3ee', bg: '#ecfeff' },
    checklist:        { icon: CheckCircle2,  color: '#10b981', bg: '#ecfdf5' },
    cost_updated:     { icon: DollarSign,    color: '#f59e0b', bg: '#fffbeb' },
    deadline_updated: { icon: CalendarClock, color: '#f59e0b', bg: '#fffbeb' },
    mention:          { icon: AtSign,        color: '#6366f1', bg: '#eef2ff' },
    deleted:          { icon: ShieldAlert,   color: '#ef4444', bg: '#fef2f2' },
  }

  const handleClick = (n) => {
    if (!isRead(n)) markRead(n.id)
    if (n.type === 'deleted') { navigate('/findings'); return }
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
            title="Mark as read"
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
          title="Delete notification"
        ><Trash2 size={13} /></button>
      </div>
    )
  }

  const readSlice  = read.slice(0, readVisible)
  const hasMoreRead = readVisible < read.length

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-100 tracking-tight flex items-center gap-3"><Bell size={28} className="text-amber-400" /> Notifications</h1>
        <p className="text-base text-gray-400 mt-1">Deadline, overdue, and status updates for management</p>
      </div>

      <div className="bg-dark-800 border border-dark-700 rounded-2xl px-5 py-4">
        <DateFilter value={dateRange} onChange={setDateRange} />
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(c => {
          const count = unreadByCategory[c.key]
          const active = activeCategory === c.key
          return (
            <button
              key={c.key}
              onClick={() => { setActiveCategory(c.key); setShowRead(false); setReadVisible(READ_PAGE_SIZE) }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition border ${
                active
                  ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                  : 'bg-dark-800 border-dark-700 text-gray-400 hover:text-gray-200 hover:border-dark-600'
              }`}
            >
              {c.label}
              {count > 0 && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${active ? 'bg-indigo-500/30 text-indigo-300' : 'bg-amber-400/20 text-amber-400'}`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {unread.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            Unread
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
              Read ({read.length})
            </button>
            <button
              onClick={deleteAllRead}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-red-400 transition px-2 py-1 rounded-lg hover:bg-red-500/10"
              title="Delete all read notifications"
            >
              <Trash2 size={13} /> Delete all
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
                  Show {Math.min(READ_PAGE_SIZE, read.length - readVisible)} more of {read.length - readVisible} remaining
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-24 text-gray-500"><BellOff size={56} className="mx-auto mb-4 opacity-25" /><p className="text-lg">No notifications in this date range.</p></div>
      )}
    </div>
  )
}
