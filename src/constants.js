import { Shield, CheckCircle2, Leaf, FileCheck, Wrench } from 'lucide-react'

export const FINDING_TYPES = [
  { value: 'safety', label: 'Keselamatan (Safety)', short: 'Safety', color: '#ef4444', bg: '#fef2f2', icon: Shield },
  { value: 'quality', label: 'Kualitas (Quality)', short: 'Quality', color: '#f59e0b', bg: '#fffbeb', icon: CheckCircle2 },
  { value: 'environment', label: 'Lingkungan (Environment)', short: 'Environment', color: '#10b981', bg: '#ecfdf5', icon: Leaf },
  { value: 'compliance', label: 'Kepatuhan (Compliance)', short: 'Compliance', color: '#6366f1', bg: '#eef2ff', icon: FileCheck },
  { value: 'operational', label: 'Operasional', short: 'Operational', color: '#0ea5e9', bg: '#f0f9ff', icon: Wrench },
]

export const PRIORITY_LEVELS = [
  { value: 'critical', label: 'Kritis', color: '#dc2626' },
  { value: 'high', label: 'Tinggi', color: '#ea580c' },
  { value: 'medium', label: 'Sedang', color: '#ca8a04' },
  { value: 'low', label: 'Rendah', color: '#16a34a' },
]

export const getType = (v) => FINDING_TYPES.find(t => t.value === v)
export const getPriority = (v) => PRIORITY_LEVELS.find(p => p.value === v)
export const getProgress = (cl) => (!cl || cl.length === 0) ? 0 : Math.round((cl.filter(c => c.done).length / cl.length) * 100)
export const getDaysLeft = (d) => d ? Math.ceil((new Date(d) - new Date()) / 86400000) : null
export const isCompleted = (f) => (f.checklist || []).length > 0 && (f.checklist || []).every(c => c.done)

export const formatCurrency = (n) => {
  if (!n && n !== 0) return '-'
  return 'Rp ' + Number(n).toLocaleString('id-ID')
}

export const formatDate = (d) => {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

export const formatDateTime = (iso) => {
  if (!iso) return '-'
  const d = new Date(iso)
  // If it's a date-only string (no time info), just show the date
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return formatDate(iso)
  return d.toLocaleString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export const formatRelativeTime = (iso) => {
  const d = new Date(iso)
  const now = new Date()
  const diffMin = Math.floor((now - d) / 60000)
  if (diffMin < 1) return 'Baru saja'
  if (diffMin < 60) return `${diffMin}m lalu`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}j lalu`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `${diffDay}h lalu`
  return formatDate(iso)
}
