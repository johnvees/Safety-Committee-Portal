import { useState } from 'react'
import { CalendarDays, ChevronDown, X } from 'lucide-react'

/** Returns today's date as 'YYYY-MM-DD' in local time */
const today = () => new Date().toISOString().slice(0, 10)

/**
 * Preset quick-select options shown as pill buttons.
 * 'all' means no date range restriction (from/to both empty strings).
 */
const PRESETS = [
  { label: 'Today',      key: 'today' },
  { label: 'This Week',  key: 'week'  },
  { label: 'This Month', key: 'month' },
  { label: 'All',        key: 'all'   },
]

/**
 * Convert a preset key to a { from, to } date range object.
 * All dates are 'YYYY-MM-DD' strings for easy comparison.
 *
 * Week logic: ISO week (Monday–Sunday) — (day + 6) % 7 gives days since last Monday.
 *
 * @param {'today'|'week'|'month'|'all'} key
 * @returns {{ from: string, to: string }}
 */
function getPresetRange(key) {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
  const todayStr = fmt(now)

  if (key === 'today') return { from: todayStr, to: todayStr }
  if (key === 'week') {
    const day = now.getDay() // 0 = Sunday
    const mon = new Date(now)
    mon.setDate(now.getDate() - ((day + 6) % 7)) // roll back to Monday
    return { from: fmt(mon), to: todayStr }
  }
  if (key === 'month') {
    // First day of the current month to today
    return { from: `${now.getFullYear()}-${pad(now.getMonth()+1)}-01`, to: todayStr }
  }
  return { from: '', to: '' } // 'all' — no restriction
}

/**
 * Test whether an ISO date/timestamp string falls within a { from, to } range.
 * Used to filter findings/archive/costs by their createdAt date.
 *
 * @param {string} isoStr - ISO 8601 timestamp or date string
 * @param {{ from: string, to: string }} range - Date range (empty strings = no bound)
 * @returns {boolean}
 */
export function matchesDateFilter(isoStr, { from, to }) {
  if (!from && !to) return true              // no filter active — everything matches
  const date = isoStr ? isoStr.slice(0, 10) : '' // extract just the date part
  if (from && date < from) return false
  if (to   && date > to)   return false
  return true
}

/**
 * DateFilter — a reusable date range picker component.
 *
 * Shows preset quick-select pill buttons (Today / This Week / This Month / All)
 * and a "Custom" button that expands into two date inputs (from / to).
 *
 * Props:
 *   value    { from: string, to: string } — current active range
 *   onChange Function called with the new range when the user changes selection
 */
export default function DateFilter({ value, onChange }) {
  // Whether the custom date input row is currently visible
  const [showCustom, setShowCustom] = useState(false)

  // Detect which preset pill (if any) matches the current value, or 'custom'
  const activePreset = PRESETS.find(p => {
    if (p.key === 'all') return !value.from && !value.to
    const r = getPresetRange(p.key)
    return value.from === r.from && value.to === r.to
  })?.key ?? 'custom'

  /** Apply a preset and close the custom input panel */
  const applyPreset = (key) => {
    setShowCustom(false)
    onChange(getPresetRange(key))
  }

  // Shared Tailwind class for the custom date <input> elements
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

      {/* Custom range toggle button */}
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

      {/* Custom date inputs — shown when the "Custom" button is toggled */}
      {showCustom && (
        <div className="flex items-center gap-2 flex-wrap">
          {/* "from" date — capped at the "to" date so from ≤ to */}
          <input type="date" className={inp} value={value.from} max={value.to || today()}
            onChange={e => onChange({ ...value, from: e.target.value })} />
          <span className="text-gray-500 text-sm">–</span>
          {/* "to" date — minimum is the "from" date, maximum is today */}
          <input type="date" className={inp} value={value.to} min={value.from} max={today()}
            onChange={e => onChange({ ...value, to: e.target.value })} />
          {/* Clear button — only shown when at least one bound is set */}
          {(value.from || value.to) && (
            <button onClick={() => onChange({ from: '', to: '' })}
              className="text-gray-500 hover:text-gray-200 p-1 transition">
              <X size={16} />
            </button>
          )}
        </div>
      )}

      {/* When custom is selected but the panel is hidden, show the active range as text */}
      {activePreset === 'custom' && !showCustom && (value.from || value.to) && (
        <span className="text-xs text-gray-500">
          {value.from || '...'} → {value.to || '...'}
        </span>
      )}
    </div>
  )
}

/**
 * Returns the date range for "Today" (from = to = today's date).
 * Used as the default initial filter state on pages that persist the filter.
 */
export function todayFilter() {
  return getPresetRange('today')
}

/**
 * Custom hook — like useState for a { from, to } date range, but persists
 * the value to sessionStorage. This means the selected date range survives
 * navigating away from the page and coming back, but resets on a new session.
 *
 * @param {string} key - A unique storage key per page (e.g. 'findings-date', 'archive-date')
 * @returns {[{ from: string, to: string }, Function]} [value, setValue]
 */
export function usePersistentDateFilter(key) {
  const [value, setValueRaw] = useState(() => {
    // Try to restore the last value from sessionStorage on first render
    try {
      const stored = sessionStorage.getItem(key)
      if (stored) return JSON.parse(stored)
    } catch {}
    return todayFilter() // default to today if nothing is stored
  })

  /** Update state and write to sessionStorage in one call */
  const setValue = (next) => {
    setValueRaw(next)
    try { sessionStorage.setItem(key, JSON.stringify(next)) } catch {}
  }

  return [value, setValue]
}
