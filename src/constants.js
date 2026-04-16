import { Shield, CheckCircle2, Leaf, FileCheck, Wrench } from 'lucide-react'

/**
 * Master list of finding categories.
 * Each entry defines the display label, badge color, background color, and icon
 * used consistently across all pages (cards, filters, charts).
 * value: the string stored in the database
 */
export const FINDING_TYPES = [
  { value: 'safety',      label: 'Safety',      short: 'Safety',      color: '#ef4444', bg: '#fef2f2', icon: Shield },
  { value: 'quality',     label: 'Quality',     short: 'Quality',     color: '#f59e0b', bg: '#fffbeb', icon: CheckCircle2 },
  { value: 'environment', label: 'Environment', short: 'Environment', color: '#10b981', bg: '#ecfdf5', icon: Leaf },
  { value: 'compliance',  label: 'Compliance',  short: 'Compliance',  color: '#6366f1', bg: '#eef2ff', icon: FileCheck },
  { value: 'operational', label: 'Operational', short: 'Operational', color: '#0ea5e9', bg: '#f0f9ff', icon: Wrench },
]

/**
 * Priority levels for findings.
 * Ordered from most to least urgent.
 * color is used for badge text and left-border accents on cards.
 */
export const PRIORITY_LEVELS = [
  { value: 'critical', label: 'Critical', color: '#dc2626' },
  { value: 'high',     label: 'High',     color: '#ea580c' },
  { value: 'medium',   label: 'Medium',   color: '#ca8a04' },
  { value: 'low',      label: 'Low',      color: '#16a34a' },
]

/**
 * Look up a FINDING_TYPES entry by its value string.
 * Returns undefined if the value doesn't match (e.g. legacy data).
 * @param {string} v - e.g. 'safety'
 */
export const getType = (v) => FINDING_TYPES.find(t => t.value === v)

/**
 * Look up a PRIORITY_LEVELS entry by its value string.
 * @param {string} v - e.g. 'high'
 */
export const getPriority = (v) => PRIORITY_LEVELS.find(p => p.value === v)

/**
 * Calculate checklist completion percentage (0–100).
 * Returns 0 if the checklist is empty or undefined.
 * @param {Array} cl - Array of checklist items with a `done` boolean field
 */
export const getProgress = (cl) =>
  (!cl || cl.length === 0) ? 0 : Math.round((cl.filter(c => c.done).length / cl.length) * 100)

/**
 * Calculate how many days remain until the given deadline date.
 * Negative = overdue, 0 = due today, positive = days remaining.
 * Returns null if no deadline is set.
 * @param {string} d - ISO date string (e.g. '2025-06-01')
 */
export const getDaysLeft = (d) =>
  d ? Math.ceil((new Date(d) - new Date()) / 86400000) : null

/**
 * A finding is considered "completed" (and will appear in the Archive)
 * when it has at least one checklist item and every item is checked done.
 * @param {object} f - Finding object
 */
export const isCompleted = (f) =>
  (f.checklist || []).length > 0 && (f.checklist || []).every(c => c.done)

/**
 * Format a number as Indonesian Rupiah.
 * Returns '-' for null/undefined values.
 * Example: 1500000 → "Rp 1,500,000"
 * @param {number|null} n
 */
export const formatCurrency = (n) => {
  if (!n && n !== 0) return '-'
  return 'Rp ' + Number(n).toLocaleString('en-US')
}

/**
 * Format a date string to a readable short form.
 * Example: '2025-06-01' → "Jun 1, 2025"
 * Returns '-' if d is falsy.
 * @param {string} d - ISO date string or anything parseable by new Date()
 */
export const formatDate = (d) => {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

/**
 * Format an ISO timestamp to a readable date+time string.
 * If the string is date-only (no time component), only the date is shown.
 * Example: '2025-06-01T10:30:00Z' → "Jun 1, 2025, 10:30 AM"
 * Returns '-' if iso is falsy.
 * @param {string} iso - ISO 8601 timestamp
 */
export const formatDateTime = (iso) => {
  if (!iso) return '-'
  const d = new Date(iso)
  // If it's a date-only string (no time info), just show the date
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return formatDate(iso)
  return d.toLocaleString('en-US', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

/**
 * Format a timestamp as a human-readable relative time string.
 * Examples: "Just now", "5m ago", "3h ago", "2d ago"
 * Falls back to the short date format for anything older than 7 days.
 * @param {string} iso - ISO 8601 timestamp
 */
export const formatRelativeTime = (iso) => {
  const d = new Date(iso)
  const now = new Date()
  // Difference in minutes
  const diffMin = Math.floor((now - d) / 60000)
  if (diffMin < 1)  return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24)  return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7)  return `${diffDay}d ago`
  return formatDate(iso) // older than a week → show full date
}
