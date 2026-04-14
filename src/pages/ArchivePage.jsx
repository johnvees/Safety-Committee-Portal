import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFindings } from '../context/FindingsContext';
import {
  isCompleted,
  getType,
  getPriority,
  formatDate,
  formatCurrency,
} from '../constants';
import {
  Archive,
  CheckCircle2,
  RotateCcw,
  MessageCircle,
  DollarSign,
  BookOpen,
  MapPin,
  Calendar,
  ArrowRight,
  Search,
  X,
} from 'lucide-react';
import DateFilter, {
  matchesDateFilter,
  usePersistentDateFilter,
} from '../components/DateFilter';

export default function ArchivePage() {
  const { findings, updateFinding, showToast } = useFindings();
  const [dateRange, setDateRange] = usePersistentDateFilter('archive-date');
  const [search, setSearch] = useState('');
  const archived = findings.filter(
    (f) =>
      isCompleted(f) &&
      matchesDateFilter(f.createdAt, dateRange) &&
      (f.name.toLowerCase().includes(search.toLowerCase()) ||
        (f.description || '').toLowerCase().includes(search.toLowerCase())),
  );

  const restore = async (f) => {
    const cl = (f.checklist || []).map((c, i, a) =>
      i === a.length - 1 ? { ...c, done: false } : c,
    );
    try {
      await updateFinding(f.id, { ...f, checklist: cl });
      showToast(`"${f.name}" dikembalikan`, 'info');
    } catch {
      showToast('Gagal', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-100 tracking-tight flex items-center gap-3">
          <Archive size={28} className="text-emerald-400" /> Arsip Temuan
          Selesai
        </h1>
        <p className="text-base text-gray-400 mt-1">
          {archived.length} temuan ditampilkan
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex-1 bg-dark-800 border border-dark-700 rounded-2xl px-5 py-4">
          <DateFilter value={dateRange} onChange={setDateRange} />
        </div>
        <div className="flex items-center gap-2 bg-dark-900 border border-dark-700 rounded-xl px-4 focus-within:border-indigo-500 transition w-72">
          <Search size={20} className="text-gray-500 shrink-0" />
          <input
            className="bg-transparent border-none outline-none text-base text-gray-200 w-full placeholder-gray-500"
            placeholder="Cari arsip..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="text-gray-400 hover:text-gray-200 p-1"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {archived.length === 0 && (
        <div className="text-center py-24 text-gray-500">
          <CheckCircle2 size={56} className="mx-auto mb-4 opacity-25" />
          <p className="text-lg">Belum ada temuan selesai.</p>
          <p className="text-base text-gray-600 mt-1">
            Temuan otomatis masuk arsip saat semua checklist dicentang.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {archived.map((f) => {
          const type = getType(f.type),
            pri = getPriority(f.priority),
            TypeIcon = type?.icon || Archive;
          return (
            <div
              key={f.id}
              className="bg-dark-800 border border-dark-700 rounded-2xl p-6 hover:border-dark-600 transition"
            >
              <div className="flex items-start gap-4 mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: type?.color + '15', color: type?.color }}
                >
                  <TypeIcon size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-200 truncate">
                    {f.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold"
                      style={{ background: type?.bg, color: type?.color }}
                    >
                      {type?.short}
                    </span>
                    <span
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold"
                      style={{
                        background: pri?.color + '18',
                        color: pri?.color,
                      }}
                    >
                      {pri?.label}
                    </span>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400">
                      <CheckCircle2 size={12} /> Selesai
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-base text-gray-400 mb-4 line-clamp-2">
                {f.description}
              </p>

              <div className="space-y-2 text-sm text-gray-400 mb-5">
                {f.area && (
                  <div className="flex items-center gap-2">
                    <MapPin size={16} /> {f.area}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar size={16} /> Dibuat: {formatDate(f.createdAt)} —
                  Deadline: {formatDate(f.deadline)}
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400" />{' '}
                  {(f.checklist || []).length} checklist selesai
                </div>
                {(f.discussions || []).length > 0 && (
                  <div className="flex items-center gap-2">
                    <MessageCircle size={16} /> {f.discussions.length} diskusi
                  </div>
                )}
                {f.costRequired && (
                  <div className="flex items-center gap-2">
                    <DollarSign size={16} className="text-amber-400" /> Est:{' '}
                    {formatCurrency(f.estimatedCost)}{' '}
                    {f.actualCost
                      ? `| Aktual: ${formatCurrency(f.actualCost)}`
                      : ''}
                  </div>
                )}
                {f.guideline && (
                  <div className="flex items-center gap-2">
                    <BookOpen size={16} className="text-indigo-400" /> Guideline
                    tersedia
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Link
                  to={`/findings/${f.id}`}
                  className="flex-1 flex items-center justify-center gap-2 text-base font-bold text-indigo-400 border border-indigo-500/20 rounded-xl py-3.5 hover:bg-indigo-500/10 transition"
                >
                  <ArrowRight size={18} /> Lihat Detail
                </Link>
                <button
                  onClick={() => restore(f)}
                  className="flex-1 flex items-center justify-center gap-2 text-base font-bold text-amber-400 border border-amber-500/20 rounded-xl py-3.5 hover:bg-amber-500/10 transition"
                >
                  <RotateCcw size={18} /> Kembalikan
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
