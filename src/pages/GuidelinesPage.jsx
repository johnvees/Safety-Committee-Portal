import { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { FINDING_TYPES } from '../constants';
import {
  BookOpen, Plus, Trash2, Download, FileText, Search, X,
  Globe, Flag, Filter, Upload, Eye,
} from 'lucide-react';

const SCOPES = [
  { value: 'national', label: 'Nasional', icon: Flag, color: '#f59e0b' },
  { value: 'international', label: 'Internasional', icon: Globe, color: '#6366f1' },
];

const DOC_CATEGORIES = [
  ...FINDING_TYPES.map(t => ({ value: t.value, label: t.short, color: t.color, icon: t.icon })),
  { value: 'general', label: 'Umum', color: '#6b7280', icon: BookOpen },
];

const emptyDoc = { title: '', description: '', scope: 'national', category: 'safety', fileName: '', fileUrl: '', fileType: '' };

export default function GuidelinesPage() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyDoc);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterScope, setFilterScope] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [opening, setOpening] = useState(null); // doc id being opened
  const fileRef = useRef(null);

  useEffect(() => {
    // Strip fileUrl on load — only fetch file data lazily when user clicks Open
    api.getGuidelineDocs()
      .then(data => setDocs(data.map(({ fileUrl, ...rest }) => rest)))
      .finally(() => setLoading(false));
  }, []);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm(p => ({
        ...p,
        fileName: file.name,
        fileUrl: ev.target.result,
        fileType: file.type,
        title: p.title || file.name.replace(/\.[^.]+$/, ''),
      }));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const save = async () => {
    if (!form.title.trim() || !form.fileUrl) return;
    setSaving(true);
    try {
      const payload = { ...form, uploadedAt: new Date().toISOString() };
      const created = await api.createGuidelineDoc(payload);
      setDocs(prev => [created, ...prev]);
      setShowModal(false);
      setForm(emptyDoc);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    await api.deleteGuidelineDoc(id);
    setDocs(prev => prev.filter(d => d.id !== id));
    setDeleteConfirm(null);
  };

  const openDoc = async (doc) => {
    setOpening(doc.id);
    try {
      const full = await api.getGuidelineDoc(doc.id);
      if (full.fileType === 'application/pdf' || full.fileName?.toLowerCase().endsWith('.pdf')) {
        const blob = dataUrlToBlob(full.fileUrl);
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      } else {
        const a = document.createElement('a');
        a.href = full.fileUrl;
        a.download = full.fileName || full.title;
        a.click();
      }
    } finally {
      setOpening(null);
    }
  };

  const dataUrlToBlob = (dataUrl) => {
    const [header, data] = dataUrl.split(',');
    const mime = header.match(/:(.*?);/)[1];
    const binary = atob(data);
    const arr = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
    return new Blob([arr], { type: mime });
  };

  const filtered = docs.filter(d => {
    if (filterScope && d.scope !== filterScope) return false;
    if (filterCategory && d.category !== filterCategory) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      d.title.toLowerCase().includes(q) ||
      (d.description || '').toLowerCase().includes(q) ||
      (d.fileName || '').toLowerCase().includes(q)
    );
  });

  // Group by scope then category
  const grouped = {};
  filtered.forEach(d => {
    const key = `${d.scope}__${d.category}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(d);
  });

  const getCat = (v) => DOC_CATEGORIES.find(c => c.value === v);
  const getScope = (v) => SCOPES.find(s => s.value === v);

  const isPdf = (doc) => doc.fileType === 'application/pdf' || doc.fileName?.toLowerCase().endsWith('.pdf');

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-100 tracking-tight flex items-center gap-3">
            <BookOpen size={28} className="text-indigo-400" /> Dokumen Guideline
          </h1>
          <p className="text-base text-gray-400 mt-1">
            Kumpulkan regulasi, standar, dan panduan keselamatan nasional maupun internasional.
          </p>
        </div>
        <button
          onClick={() => { setForm(emptyDoc); setShowModal(true); }}
          className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 h-12 rounded-xl text-base font-bold flex items-center gap-2 hover:opacity-90 transition shadow-lg"
        >
          <Plus size={20} /> Tambah Dokumen
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 bg-dark-800 border border-dark-700 rounded-xl px-4 h-11 focus-within:border-indigo-500 transition flex-1 min-w-[200px]">
          <Search size={17} className="text-gray-500 shrink-0" />
          <input
            className="bg-transparent border-none outline-none text-sm text-gray-200 w-full placeholder-gray-500"
            placeholder="Cari dokumen..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-200"><X size={15} /></button>}
        </div>

        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-500" />
          <select
            className="bg-dark-800 border border-dark-700 rounded-xl px-3 h-11 text-sm text-gray-200 outline-none focus:border-indigo-500 transition"
            value={filterScope}
            onChange={e => setFilterScope(e.target.value)}
          >
            <option value="">Semua Scope</option>
            {SCOPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select
            className="bg-dark-800 border border-dark-700 rounded-xl px-3 h-11 text-sm text-gray-200 outline-none focus:border-indigo-500 transition"
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
          >
            <option value="">Semua Kategori</option>
            {DOC_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-dark-800 border border-dark-700 rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500" />
          <p className="text-2xl font-extrabold text-gray-100">{docs.length}</p>
          <p className="text-sm text-gray-400 uppercase tracking-wider mt-1 font-semibold">Total Dokumen</p>
        </div>
        {SCOPES.map(s => (
          <div key={s.value} className="bg-dark-800 border border-dark-700 rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1" style={{ background: s.color }} />
            <p className="text-2xl font-extrabold text-gray-100">{docs.filter(d => d.scope === s.value).length}</p>
            <p className="text-sm text-gray-400 uppercase tracking-wider mt-1 font-semibold">{s.label}</p>
          </div>
        ))}
        <div className="bg-dark-800 border border-dark-700 rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
          <p className="text-2xl font-extrabold text-gray-100">{DOC_CATEGORIES.filter(c => docs.some(d => d.category === c.value)).length}</p>
          <p className="text-sm text-gray-400 uppercase tracking-wider mt-1 font-semibold">Kategori Aktif</p>
        </div>
      </div>

      {/* Document groups */}
      {loading ? (
        <div className="text-center py-20 text-gray-500">Memuat dokumen...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <BookOpen size={52} className="mx-auto mb-4 opacity-25" />
          <p className="text-lg">{docs.length === 0 ? 'Belum ada dokumen guideline.' : 'Tidak ada dokumen yang cocok.'}</p>
          {docs.length === 0 && <p className="text-base text-gray-600 mt-1">Klik "Tambah Dokumen" untuk memulai.</p>}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([key, items]) => {
            const [scopeVal, catVal] = key.split('__');
            const scope = getScope(scopeVal);
            const cat = getCat(catVal);
            const CatIcon = cat?.icon || BookOpen;
            const ScopeIcon = scope?.icon || Globe;
            return (
              <div key={key} className="bg-dark-800 border border-dark-700 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-dark-700 flex items-center gap-3 flex-wrap"
                  style={{ borderLeftWidth: 4, borderLeftColor: cat?.color }}>
                  <CatIcon size={20} style={{ color: cat?.color }} />
                  <span className="text-base font-bold text-gray-100">{cat?.label}</span>
                  <span className="flex items-center gap-1 text-sm font-semibold px-2.5 py-0.5 rounded-full"
                    style={{ background: scope?.color + '20', color: scope?.color }}>
                    <ScopeIcon size={13} /> {scope?.label}
                  </span>
                  <span className="ml-auto text-sm text-gray-500 bg-dark-700 px-3 py-1 rounded-full font-semibold">
                    {items.length} dokumen
                  </span>
                </div>
                <div className="divide-y divide-dark-700">
                  {items.map(doc => (
                    <div key={doc.id} className="px-6 py-4 flex items-center gap-4 hover:bg-dark-900/30 transition">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: cat?.color + '15' }}>
                        <FileText size={20} style={{ color: cat?.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-semibold text-gray-200 truncate">{doc.title}</p>
                        {doc.description && <p className="text-sm text-gray-500 mt-0.5 truncate">{doc.description}</p>}
                        <p className="text-xs text-gray-600 mt-0.5">{doc.fileName} · {new Date(doc.uploadedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => openDoc(doc)}
                          disabled={opening === doc.id}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-60"
                          style={{ background: cat?.color + '15', color: cat?.color }}
                          title={isPdf(doc) ? 'Buka PDF' : 'Download'}
                        >
                          {opening === doc.id ? (
                            <svg className="animate-spin" width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><circle cx="12" cy="12" r="10" strokeOpacity=".25"/><path d="M12 2a10 10 0 0 1 10 10" /></svg>
                          ) : isPdf(doc) ? <Eye size={15} /> : <Download size={15} />}
                          {opening === doc.id ? 'Memuat...' : isPdf(doc) ? 'Buka' : 'Download'}
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(doc)}
                          className="p-2 rounded-xl text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Document Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-dark-800 border border-dark-700 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-dark-700">
              <h2 className="text-xl font-extrabold text-gray-100 flex items-center gap-2">
                <BookOpen size={20} className="text-indigo-400" /> Tambah Dokumen
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-200 transition">
                <X size={22} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4 overflow-y-auto max-h-[70vh]">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2 flex items-center gap-2">
                  <Upload size={15} /> File Dokumen <span className="text-red-400">*</span>
                </label>
                <div
                  className={`border-2 border-dashed rounded-xl py-8 text-center cursor-pointer transition ${form.fileUrl ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-dark-600 hover:border-indigo-500/30'}`}
                  onClick={() => fileRef.current?.click()}
                >
                  {form.fileUrl ? (
                    <>
                      <FileText size={28} className="mx-auto mb-2 text-indigo-400" />
                      <p className="text-base font-semibold text-indigo-300">{form.fileName}</p>
                      <p className="text-sm text-gray-500 mt-1">Klik untuk ganti file</p>
                    </>
                  ) : (
                    <>
                      <Upload size={28} className="mx-auto mb-2 text-gray-500" />
                      <p className="text-base text-gray-400">Klik untuk upload PDF atau dokumen lainnya</p>
                      <p className="text-sm text-gray-600 mt-1">PDF, DOCX, XLSX, PNG, JPG</p>
                    </>
                  )}
                </div>
                <input ref={fileRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" onChange={handleFile} />
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-1.5">Judul <span className="text-red-400">*</span></label>
                <input
                  className="w-full bg-dark-900 border border-dark-700 rounded-xl px-4 py-3 text-base text-gray-200 outline-none focus:border-indigo-500 transition placeholder-gray-600"
                  placeholder="Contoh: ISO 45001:2018, Permenaker No. 5/2018"
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-1.5">Deskripsi</label>
                <input
                  className="w-full bg-dark-900 border border-dark-700 rounded-xl px-4 py-3 text-base text-gray-200 outline-none focus:border-indigo-500 transition placeholder-gray-600"
                  placeholder="Ringkasan singkat isi dokumen..."
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                />
              </div>

              {/* Scope & Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-1.5">Scope</label>
                  <select
                    className="w-full bg-dark-900 border border-dark-700 rounded-xl px-4 py-3 text-base text-gray-200 outline-none focus:border-indigo-500 transition"
                    value={form.scope}
                    onChange={e => setForm(p => ({ ...p, scope: e.target.value }))}
                  >
                    {SCOPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-1.5">Kategori</label>
                  <select
                    className="w-full bg-dark-900 border border-dark-700 rounded-xl px-4 py-3 text-base text-gray-200 outline-none focus:border-indigo-500 transition"
                    value={form.category}
                    onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  >
                    {DOC_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-dark-700 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl text-base text-gray-400 hover:text-gray-200 transition">Batal</button>
              <button
                onClick={save}
                disabled={saving || !form.title.trim() || !form.fileUrl}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-2.5 rounded-xl text-base font-bold hover:opacity-90 transition disabled:opacity-40"
              >
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-dark-800 border border-dark-700 rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                <Trash2 size={22} className="text-red-400" />
              </div>
              <div>
                <p className="text-base font-bold text-gray-100">Hapus Dokumen?</p>
                <p className="text-sm text-gray-400 mt-0.5">"{deleteConfirm.title}" akan dihapus permanen.</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-1">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2.5 rounded-xl text-base text-gray-400 hover:text-gray-200 transition">Batal</button>
              <button onClick={() => remove(deleteConfirm.id)} className="bg-red-500 text-white px-5 py-2.5 rounded-xl text-base font-bold hover:bg-red-600 transition">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
