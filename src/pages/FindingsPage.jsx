import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Trash2, Check, Camera, Calendar, Paperclip, Search, X, Edit3, List, Loader2, Filter, Clock, ArrowRight, DollarSign, MapPin, User, History } from 'lucide-react'
import { useFindings } from '../context/FindingsContext'
import { useAuth } from '../context/AuthContext'
import { api } from '../api'
import { FINDING_TYPES, PRIORITY_LEVELS, getType, getPriority, getProgress, getDaysLeft, isCompleted, formatCurrency, formatDateTime } from '../constants'
import DiscussionPanel from '../components/DiscussionPanel'
import DateFilter, { matchesDateFilter, usePersistentDateFilter } from '../components/DateFilter'

export default function FindingsPage() {
  const { findings, loading, showToast, createFinding, updateFinding, deleteFinding } = useFindings()
  const { user } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [saving, setSaving] = useState(false)
  const [lightbox, setLightbox] = useState(null)
  const [archiveConfirm, setArchiveConfirm] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [dateRange, setDateRange] = usePersistentDateFilter('findings-date')

  const emptyForm = { name:'',type:'',priority:'medium',description:'',findingDate:'',deadline:'',area:'',reportedBy:'',assignedTo:'',costRequired:false,costItems:[],actualCostItems:[],costNotes:'',photos:[],checklist:[],discussions:[],followUps:[],notifications:[] }
  const [form, setForm] = useState(emptyForm)
  const [newCheck, setNewCheck] = useState('')
  const [newFollowUp, setNewFollowUp] = useState('')
  const [newCostItem, setNewCostItem] = useState({ description:'', sku:'', qty:'', unitCost:'' })
  const [newActualItem, setNewActualItem] = useState({ description:'', sku:'', qty:'', unitCost:'' })
  const fileRef = useRef(null)

  const active = findings.filter(f => !isCompleted(f))
  const filtered = active.filter(f => {
    const ms = f.name.toLowerCase().includes(search.toLowerCase()) || (f.description||'').toLowerCase().includes(search.toLowerCase())
    return ms && (!filterType || f.type === filterType) && matchesDateFilter(f.createdAt, dateRange)
  })

  const resetForm = () => { setForm(emptyForm); setNewCheck(''); setNewFollowUp(''); setNewCostItem({description:'',sku:'',qty:'',unitCost:''}); setNewActualItem({description:'',sku:'',qty:'',unitCost:''}); setEditId(null) }
  const openNew = () => { resetForm(); setShowModal(true) }
  const openEdit = async (f) => {
    // Fetch full finding to get photos (stripped from list endpoint)
    const full = await api.getFinding(f.id).catch(() => f)
    setForm({ name:f.name, type:f.type, priority:f.priority, description:f.description, findingDate:f.findingDate||'', deadline:f.deadline, area:f.area||'', reportedBy:f.reportedBy||'', assignedTo:f.assignedTo||'', costRequired:f.costRequired||false, costItems:(f.costItems||[]).map(c=>({...c})), actualCostItems:(f.actualCostItems||[]).map(c=>({...c})), costNotes:f.costNotes||'', photos:[...(full.photos||[])], checklist:(f.checklist||[]).map(c=>({...c})), discussions:(f.discussions||[]).map(d=>({...d})), followUps:(f.followUps||[]).map(fu=>({...fu})), notifications:f.notifications||[] })
    setEditId(f.id); setShowModal(true)
  }
  const addCheckItem = () => { if(!newCheck.trim()) return; setForm(p=>({...p,checklist:[...p.checklist,{id:Date.now(),text:newCheck.trim(),done:false}]})); setNewCheck('') }
  const addFollowUpItem = () => { if(!newFollowUp.trim()) return; setForm(p=>({...p,followUps:[...p.followUps,{id:Date.now(),date:new Date().toISOString(),note:newFollowUp.trim(),by:user?.name||'Admin'}]})); setNewFollowUp('') }
  const addCostItem = () => {
    if(!newCostItem.description.trim()||!newCostItem.qty||!newCostItem.unitCost) return
    const qty=Number(newCostItem.qty); const unitCost=Number(newCostItem.unitCost)
    setForm(p=>({...p,costItems:[...p.costItems,{id:Date.now(),description:newCostItem.description.trim(),sku:newCostItem.sku.trim(),qty,unitCost,totalCost:qty*unitCost}]}))
    setNewCostItem({description:'',sku:'',qty:'',unitCost:''})
  }
  const addActualCostItem = () => {
    if(!newActualItem.description.trim()||!newActualItem.qty||!newActualItem.unitCost) return
    const qty=Number(newActualItem.qty); const unitCost=Number(newActualItem.unitCost)
    setForm(p=>({...p,actualCostItems:[...p.actualCostItems,{id:Date.now(),description:newActualItem.description.trim(),sku:newActualItem.sku.trim(),qty,unitCost,totalCost:qty*unitCost}]}))
    setNewActualItem({description:'',sku:'',qty:'',unitCost:''})
  }
  const handlePhoto = (e) => { Array.from(e.target.files||[]).forEach(file=>{const r=new FileReader();r.onload=(ev)=>setForm(p=>({...p,photos:[...p.photos,{id:Date.now()+Math.random(),url:ev.target.result,name:file.name,uploadedAt:new Date().toISOString(),uploadedBy:user?.name||''}]}));r.readAsDataURL(file)}); e.target.value='' }

  const doSave = async (payload) => {
    if(editId) { const ex=findings.find(f=>f.id===editId); await updateFinding(editId,{...ex,...payload,id:editId}); showToast('Temuan berhasil diperbarui!','success') }
    else { await createFinding(payload) }
    setShowModal(false); resetForm()
  }
  const save = async () => {
    if(!form.name||!form.type) return; setSaving(true)
    const estimatedCost = (form.costItems||[]).reduce((s,c)=>s+(c.totalCost||0),0)
    const actualCost = (form.actualCostItems||[]).length>0 ? (form.actualCostItems||[]).reduce((s,c)=>s+(c.totalCost||0),0) : null
    const payload = {...form, estimatedCost, actualCost}
    const willArchive = editId && (payload.checklist||[]).length>0 && (payload.checklist||[]).every(c=>c.done)
    if(willArchive) {
      setSaving(false)
      setArchiveConfirm({ name: payload.name, onConfirm: () => doSave(payload) })
      return
    }
    try { await doSave(payload) } catch { showToast('Gagal menyimpan.','error') } finally { setSaving(false) }
  }
  const handleDelete = (id, name) => setDeleteTarget({ id, name })
  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try { await deleteFinding(deleteTarget.id) } catch { showToast('Gagal.','error') } finally { setDeleteLoading(false); setDeleteTarget(null) }
  }
  const toggleCheck = async (finding, checkId) => {
    const cl=finding.checklist.map(c=>c.id===checkId?{...c,done:!c.done}:c); const willDone=cl.length>0&&cl.every(c=>c.done)
    const photos = await api.getFinding(finding.id).then(r=>r.photos||[]).catch(()=>[])
    if(willDone) {
      setArchiveConfirm({ name: finding.name, onConfirm: async () => { await updateFinding(finding.id,{...finding,photos,checklist:cl}); showToast(`"${finding.name}" selesai → Arsip`,'success') } })
      return
    }
    try { await updateFinding(finding.id,{...finding,photos,checklist:cl}) } catch { showToast('Gagal','error') }
  }
  const confirmArchive = async () => {
    if(!archiveConfirm) return
    try { await archiveConfirm.onConfirm() } catch { showToast('Gagal','error') }
    setArchiveConfirm(null)
  }
  // ── Input style (reusable) ──
  const inp = "w-full px-4 py-3 bg-dark-900 border border-dark-700 rounded-xl text-base text-gray-200 outline-none transition placeholder-gray-600"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-100 tracking-tight">Temuan Aktif</h1>
          <p className="text-base text-gray-400 mt-1">{filtered.length} temuan ditampilkan</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-dark-900 border border-dark-700 rounded-xl px-4 h-12 focus-within:border-indigo-500 transition w-64">
            <Search size={18} className="text-gray-500 shrink-0" />
            <input className="bg-transparent border-none outline-none text-sm text-gray-200 w-full placeholder-gray-500" placeholder="Cari temuan..." value={search} onChange={e=>setSearch(e.target.value)} />
            {search && <button onClick={()=>setSearch('')} className="text-gray-400 hover:text-gray-200"><X size={16} /></button>}
          </div>
          <button onClick={openNew} className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 h-12 rounded-xl text-base font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition active:scale-95">
            <Plus size={20} /> Tambah Temuan
          </button>
        </div>
      </div>

      {/* Date Filter */}
      <div className="bg-dark-800 border border-dark-700 rounded-2xl px-5 py-4">
        <DateFilter value={dateRange} onChange={setDateRange} />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={()=>setFilterType('')} className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition ${filterType===''?'bg-indigo-500/20 text-indigo-300':'bg-dark-800 text-gray-400 hover:text-gray-200'}`}><Filter size={16} /> Semua</button>
        {FINDING_TYPES.map(t=>{const Icon=t.icon;return(
          <button key={t.value} onClick={()=>setFilterType(t.value)} className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition ${filterType===t.value?'':'bg-dark-800 text-gray-400 hover:text-gray-200'}`} style={filterType===t.value?{background:t.color+'22',color:t.color}:{}}><Icon size={16} /> {t.short}</button>
        )})}
      </div>

      {loading && <div className="flex items-center justify-center py-20 text-gray-400 text-lg"><Loader2 size={28} className="animate-spin mr-3" /> Memuat...</div>}
      {!loading && filtered.length===0 && (
        <div className="text-center py-20 text-gray-500">
          <List size={56} className="mx-auto mb-4 opacity-40" />
          <p className="text-lg">Belum ada temuan aktif.</p>
          <button onClick={openNew} className="mt-4 text-indigo-400 text-base font-semibold flex items-center gap-2 mx-auto hover:text-indigo-300"><Plus size={18} /> Tambah Baru</button>
        </div>
      )}

      {/* Finding Cards */}
      {!loading && filtered.map(f => {
        const type=getType(f.type), pri=getPriority(f.priority), prog=getProgress(f.checklist), days=getDaysLeft(f.deadline), od=days!==null&&days<0, TypeIcon=type?.icon||List
        return (
          <div key={f.id} className="finding-card bg-dark-900 border border-dark-700 rounded-2xl p-6 transition-all" style={{borderLeftWidth:4,borderLeftColor:od?'#ef4444':type?.color}}>
            {/* Header */}
            <div className="flex flex-col gap-2 mb-3">
              {/* Row 1: icon + title */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{background:type?.color+'18',color:type?.color}}><TypeIcon size={22} /></div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-gray-100 text-lg truncate">{f.name}</h3>
                  <div className="flex items-center gap-3 mt-0.5 text-sm text-gray-500">
                    {f.area && <span className="flex items-center gap-1"><MapPin size={14} /> {f.area}</span>}
                    {f.assignedTo && <span className="flex items-center gap-1"><User size={14} /> {f.assignedTo}</span>}
                  </div>
                </div>
              </div>
              {/* Row 2: badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold" style={{background:type?.bg,color:type?.color}}>{type?.short}</span>
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold" style={{background:pri?.color+'18',color:pri?.color}}>{pri?.label}</span>
                {f.costRequired && <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400">{formatCurrency(f.estimatedCost)}</span>}
              </div>
            </div>

            <p className="text-base text-gray-400 leading-relaxed mb-4">{f.description}</p>

            {/* Progress */}
            <div className="flex items-center gap-5 mb-4">
              <div className="flex-1">
                <div className="flex justify-between mb-1.5">
                  <span className="text-sm text-gray-500">Progress</span>
                  <span className={`text-sm font-bold ${prog===100?'text-emerald-400':'text-gray-400'}`}>{prog}%</span>
                </div>
                <div className="h-2.5 bg-dark-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{width:`${prog}%`,background:prog===100?'#10b981':type?.color}} />
                </div>
              </div>
              <div className={`flex items-center gap-2 text-sm shrink-0 font-semibold ${od?'text-red-400':'text-gray-400'}`}>
                {od?<Clock size={18} />:<Calendar size={18} />}
                <span>{!f.deadline?'-':od?`Overdue ${Math.abs(days)}h`:days===0?'Hari ini':`${days}h lagi`}</span>
              </div>
            </div>

            {/* Checklist */}
            {f.checklist?.length>0 && (
              <div className="space-y-2 mb-4">
                {f.checklist.map(c=>(
                  <div key={c.id} onClick={()=>toggleCheck(f,c.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition cursor-pointer ${c.done?'bg-emerald-500/5 border-emerald-500/15':'bg-dark-900 border-dark-700 hover:border-dark-600'}`}>
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition ${c.done?'bg-gradient-to-br from-indigo-500 to-purple-500':'border-2 border-dark-600'}`}>{c.done && <Check size={14} className="text-white" />}</div>
                    <span className={`text-base ${c.done?'text-gray-500 line-through':'text-gray-200'}`}>{c.text}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Follow-up */}
            {(f.followUps||[]).length>0 && (()=>{const fu=f.followUps[f.followUps.length-1];return(
              <div className="mb-4 px-4 py-3 bg-dark-800/50 border border-dark-700 rounded-xl">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-2 flex items-center gap-1.5"><History size={14} /> Follow-up Terakhir</p>
                <p className="text-base text-gray-400"><span className="text-gray-200 font-semibold">{fu.by}</span> — {fu.note}</p>
                <p className="text-xs text-gray-500 mt-1">{formatDateTime(fu.date)}</p>
              </div>
            )})()}


            {/* Photos */}
            {f.photos?.length>0 && <div className="flex gap-3 flex-wrap mb-4">{f.photos.map(p=><img key={p.id} src={p.url} alt="" className="w-20 h-20 rounded-xl object-cover border-2 border-dark-700 cursor-pointer hover:opacity-80 transition" onClick={()=>setLightbox(p.url)} />)}</div>}

            {/* Discussion */}
            <DiscussionPanel finding={f} />

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 mt-2">
              <div className="flex flex-col gap-0.5">
                <Link to={`/findings/${f.id}`} className="text-sm text-gray-500 hover:text-indigo-400 flex items-center gap-1.5 transition font-medium">Lihat Detail <ArrowRight size={16} /></Link>
                {f.createdAt && <span className="text-xs text-gray-600">{formatDateTime(f.createdAt)}</span>}
              </div>
              <div className="flex gap-2">
                <button onClick={()=>openEdit(f)} className="flex items-center gap-2 text-sm font-bold text-indigo-400 border border-indigo-500/20 px-4 py-2.5 rounded-xl hover:bg-indigo-500/10 transition"><Edit3 size={16} /> Edit</button>
                <button onClick={()=>handleDelete(f.id, f.name)} className="flex items-center text-red-400 border border-red-500/15 px-3 py-2.5 rounded-xl hover:bg-red-500/10 transition"><Trash2 size={16} /></button>
              </div>
            </div>
          </div>
        )
      })}

      {/* ══ DELETE CONFIRMATION ══ */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/70 z-[1500] flex items-center justify-center p-4" onClick={() => setDeleteTarget(null)}>
          <div className="bg-dark-800 border border-dark-700 rounded-2xl p-7 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-2xl bg-red-500/15 flex items-center justify-center shrink-0">
                <Trash2 size={26} className="text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-100">Hapus Temuan</h3>
                <p className="text-sm text-gray-400 mt-0.5">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>
            <p className="text-base text-gray-300 mb-1">Yakin ingin menghapus temuan <span className="font-bold text-gray-100">"{deleteTarget.name}"</span>?</p>
            <p className="text-sm text-gray-500 mb-6">Semua data termasuk foto, checklist, dan diskusi akan ikut terhapus secara permanen.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteTarget(null)} className="px-5 py-2.5 rounded-xl border border-dark-600 text-gray-400 text-sm font-bold hover:bg-dark-700 transition">Batal</button>
              <button onClick={confirmDelete} disabled={deleteLoading} className="px-6 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 disabled:opacity-60 text-white text-sm font-bold flex items-center gap-2 transition">
                {deleteLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Trash2 size={15} />}
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ ARCHIVE CONFIRMATION ══ */}
      {archiveConfirm && (
        <div className="fixed inset-0 bg-black/70 z-[1500] flex items-center justify-center p-4" onClick={()=>setArchiveConfirm(null)}>
          <div className="bg-dark-800 border border-dark-700 rounded-2xl p-7 w-full max-w-md shadow-2xl" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                <Check size={28} className="text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-100">Konfirmasi Arsip</h3>
                <p className="text-sm text-gray-400 mt-0.5">Semua checklist telah selesai</p>
              </div>
            </div>
            <p className="text-base text-gray-300 mb-1">Temuan <span className="font-bold text-gray-100">"{archiveConfirm.name}"</span> akan ditandai selesai dan dipindahkan ke arsip.</p>
            <p className="text-sm text-gray-500 mb-6">Tindakan ini tidak dapat dibatalkan. Pastikan semua pekerjaan sudah benar-benar selesai sebelum melanjutkan.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={()=>setArchiveConfirm(null)} className="px-5 py-2.5 rounded-xl border border-dark-600 text-gray-400 text-sm font-bold hover:bg-dark-700 transition">Batal</button>
              <button onClick={confirmArchive} className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold flex items-center gap-2 transition">
                <Check size={16} /> Ya, Arsipkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ LIGHTBOX ══ */}
      {lightbox && (
        <div className="fixed inset-0 bg-black/90 z-[2000] flex items-center justify-center p-4" onClick={()=>setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white/70 hover:text-white p-2"><X size={28} /></button>
          <img src={lightbox} alt="" className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl" onClick={e=>e.stopPropagation()} />
        </div>
      )}

      {/* ══ MODAL ══ */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 z-[1000] flex items-center justify-center p-4" onClick={()=>setShowModal(false)}>
          <div className="bg-dark-800 rounded-2xl p-7 w-full max-w-3xl max-h-[92vh] overflow-y-auto border border-dark-700 shadow-2xl" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-100 flex items-center gap-3"><Paperclip size={22} className="text-indigo-400" /> {editId?'Edit Temuan':'Tambah Temuan Baru'}</h2>
              <button onClick={()=>setShowModal(false)} className="text-gray-400 hover:text-gray-200 p-2"><X size={22} /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-400 mb-2">Nama Temuan *</label>
                <input className={inp} placeholder="Contoh: Kebocoran pipa produksi" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">Jenis *</label>
                <select className={inp+" appearance-none cursor-pointer"} value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))}>
                  <option value="">-- Pilih --</option>
                  {FINDING_TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">Area / Lokasi</label>
                <input className={inp} placeholder="Produksi Lt.2" value={form.area} onChange={e=>setForm(p=>({...p,area:e.target.value}))} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">Dilaporkan oleh</label>
                <input className={inp} placeholder="Nama pelapor" value={form.reportedBy} onChange={e=>setForm(p=>({...p,reportedBy:e.target.value}))} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">Ditugaskan ke</label>
                <input className={inp} placeholder="Tim / PIC" value={form.assignedTo} onChange={e=>setForm(p=>({...p,assignedTo:e.target.value}))} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">Prioritas</label>
                <div className="flex gap-2">
                  {PRIORITY_LEVELS.map(p=>(
                    <button key={p.value} onClick={()=>setForm(prev=>({...prev,priority:p.value}))} className="flex-1 py-3 rounded-xl text-sm font-bold transition"
                      style={{border:form.priority===p.value?`2px solid ${p.color}`:'1px solid #2a2d3a',background:form.priority===p.value?p.color+'18':'#0f1117',color:form.priority===p.value?p.color:'#64748b'}}>{p.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2 flex items-center gap-2"><Calendar size={16} /> Tanggal Temuan</label>
                <input type="date" className={inp} value={form.findingDate} onChange={e=>setForm(p=>({...p,findingDate:e.target.value}))} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2 flex items-center gap-2"><Calendar size={16} /> Deadline</label>
                <input type="date" className={inp} value={form.deadline} onChange={e=>setForm(p=>({...p,deadline:e.target.value}))} />
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-bold text-gray-400 mb-2">Deskripsi</label>
                <textarea className={inp+" resize-y min-h-[90px]"} placeholder="Jelaskan detail temuan..." value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} />
              </div>
            </div>

            {/* Cost */}
            <div className="mt-5 p-5 bg-dark-900 border border-dark-700 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <label className="text-base font-bold text-gray-300 flex items-center gap-2"><DollarSign size={18} /> Biaya Perbaikan</label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <span className="text-sm text-gray-400">Ada biaya?</span>
                  <div onClick={()=>setForm(p=>({...p,costRequired:!p.costRequired}))} className={`w-12 h-7 rounded-full transition cursor-pointer flex items-center ${form.costRequired?'bg-indigo-500 justify-end':'bg-dark-600 justify-start'}`}>
                    <div className="w-5 h-5 bg-white rounded-full mx-1" />
                  </div>
                </label>
              </div>
              {form.costRequired && (
                <div className="space-y-5">

                  {/* ── Estimasi ── */}
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-amber-400 uppercase tracking-wider">Biaya Estimasi</p>
                    {form.costItems.length>0 && (
                      <div className="rounded-xl border border-dark-700 overflow-hidden">
                        <table className="w-full text-sm">
                          <thead><tr className="bg-dark-800 border-b border-dark-700 text-xs text-gray-500 uppercase tracking-wider">
                            <th className="px-4 py-2.5 text-left font-bold">Nama Item</th>
                            <th className="px-3 py-2.5 text-left font-bold">SKU</th>
                            <th className="px-3 py-2.5 text-center font-bold w-16">Qty</th>
                            <th className="px-3 py-2.5 text-right font-bold">Harga Satuan</th>
                            <th className="px-3 py-2.5 text-right font-bold">Total</th>
                            <th className="px-3 py-2.5 w-8"></th>
                          </tr></thead>
                          <tbody>{form.costItems.map(c=>(
                            <tr key={c.id} className="border-b border-dark-700/50 hover:bg-dark-800/40 transition">
                              <td className="px-4 py-3 text-gray-200">{c.description}</td>
                              <td className="px-3 py-3 text-gray-400 font-mono text-xs">{c.sku || '-'}</td>
                              <td className="px-3 py-3 text-center text-gray-300">{c.qty}</td>
                              <td className="px-3 py-3 text-right font-mono text-gray-300">{formatCurrency(c.unitCost)}</td>
                              <td className="px-3 py-3 text-right font-mono font-semibold text-amber-300">{formatCurrency(c.totalCost)}</td>
                              <td className="px-3 py-3"><button onClick={()=>setForm(p=>({...p,costItems:p.costItems.filter(x=>x.id!==c.id)}))} className="text-red-400/40 hover:text-red-400 transition"><Trash2 size={15} /></button></td>
                            </tr>
                          ))}</tbody>
                          <tfoot><tr className="bg-dark-800/60 border-t-2 border-dark-600">
                            <td colSpan={4} className="px-4 py-3 text-sm font-extrabold text-gray-400 uppercase tracking-wider">Total Estimasi</td>
                            <td className="px-3 py-3 text-right font-extrabold font-mono text-amber-400">{formatCurrency(form.costItems.reduce((s,c)=>s+(c.totalCost||0),0))}</td>
                            <td></td>
                          </tr></tfoot>
                        </table>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_120px_80px_160px_auto] gap-2">
                      <input className={inp} placeholder="Nama item (Material, Jasa, dll)" value={newCostItem.description} onChange={e=>setNewCostItem(p=>({...p,description:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&addCostItem()} />
                      <input className={inp} placeholder="SKU (opsional)" value={newCostItem.sku} onChange={e=>setNewCostItem(p=>({...p,sku:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&addCostItem()} />
                      <input type="number" className={inp} placeholder="Qty" value={newCostItem.qty} onChange={e=>setNewCostItem(p=>({...p,qty:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&addCostItem()} />
                      <input type="number" className={inp} placeholder="Harga satuan (Rp)" value={newCostItem.unitCost} onChange={e=>setNewCostItem(p=>({...p,unitCost:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&addCostItem()} />
                      <button onClick={addCostItem} className="bg-amber-500/10 text-amber-300 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-amber-500/20 whitespace-nowrap"><Plus size={16} /> Tambah</button>
                    </div>
                    {newCostItem.qty && newCostItem.unitCost && <p className="text-xs text-amber-400/70 px-1">= {formatCurrency(Number(newCostItem.qty)*Number(newCostItem.unitCost))}</p>}
                  </div>

                  {/* ── Aktual ── */}
                  {editId && <div className="space-y-2 pt-4 border-t border-dark-700">
                    <p className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Biaya Aktual <span className="text-gray-600 font-normal normal-case">(diisi setelah pekerjaan selesai)</span></p>
                    {form.actualCostItems.length>0 && (
                      <div className="rounded-xl border border-dark-700 overflow-hidden">
                        <table className="w-full text-sm">
                          <thead><tr className="bg-dark-800 border-b border-dark-700 text-xs text-gray-500 uppercase tracking-wider">
                            <th className="px-4 py-2.5 text-left font-bold">Nama Item</th>
                            <th className="px-3 py-2.5 text-left font-bold">SKU</th>
                            <th className="px-3 py-2.5 text-center font-bold w-16">Qty</th>
                            <th className="px-3 py-2.5 text-right font-bold">Harga Satuan</th>
                            <th className="px-3 py-2.5 text-right font-bold">Total</th>
                            <th className="px-3 py-2.5 w-8"></th>
                          </tr></thead>
                          <tbody>{form.actualCostItems.map(c=>(
                            <tr key={c.id} className="border-b border-dark-700/50 hover:bg-dark-800/40 transition">
                              <td className="px-4 py-3 text-gray-200">{c.description}</td>
                              <td className="px-3 py-3 text-gray-400 font-mono text-xs">{c.sku || '-'}</td>
                              <td className="px-3 py-3 text-center text-gray-300">{c.qty}</td>
                              <td className="px-3 py-3 text-right font-mono text-gray-300">{formatCurrency(c.unitCost)}</td>
                              <td className="px-3 py-3 text-right font-mono font-semibold text-emerald-300">{formatCurrency(c.totalCost)}</td>
                              <td className="px-3 py-3"><button onClick={()=>setForm(p=>({...p,actualCostItems:p.actualCostItems.filter(x=>x.id!==c.id)}))} className="text-red-400/40 hover:text-red-400 transition"><Trash2 size={15} /></button></td>
                            </tr>
                          ))}</tbody>
                          <tfoot><tr className="bg-dark-800/60 border-t-2 border-dark-600">
                            <td colSpan={4} className="px-4 py-3 text-sm font-extrabold text-gray-400 uppercase tracking-wider">Total Aktual</td>
                            <td className="px-3 py-3 text-right font-extrabold font-mono text-emerald-400">{formatCurrency(form.actualCostItems.reduce((s,c)=>s+(c.totalCost||0),0))}</td>
                            <td></td>
                          </tr></tfoot>
                        </table>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_120px_80px_160px_auto] gap-2">
                      <input className={inp} placeholder="Nama item aktual" value={newActualItem.description} onChange={e=>setNewActualItem(p=>({...p,description:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&addActualCostItem()} />
                      <input className={inp} placeholder="SKU (opsional)" value={newActualItem.sku} onChange={e=>setNewActualItem(p=>({...p,sku:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&addActualCostItem()} />
                      <input type="number" className={inp} placeholder="Qty" value={newActualItem.qty} onChange={e=>setNewActualItem(p=>({...p,qty:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&addActualCostItem()} />
                      <input type="number" className={inp} placeholder="Harga satuan (Rp)" value={newActualItem.unitCost} onChange={e=>setNewActualItem(p=>({...p,unitCost:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&addActualCostItem()} />
                      <button onClick={addActualCostItem} className="bg-emerald-500/10 text-emerald-300 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-emerald-500/20 whitespace-nowrap"><Plus size={16} /> Tambah</button>
                    </div>
                    {newActualItem.qty && newActualItem.unitCost && <p className="text-xs text-emerald-400/70 px-1">= {formatCurrency(Number(newActualItem.qty)*Number(newActualItem.unitCost))}</p>}
                  </div>}

                  {/* Notes */}
                  <div className="pt-2 border-t border-dark-700">
                    <label className="text-sm text-gray-400 block mb-1">Catatan Biaya</label>
                    <input className={inp} value={form.costNotes} onChange={e=>setForm(p=>({...p,costNotes:e.target.value}))} placeholder="Catatan tambahan" />
                  </div>

                </div>
              )}
            </div>

            {/* Photo */}
            <div className="mt-5">
              <label className="block text-sm font-bold text-gray-400 mb-2 flex items-center gap-2"><Camera size={16} /> Foto</label>
              <div className="border-2 border-dashed border-dark-700 rounded-xl py-7 text-center cursor-pointer hover:border-indigo-500/30 transition" onClick={()=>fileRef.current?.click()}>
                <Camera size={28} className="mx-auto text-gray-500 mb-2" />
                <p className="text-base text-gray-500">Klik untuk upload foto</p>
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhoto} />
              </div>
              {form.photos.length>0 && <div className="flex gap-3 flex-wrap mt-3">{form.photos.map(p=>(<div key={p.id} className="relative group"><img src={p.url} alt="" className="w-20 h-20 rounded-xl object-cover border-2 border-dark-700" /><button onClick={()=>setForm(pr=>({...pr,photos:pr.photos.filter(x=>x.id!==p.id)}))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><X size={12} /></button></div>))}</div>}
            </div>

            {/* Checklist */}
            <div className="mt-5">
              <label className="block text-sm font-bold text-gray-400 mb-2 flex items-center gap-2"><List size={16} /> Checklist</label>
              {form.checklist.map(c=>(
                <div key={c.id} className="flex items-center gap-3 px-4 py-3 bg-dark-900 border border-dark-700 rounded-xl mb-2">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 cursor-pointer ${c.done?'bg-gradient-to-br from-indigo-500 to-purple-500':'border-2 border-dark-600'}`}
                    onClick={()=>setForm(p=>({...p,checklist:p.checklist.map(x=>x.id===c.id?{...x,done:!x.done}:x)}))}>{c.done&&<Check size={12} className="text-white" />}</div>
                  <span className={`text-base flex-1 ${c.done?'text-gray-500 line-through':'text-gray-200'}`}>{c.text}</span>
                  <button onClick={()=>setForm(p=>({...p,checklist:p.checklist.filter(x=>x.id!==c.id)}))} className="text-red-400/50 hover:text-red-400 p-1"><Trash2 size={16} /></button>
                </div>
              ))}
              <div className="flex gap-2">
                <input className={inp+" flex-1"} placeholder="Tambah checklist..." value={newCheck} onChange={e=>setNewCheck(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addCheckItem()} />
                <button onClick={addCheckItem} className="bg-indigo-500/10 text-indigo-300 px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-500/20"><Plus size={16} /> Tambah</button>
              </div>
            </div>

            {/* Follow Up */}
            <div className="mt-5">
              <label className="block text-sm font-bold text-gray-400 mb-2 flex items-center gap-2"><History size={16} /> Follow-up</label>
              {form.followUps.map(fu=>(
                <div key={fu.id} className="flex items-center gap-3 px-4 py-3 bg-dark-900 border border-dark-700 rounded-xl mb-2 text-sm">
                  <span className="text-gray-500 shrink-0">{formatDateTime(fu.date)}</span>
                  <span className="text-gray-300 flex-1">{fu.note}</span>
                  <span className="text-gray-500">{fu.by}</span>
                  <button onClick={()=>setForm(p=>({...p,followUps:p.followUps.filter(x=>x.id!==fu.id)}))} className="text-red-400/50 hover:text-red-400 p-1"><X size={14} /></button>
                </div>
              ))}
              <div className="flex gap-2">
                <input className={inp+" flex-1"} placeholder="Catatan follow-up..." value={newFollowUp} onChange={e=>setNewFollowUp(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addFollowUpItem()} />
                <button onClick={addFollowUpItem} className="bg-indigo-500/10 text-indigo-300 px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-500/20"><Plus size={16} /></button>
              </div>
            </div>

            {/* Save */}
            <div className="flex justify-end gap-3 mt-7 pt-5 border-t border-dark-700">
              <button onClick={()=>setShowModal(false)} className="border border-dark-600 text-gray-400 px-6 py-3 rounded-xl text-base font-bold hover:bg-dark-700 transition">Batal</button>
              <button onClick={save} disabled={!form.name||!form.type||saving}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-8 py-3 rounded-xl text-base font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/25 disabled:opacity-40 transition">
                {saving?<Loader2 size={18} className="animate-spin" />:<Check size={18} />}
                {editId?'Simpan':'Simpan Temuan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
