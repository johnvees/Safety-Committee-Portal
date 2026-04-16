import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFindings } from '../context/FindingsContext';
import { getType, formatCurrency, isCompleted } from '../constants';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  X,
  ChevronDown,
  ChevronRight,
  Eye,
} from 'lucide-react';
import DateFilter, {
  matchesDateFilter,
  usePersistentDateFilter,
} from '../components/DateFilter';

/**
 * CostsPage — a financial summary of all findings that have repair cost data.
 *
 * Shows:
 *   - Summary cards: total estimate, total actual, number of findings with cost,
 *     number of over-budget findings
 *   - A table with one row per finding, expandable to show the cost line-item breakdown
 *   - Variance (actual − estimate) per finding and as a total
 *
 * Only findings with costRequired = true appear here.
 * Supports date range filter (persisted) and text search.
 */
export default function CostsPage() {
  const { findings } = useFindings();
  const navigate = useNavigate();

  // Date range filter — persisted to sessionStorage under 'costs-date'
  const [dateRange, setDateRange] = usePersistentDateFilter('costs-date');

  // Text search — matches finding name, area, or cost notes
  const [search, setSearch] = useState('');

  // Tracks which table rows have been expanded to show the cost breakdown
  // Shape: { [findingId]: boolean }
  const [expanded, setExpanded] = useState({});

  // ── Derived data ───────────────────────────────────────────────────────────
  // Findings with repair costs that match the date range and search query
  const withCost = findings.filter((f) => {
    if (!f.costRequired || !matchesDateFilter(f.createdAt, dateRange)) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      f.name.toLowerCase().includes(q) ||
      (f.area || '').toLowerCase().includes(q) ||
      (f.costNotes || '').toLowerCase().includes(q)
    );
  });

  // Sum of all estimated costs across visible findings
  const totalEst = withCost.reduce((s, f) => s + (f.estimatedCost || 0), 0);

  // Only findings that also have actual cost data recorded
  const withActual = withCost.filter((f) => f.actualCost);

  // Sum of actual costs (only for findings that have it)
  const totalAct = withActual.reduce((s, f) => s + f.actualCost, 0);

  // Total variance: positive = over budget overall, negative = under budget
  const totalDiff = withActual.reduce(
    (s, f) => s + (f.actualCost - (f.estimatedCost || 0)),
    0,
  );

  // Findings where actual cost exceeded the original estimate
  const overBudget = withCost.filter(
    (f) => f.actualCost && f.actualCost > f.estimatedCost,
  );

  /**
   * Toggle the expanded/collapsed state of a cost detail row.
   * @param {string} id - Finding ID
   */
  const toggleExpand = (id) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-100 tracking-tight flex items-center gap-3">
          <DollarSign size={28} className="text-amber-400" /> Cost Report
        </h1>
        <p className="text-base text-gray-400 mt-1">
          Track estimated & actual repair costs
        </p>
      </div>

      {/* Date Filter */}
      <div className="bg-dark-800 border border-dark-700 rounded-2xl px-5 py-4">
        <DateFilter value={dateRange} onChange={setDateRange} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            l: 'Total Estimate',
            v: formatCurrency(totalEst),
            c: '#f59e0b',
          },
          {
            l: 'Actual',
            v: formatCurrency(totalAct),
            c: '#10b981',
          },
          {
            l: 'With Cost',
            v: `${withCost.length} findings`,
            c: '#6366f1',
          },
          {
            l: 'Over Budget',
            v: `${overBudget.length} findings`,
            c: '#ef4444',
          },
        ].map((s, i) => (
          <div
            key={i}
            className="bg-dark-800 border border-dark-700 rounded-2xl p-5 relative overflow-hidden"
          >
            <div
              className="absolute top-0 left-0 right-0 h-1"
              style={{ background: s.c }}
            />
            <p className="text-xl font-extrabold text-gray-100">{s.v}</p>
            <p className="text-sm text-gray-400 uppercase tracking-wider mt-1 font-semibold">
              {s.l}
            </p>
          </div>
        ))}
      </div>

      {overBudget.length > 0 && (
        <div className="bg-red-500/8 border border-red-500/15 rounded-xl px-5 py-4 flex items-center gap-3">
          <AlertTriangle size={20} className="text-red-400 shrink-0" />
          <p className="text-base text-red-300">
            <span className="font-bold">{overBudget.length} findings</span>{' '}
            exceed the initial cost estimate.
          </p>
        </div>
      )}

      <div className="bg-dark-800 border border-dark-700 rounded-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-dark-700 flex items-center justify-between gap-4 flex-wrap">
          <h3 className="text-lg font-bold text-gray-100">
            Cost Detail per Finding
          </h3>
          <div className="flex items-center gap-2 bg-dark-900 border border-dark-700 rounded-xl px-4 focus-within:border-indigo-500 transition w-64">
            <Search size={18} className="text-gray-500 shrink-0" />
            <input
              className="bg-transparent border-none outline-none text-sm text-gray-200 w-full placeholder-gray-500"
              placeholder="Search findings, area, notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-gray-400 hover:text-gray-200"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
        {withCost.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <DollarSign size={44} className="mx-auto mb-3 opacity-25" />
            <p className="text-base">
              No findings with costs in this range.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-dark-700 text-sm text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-4 font-bold w-8"></th>
                  <th className="px-4 py-4 font-bold">Finding</th>
                  <th className="px-5 py-4 font-bold">Area</th>
                  <th className="px-5 py-4 font-bold text-right">Estimate</th>
                  <th className="px-5 py-4 font-bold text-right">Actual</th>
                  <th className="px-5 py-4 font-bold text-right">Variance</th>
                  <th className="px-5 py-4 font-bold">Status</th>
                  <th className="px-5 py-4 font-bold">Notes</th>
                  <th className="px-4 py-4 font-bold"></th>
                </tr>
              </thead>
              <tbody>
                {withCost.map((f) => {
                  const type = getType(f.type);
                  const diff = f.actualCost
                    ? f.actualCost - f.estimatedCost
                    : null;
                  const done = isCompleted(f);
                  const isOpen = !!expanded[f.id];
                  const hasItems =
                    (f.costItems || []).length > 0 ||
                    (f.actualCostItems || []).length > 0;

                  return (
                    <>
                      <tr
                        key={f.id}
                        className={`border-b border-dark-700/50 transition ${hasItems ? 'cursor-pointer hover:bg-dark-900/50' : ''} ${isOpen ? 'bg-dark-900/30' : ''}`}
                        onClick={() => hasItems && toggleExpand(f.id)}
                      >
                        <td className="px-6 py-4 text-gray-500">
                          {hasItems ? (
                            isOpen ? (
                              <ChevronDown size={16} />
                            ) : (
                              <ChevronRight size={16} />
                            )
                          ) : null}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ background: type?.color }}
                            />
                            <span className="text-base font-medium text-gray-200">
                              {f.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-base text-gray-400">
                          {f.area || '-'}
                        </td>
                        <td className="px-5 py-4 text-base text-amber-300 text-right font-mono font-semibold">
                          {formatCurrency(f.estimatedCost)}
                        </td>
                        <td className="px-5 py-4 text-base text-right font-mono">
                          {f.actualCost ? (
                            <span className="text-emerald-300 font-semibold">
                              {formatCurrency(f.actualCost)}
                            </span>
                          ) : (
                            <span className="text-gray-600">-</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-base text-right font-mono">
                          {diff !== null ? (
                            <span
                              className={`flex items-center justify-end gap-1 ${diff > 0 ? 'text-red-400' : diff < 0 ? 'text-emerald-400' : 'text-gray-400'}`}
                            >
                              {diff > 0 ? (
                                <ArrowUpRight size={16} />
                              ) : diff < 0 ? (
                                <ArrowDownRight size={16} />
                              ) : null}
                              {formatCurrency(Math.abs(diff))}
                            </span>
                          ) : (
                            <span className="text-gray-600">-</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${done ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}
                          >
                            {done ? (
                              <CheckCircle2 size={12} />
                            ) : (
                              <Clock size={12} />
                            )}
                            {done ? 'Completed' : 'Active'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-base text-gray-500 max-w-[200px] truncate">
                          {f.costNotes || '-'}
                        </td>
                        <td className="px-4 py-4">
                          <button
                            onClick={e => { e.stopPropagation(); navigate(`/findings/${f.id}`); }}
                            className="p-2 rounded-lg text-gray-600 hover:text-indigo-400 hover:bg-indigo-500/10 transition"
                            title="View finding detail"
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>

                      {isOpen && hasItems && (() => {
                        const estItems = f.costItems || [];
                        const actItems = f.actualCostItems || [];
                        const fDiff = f.actualCost != null ? (f.actualCost - (f.estimatedCost || 0)) : null;
                        return (
                          <tr key={`${f.id}-detail`} className="border-b border-dark-700/30 bg-dark-900/20">
                            <td colSpan={9} className="px-8 py-5">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                {/* Estimated cost items */}
                                <div>
                                  <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <TrendingUp size={14} /> Estimated Cost Breakdown
                                  </p>
                                  {estItems.length === 0 ? (
                                    <p className="text-sm text-gray-600 italic">No breakdown available.</p>
                                  ) : (
                                    <table className="w-full text-sm">
                                      <thead>
                                        <tr className="text-gray-500 uppercase text-xs tracking-wider border-b border-dark-700">
                                          <th className="pb-2 text-left font-semibold">Item</th>
                                          <th className="pb-2 text-left font-semibold">SKU</th>
                                          <th className="pb-2 text-center font-semibold w-16">Qty</th>
                                          <th className="pb-2 text-right font-semibold">Unit Price</th>
                                          <th className="pb-2 text-right font-semibold">Total</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {estItems.map((item, idx) => (
                                          <tr key={idx} className="border-b border-dark-700/30">
                                            <td className="py-2 text-gray-300">{item.description || item.name || '-'}</td>
                                            <td className="py-2 text-gray-500 font-mono text-xs">{item.sku || '-'}</td>
                                            <td className="py-2 text-center text-gray-400">{item.qty}</td>
                                            <td className="py-2 text-right text-gray-400 font-mono">{formatCurrency(item.unitCost || 0)}</td>
                                            <td className="py-2 text-right text-amber-300 font-mono font-semibold">{formatCurrency(item.totalCost || 0)}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                      <tfoot>
                                        <tr className="border-t border-dark-600">
                                          <td colSpan={4} className="pt-2 text-gray-400 font-bold text-xs uppercase">Total Estimate</td>
                                          <td className="pt-2 text-right text-amber-300 font-mono font-extrabold">{formatCurrency(f.estimatedCost || 0)}</td>
                                        </tr>
                                      </tfoot>
                                    </table>
                                  )}
                                </div>

                                {/* Actual cost items */}
                                <div>
                                  <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <TrendingDown size={14} /> Actual Cost Breakdown
                                  </p>
                                  {actItems.length === 0 ? (
                                    <p className="text-sm text-gray-600 italic">No actual costs recorded yet.</p>
                                  ) : (
                                    <table className="w-full text-sm">
                                      <thead>
                                        <tr className="text-gray-500 uppercase text-xs tracking-wider border-b border-dark-700">
                                          <th className="pb-2 text-left font-semibold">Item</th>
                                          <th className="pb-2 text-left font-semibold">SKU</th>
                                          <th className="pb-2 text-center font-semibold w-16">Qty</th>
                                          <th className="pb-2 text-right font-semibold">Unit Price</th>
                                          <th className="pb-2 text-right font-semibold">Total</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {actItems.map((item, idx) => (
                                          <tr key={idx} className="border-b border-dark-700/30">
                                            <td className="py-2 text-gray-300">{item.description || item.name || '-'}</td>
                                            <td className="py-2 text-gray-500 font-mono text-xs">{item.sku || '-'}</td>
                                            <td className="py-2 text-center text-gray-400">{item.qty}</td>
                                            <td className="py-2 text-right text-gray-400 font-mono">{formatCurrency(item.unitCost || 0)}</td>
                                            <td className="py-2 text-right text-emerald-300 font-mono font-semibold">{formatCurrency(item.totalCost || 0)}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                      <tfoot>
                                        <tr className="border-t border-dark-600">
                                          <td colSpan={4} className="pt-2 text-gray-400 font-bold text-xs uppercase">Total Actual</td>
                                          <td className="pt-2 text-right text-emerald-300 font-mono font-extrabold">{formatCurrency(f.actualCost || 0)}</td>
                                        </tr>
                                      </tfoot>
                                    </table>
                                  )}
                                </div>
                              </div>

                              {/* Selisih summary */}
                              {fDiff !== null && (
                                <div className="mt-4 pt-4 border-t border-dark-700 flex items-center justify-end gap-3">
                                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Variance</span>
                                  <span className={`flex items-center gap-1 text-sm font-extrabold font-mono ${fDiff > 0 ? 'text-red-400' : fDiff < 0 ? 'text-emerald-400' : 'text-gray-400'}`}>
                                    {fDiff > 0 ? <ArrowUpRight size={15} /> : fDiff < 0 ? <ArrowDownRight size={15} /> : null}
                                    {formatCurrency(Math.abs(fDiff))}
                                    <span className="text-xs font-semibold ml-1">
                                      {fDiff > 0 ? '(over budget)' : fDiff < 0 ? '(under budget)' : '(on budget)'}
                                    </span>
                                  </span>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })()}
                    </>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-dark-600 bg-dark-900/50">
                  <td
                    colSpan={3}
                    className="px-6 py-4 text-base font-extrabold text-gray-200 uppercase"
                  >
                    Total
                  </td>
                  <td className="px-5 py-4 text-base font-extrabold text-amber-300 text-right font-mono">
                    {formatCurrency(totalEst)}
                  </td>
                  <td className="px-5 py-4 text-base font-extrabold text-emerald-300 text-right font-mono">
                    {totalAct > 0 ? formatCurrency(totalAct) : '-'}
                  </td>
                  <td className="px-5 py-4 text-base font-extrabold text-right font-mono">
                    {withActual.length > 0 ? (
                      <span className={`flex items-center justify-end gap-1 ${totalDiff > 0 ? 'text-red-400' : totalDiff < 0 ? 'text-emerald-400' : 'text-gray-400'}`}>
                        {totalDiff > 0 ? <ArrowUpRight size={16} /> : totalDiff < 0 ? <ArrowDownRight size={16} /> : null}
                        {formatCurrency(Math.abs(totalDiff))}
                      </span>
                    ) : '-'}
                  </td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
