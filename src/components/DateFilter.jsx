import { useState } from 'react'
import { CalendarDays, ChevronDown, X } from 'lucide-react'

const today = () => new Date().toISOString().slice(0, 10)

const PRESETS = [
  { label: 'Today', key: 'today' },
  { label: 'This Week', key: 'week' },
  { label: 'This Month', key: 'month' },
  { label: 'All', key: 'all' },
]

function getPresetRange(key) {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
  const todayStr = fmt(now)

  if (key === 'today') return { from: todayStr, to: todayStr }
  if (key === 'week') {
    const day = now.getDay() // 0=Sun
    const mon = new Date(now); mon.setDate(now.getDate() - ((day+6)%7))
    return { from: fmt(mon), to: todayStr }
  }
  if (key === 'month') {
    return { from: `${now.getFullYear()}-${pad(now.getMonth()+1)}-01`, to: todayStr }
  }
  return { from: '', to: '' } // all
}

/** matchesDateFilter(isoString, { from, to }) — true if the record falls within the range */
export function matchesDateFilter(isoStr, { from, to }) {
  if (!from && !to) return true
  const date = isoStr ? isoStr.slice(0, 10) : ''
  if (from && date < from) return false
  if (to   && date > to)   return false
  return true
}

export default function DateFilter({ value, onChange }) {
  const [showCustom, setShowCustom] = useState(false)

  const activePreset = PRESETS.find(p => {
    if (p.key === 'all') return !value.from && !value.to
    const r = getPresetRange(p.key)
    return value.from === r.from && value.to === r.to
  })?.key ?? 'custom'

  const applyPreset = (key) => {
    setShowCustom(false)
    onChange(getPresetRange(key))
  }

  const inp = "bg-dark-900 border border-dark-700 rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none"

  return (
    <div className="flex flex-wrap items-center gap-2">
      <CalendarDays size={18} className="text-gray-500 shrink-0" />

      {/* Preset pills */}
      {PRESETS.map(p => (
        <button
          key={p.key}
          onClick={() => applyPreset(p.key)}
          className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition ${
            activePreset === p.key
              ? 'bg-indigo-500/20 text-indigo-300'
              : 'bg-dark-800 text-gray-400 hover:text-gray-200'
          }`}
        >
          {p.label}
        </button>
      ))}

      {/* Custom range toggle */}
      <button
        onClick={() => setShowCustom(s => !s)}
        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition ${
          activePreset === 'custom'
            ? 'bg-indigo-500/20 text-indigo-300'
            : 'bg-dark-800 text-gray-400 hover:text-gray-200'
        }`}
      >
        Custom <ChevronDown size={14} className={`transition-transform ${showCustom ? 'rotate-180' : ''}`} />
      </button>

      {/* Custom date inputs */}
      {showCustom && (
        <div className="flex items-center gap-2 flex-wrap">
          <input type="date" className={inp} value={value.from} max={value.to || today()}
            onChange={e => onChange({ ...value, from: e.target.value })} />
          <span className="text-gray-500 text-sm">–</span>
          <input type="date" className={inp} value={value.to} min={value.from} max={today()}
            onChange={e => onChange({ ...value, to: e.target.value })} />
          {(value.from || value.to) && (
            <button onClick={() => onChange({ from: '', to: '' })}
              className="text-gray-500 hover:text-gray-200 p-1 transition">
              <X size={16} />
            </button>
          )}
        </div>
      )}

      {/* Show active custom range label */}
      {activePreset === 'custom' && !showCustom && (value.from || value.to) && (
        <span className="text-xs text-gray-500">
          {value.from || '...'} → {value.to || '...'}
        </span>
      )}
    </div>
  )
}

/** Returns initial filter state defaulting to today */
export function todayFilter() {
  return getPresetRange('today')
}

/**
 * Like useState but persists to sessionStorage so the value survives
 * navigation away from and back to the page.
 * key: a unique string per page, e.g. 'findings-date' or 'archive-date'
 */
export function usePersistentDateFilter(key) {
  const [value, setValueRaw] = useState(() => {
    try {
      const stored = sessionStorage.getItem(key)
      if (stored) return JSON.parse(stored)
    } catch {}
    return todayFilter()
  })

  const setValue = (next) => {
    setValueRaw(next)
    try { sessionStorage.setItem(key, JSON.stringify(next)) } catch {}
  }

  return [value, setValue]
}
