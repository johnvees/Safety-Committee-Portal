import { Link } from 'react-router-dom'
import { AlertTriangle, Clock, CheckCircle2, DollarSign, ArrowRight, TrendingUp, Bell, MapPin, Users, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { useFindings } from '../context/FindingsContext'
import { FINDING_TYPES, getType, getDaysLeft, isCompleted, formatCurrency } from '../constants'
import DateFilter, { matchesDateFilter, usePersistentDateFilter } from '../components/DateFilter'
import { useNotif } from '../context/NotifContext'

export default function DashboardPage() {
  const { findings, loading } = useFindings()
  const { unreadCount: unreadNotifs } = useNotif()
  const [dateRange, setDateRange] = usePersistentDateFilter('dashboard-date')

  const filtered = findings.filter(f => matchesDateFilter(f.createdAt, dateRange))
  const active = filtered.filter(f => !isCompleted(f))
  const archived = filtered.filter(f => isCompleted(f))
  const overdue = active.filter(f => getDaysLeft(f.deadline) !== null && getDaysLeft(f.deadline) < 0)
  const totalEstCost = filtered.reduce((s, f) => s + (f.estimatedCost || 0), 0)
  const withActual = filtered.filter(f => f.actualCost)
  const totalActCost = withActual.reduce((s, f) => s + f.actualCost, 0)
  const totalCostDiff = withActual.reduce((s, f) => s + (f.actualCost - (f.estimatedCost || 0)), 0)
  const areas = [...new Set(filtered.map(f => f.area).filter(Boolean))]
  const typeBreakdown = FINDING_TYPES.map(t => ({ ...t, count: filtered.filter(f => f.type === t.value).length, activeCount: active.filter(f => f.type === t.value).length }))

  if (loading) return <div className="flex items-center justify-center py-32 text-gray-400 text-lg"><Clock size={28} className="animate-spin mr-3" /> Loading data...</div>

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-100 tracking-tight">Dashboard</h1>
          <p className="text-base text-gray-400 mt-1">Finding summary & overall status</p>
        </div>
      </div>

      {/* Date Filter */}
      <div className="bg-dark-800 border border-dark-700 rounded-2xl px-5 py-4">
        <DateFilter value={dateRange} onChange={setDateRange} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Findings', num: filtered.length, color: '#6366f1', icon: TrendingUp, sub: `${active.length} active` },
          { label: 'Overdue', num: overdue.length, color: '#ef4444', icon: AlertTriangle, sub: 'Needs immediate action' },
          { label: 'Completed', num: archived.length, color: '#10b981', icon: CheckCircle2, sub: `${filtered.length > 0 ? Math.round((archived.length / filtered.length) * 100) : 0}% completed` },
        ].map((s, i) => {
          const Icon = s.icon
          return (
            <div key={i} className="bg-dark-800 border border-dark-700 rounded-2xl p-6 relative overflow-hidden hover:border-dark-600 transition">
              <div className="absolute top-0 left-0 right-0 h-1" style={{ background: s.color }} />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-4xl font-extrabold text-gray-100 leading-none">{s.num}</p>
                  <p className="text-sm text-gray-400 mt-2 uppercase tracking-wider font-semibold">{s.label}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{s.sub}</p>
                </div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center opacity-20" style={{ background: s.color }}><Icon size={24} className="text-white" /></div>
              </div>
            </div>
          )
        })}
        {/* Biaya card with selisih */}
        <div className="bg-dark-800 border border-dark-700 rounded-2xl p-6 relative overflow-hidden hover:border-dark-600 transition">
          <div className="absolute top-0 left-0 right-0 h-1" style={{ background: '#f59e0b' }} />
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xl font-extrabold text-gray-100 leading-none">{formatCurrency(totalEstCost)}</p>
              <p className="text-sm text-gray-400 mt-2 uppercase tracking-wider font-semibold">Est. Cost</p>
              <p className="text-sm text-gray-500 mt-0.5">Actual: {formatCurrency(totalActCost)}</p>
              {withActual.length > 0 && (
                <p className={`text-sm font-bold mt-1.5 flex items-center gap-1 ${totalCostDiff > 0 ? 'text-red-400' : totalCostDiff < 0 ? 'text-emerald-400' : 'text-gray-400'}`}>
                  {totalCostDiff > 0 ? <ArrowUpRight size={14} /> : totalCostDiff < 0 ? <ArrowDownRight size={14} /> : null}
                  Variance: {formatCurrency(Math.abs(totalCostDiff))}
                </p>
              )}
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center opacity-20" style={{ background: '#f59e0b' }}><DollarSign size={24} className="text-white" /></div>
          </div>
        </div>
      </div>

      {/* Notification Banner */}
      {unreadNotifs > 0 && (
        <Link to="/notifications" className="flex items-center gap-4 bg-amber-500/8 border border-amber-500/15 rounded-xl px-5 py-4 hover:bg-amber-500/12 transition group">
          <Bell size={22} className="text-amber-400" />
          <p className="text-base text-amber-300/90 flex-1"><span className="font-bold text-amber-300">{unreadNotifs} unread notifications</span> — including deadlines and status updates.</p>
          <ArrowRight size={20} className="text-amber-400 group-hover:translate-x-1 transition-transform" />
        </Link>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Type Breakdown */}
        <div className="bg-dark-800 border border-dark-700 rounded-2xl p-6 lg:col-span-2">
          <h3 className="text-lg font-bold text-gray-100 mb-5">Findings by Category</h3>
          <div className="space-y-4">
            {typeBreakdown.map(t => {
              const Icon = t.icon
              const pct = filtered.length > 0 ? (t.count / filtered.length) * 100 : 0
              return (
                <div key={t.value} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: t.color + '18', color: t.color }}><Icon size={20} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-base font-semibold text-gray-200">{t.short}</span>
                      <span className="text-sm text-gray-400">{t.count} total ({t.activeCount} active)</span>
                    </div>
                    <div className="h-2.5 bg-dark-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: t.color }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Area Visibility */}
        <div className="bg-dark-800 border border-dark-700 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-gray-100 mb-5 flex items-center gap-2"><MapPin size={20} className="text-indigo-400" /> Affected Areas</h3>
          {areas.length === 0 ? (
            <p className="text-base text-gray-500">No areas in this date range.</p>
          ) : (
            <div className="space-y-3">
              {areas.map(area => {
                const count = filtered.filter(f => f.area === area).length
                const activeCount = active.filter(f => f.area === area).length
                return (
                  <div key={area} className="flex items-center justify-between px-4 py-3 bg-dark-900 border border-dark-700 rounded-xl">
                    <span className="text-base font-medium text-gray-200">{area}</span>
                    <div className="flex items-center gap-2">
                      {activeCount > 0 && <span className="text-xs font-bold text-amber-400 bg-amber-500/15 px-2 py-1 rounded-lg">{activeCount} active</span>}
                      <span className="text-sm text-gray-500">{count} total</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          <p className="text-sm text-gray-500 mt-4 flex items-center gap-1.5"><Users size={16} /> All areas can view all findings</p>
        </div>
      </div>

      {/* Overdue */}
      {overdue.length > 0 && (
        <div className="bg-red-500/5 border border-red-500/15 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-red-300 mb-4 flex items-center gap-2"><AlertTriangle size={20} /> Overdue Findings</h3>
          <div className="space-y-3">
            {overdue.slice(0, 5).map(f => {
              const type = getType(f.type)
              const days = Math.abs(getDaysLeft(f.deadline))
              return (
                <Link key={f.id} to={`/findings/${f.id}`} className="flex items-center gap-4 px-4 py-3.5 bg-dark-900/80 border border-dark-700 rounded-xl hover:border-red-500/30 transition group">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ background: type?.color }} />
                  <span className="text-base text-gray-200 flex-1 truncate font-medium">{f.name}</span>
                  <span className="text-sm text-red-400 font-bold shrink-0">{days} days overdue</span>
                  <ArrowRight size={18} className="text-gray-600 group-hover:text-red-400 transition" />
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          <TrendingUp size={56} className="mx-auto mb-4 opacity-25" />
          <p className="text-lg">No findings in this date range.</p>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { to: '/findings', label: 'View All Findings', icon: '📋' },
          { to: '/archive', label: 'Completed Archive', icon: '📦' },
          { to: '/costs', label: 'Cost Report', icon: '💰' },
          { to: '/guidelines', label: 'Guidelines & Recommendations', icon: '📖' },
        ].map(link => (
          <Link key={link.to} to={link.to} className="bg-dark-800 border border-dark-700 rounded-xl p-5 text-center hover:bg-dark-700 hover:border-dark-600 transition group">
            <span className="text-3xl">{link.icon}</span>
            <p className="text-sm font-semibold text-gray-400 mt-3 group-hover:text-gray-200 transition">{link.label}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
