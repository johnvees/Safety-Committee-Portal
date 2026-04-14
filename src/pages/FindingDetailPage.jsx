import { useState, useRef, useEffect } from 'react'
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useFindings } from '../context/FindingsContext'
import { getType, getPriority, getProgress, getDaysLeft, isCompleted, formatCurrency, formatDate, formatDateTime } from '../constants'
import DiscussionPanel from '../components/DiscussionPanel'
import { ArrowLeft, Check, Calendar, MapPin, User, DollarSign, History, AlertTriangle, CheckCircle2, Trash2, X } from 'lucide-react'

export default function FindingDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { findings, updateFinding, deleteFinding, showToast } = useFindings()
  const [lightbox, setLightbox] = useState(null)
  const [archiveConfirm, setArchiveConfirm] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [flashSection, setFlashSection] = useState(null)

  const checklistRef = useRef(null)
  const costRef = useRef(null)
  const deadlineRef = useRef(null)
  const discussionRef = useRef(null)

  const f = findings.find(fi=>fi.id===Number(id))

  useEffect(() => {
    const focus = searchParams.get('focus')
    if (!focus) return
    const refMap = { checklist: checklistRef, cost: costRef, deadline: deadlineRef, discussion: discussionRef }
    const ref = refMap[focus]
    if (!ref?.current) return
    const t1 = setTimeout(() => {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setFlashSection(focus)
    }, 300)
    const t2 = setTimeout(() => setFlashSection(null), 3300)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [searchParams])

  if(!f) return <div className="text-center py-24 text-gray-500"><AlertTriangle size={48} className="mx-auto mb-4 opacity-40" /><p className="text-lg">Temuan tidak ditemukan.</p><Link to="/findings" className="text-indigo-400 text-base mt-3 inline-block">← Kembali</Link></div>

  const type=getType(f.type), pri=getPriority(f.priority), prog=getProgress(f.checklist), days=getDaysLeft(f.deadline), od=days!==null&&days<0&&!isCompleted(f), done=isCompleted(f), TypeIcon=type?.icon||AlertTriangle

  const toggleCheck = async (cid) => {
    const cl=f.checklist.map(c=>c.id===cid?{...c,done:!c.done}:c); const willDone=cl.length>0&&cl.every(c=>c.done)
    if(willDone) {
      setArchiveConfirm({ name: f.name, onConfirm: async () => { await updateFinding(f.id,{...f,checklist:cl}); showToast('Selesai → Arsip','success') } })
      return
    }
    try { await updateFinding(f.id,{...f,checklist:cl}) } catch { showToast('Gagal','error') }
  }
  const confirmArchive = async () => {
    if(!archiveConfirm) return
    try { await archiveConfirm.onConfirm() } catch { showToast('Gagal','error') }
    setArchiveConfirm(null)
  }
  const handleDelete = () => setDeleteConfirm(true)
  const confirmDelete = async () => {
    setDeleteLoading(true)
    try { await deleteFinding(f.id); navigate('/findings') } catch { showToast('Gagal','error') } finally { setDeleteLoading(false); setDeleteConfirm(false) }
  }

  const flash = (section) => flashSection === section ? 'section-flash' : ''

  return (
    <div className="space-y-6 max-w-4xl">
      <style>{`
        @keyframes section-flash {
          0%,100% { box-shadow:none; }
          20%,60%  { box-shadow:0 0 0 3px #6366f1, 0 0 18px 2px #6366f140; }
          40%,80%  { box-shadow:0 0 0 1px #6366f160; }
        }
        .section-flash { animation: section-flash 1.5s ease 2; }
      `}</style>
      <button onClick={()=>navigate(-1)} className="text-base text-gray-400 hover:text-gray-200 flex items-center gap-2 transition font-medium"><ArrowLeft size={18} /> Kembali</button>

      {/* Header */}
      <div className="bg-dark-800 border border-dark-700 rounded-2xl p-7" style={{borderLeftWidth:5,borderLeftColor:od?'#ef4444':type?.color}}>
        <div className="flex items-start gap-5">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0" style={{background:type?.color+'18',color:type?.color}}><TypeIcon size={28} /></div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-extrabold text-gray-100">{f.name}</h1>
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold" style={{background:type?.bg,color:type?.color}}>{type?.label}</span>
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold" style={{background:pri?.color+'18',color:pri?.color}}>{pri?.label}</span>
              {done && <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold bg-emerald-500/15 text-emerald-400"><CheckCircle2 size={14} /> Selesai</span>}
              {od && <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold bg-red-500/15 text-red-400"><AlertTriangle size={14} /> Overdue {Math.abs(days)}h</span>}
            </div>
            {f.createdAt && <p className="text-xs text-gray-500 mt-2">Dibuat: {formatDateTime(f.createdAt)}</p>}
          </div>
          <button onClick={handleDelete} className="text-red-400/50 hover:text-red-400 p-2 transition" title="Hapus"><Trash2 size={22} /></button>
        </div>

        <p className="text-base text-gray-400 mt-5 leading-relaxed">{f.description}</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {[
            {icon:MapPin,label:'Area',val:f.area||'-',key:'area'},
            {icon:User,label:'Pelapor',val:f.reportedBy||'-',key:'pelapor'},
            {icon:User,label:'PIC',val:f.assignedTo||'-',key:'pic'},
            {icon:Calendar,label:'Deadline',val:f.deadline?formatDate(f.deadline):'-',key:'deadline'},
          ].map((m,i)=>(
            <div key={i} ref={m.key==='deadline'?deadlineRef:null} className={`px-4 py-3.5 bg-dark-900 border border-dark-700 rounded-xl ${m.key==='deadline'?flash('deadline'):''}`}>
              <p className="text-sm text-gray-500 flex items-center gap-1.5 mb-1"><m.icon size={16} /> {m.label}</p>
              <p className="text-base font-semibold text-gray-200">{m.val}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Progress */}
      <div ref={checklistRef} className={`bg-dark-800 border border-dark-700 rounded-2xl p-6 ${flash('checklist')}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-100">Progress Checklist</h3>
          <span className={`text-lg font-bold ${prog===100?'text-emerald-400':'text-gray-400'}`}>{prog}%</span>
        </div>
        <div className="h-3 bg-dark-700 rounded-full overflow-hidden mb-5">
          <div className="h-full rounded-full transition-all duration-500" style={{width:`${prog}%`,background:prog===100?'#10b981':type?.color}} />
        </div>
        <div className="space-y-2.5">
          {(f.checklist||[]).map(c=>(
            <div key={c.id} onClick={()=>toggleCheck(c.id)}
              className={`flex items-center gap-4 px-5 py-4 rounded-xl border transition cursor-pointer ${c.done?'bg-emerald-500/5 border-emerald-500/15':'bg-dark-900 border-dark-700 hover:border-dark-600'}`}>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${c.done?'bg-gradient-to-br from-indigo-500 to-purple-500':'border-2 border-dark-600'}`}>{c.done && <Check size={16} className="text-white" />}</div>
              <span className={`text-base ${c.done?'text-gray-500 line-through':'text-gray-200'}`}>{c.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Cost */}
        <div ref={costRef} className={`bg-dark-800 border border-dark-700 rounded-2xl p-6 ${flash('cost')}`}>
          <h3 className="text-lg font-bold text-gray-100 mb-4 flex items-center gap-2"><DollarSign size={20} className="text-amber-400" /> Biaya</h3>
          {!f.costRequired ? <p className="text-base text-gray-500">Tidak ada biaya.</p> : (
            <div className="space-y-5">

              {/* Estimasi */}
              <div className="space-y-2">
                <p className="text-sm font-bold text-amber-400 uppercase tracking-wider">Biaya Estimasi</p>
                {(f.costItems||[]).length>0 ? (
                  <div className="rounded-xl border border-dark-700 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead><tr className="bg-dark-900 border-b border-dark-700 text-xs text-gray-500 uppercase tracking-wider">
                        <th className="px-4 py-2.5 text-left font-bold">Nama Item</th>
                        <th className="px-3 py-2.5 text-left font-bold">SKU</th>
                        <th className="px-3 py-2.5 text-center font-bold">Qty</th>
                        <th className="px-3 py-2.5 text-right font-bold">Harga Satuan</th>
                        <th className="px-3 py-2.5 text-right font-bold">Total</th>
                      </tr></thead>
                      <tbody>{f.costItems.map(c=>(
                        <tr key={c.id} className="border-b border-dark-700/50">
                          <td className="px-4 py-3 text-gray-200">{c.description}</td>
                          <td className="px-3 py-3 text-gray-400 font-mono text-xs">{c.sku || '-'}</td>
                          <td className="px-3 py-3 text-center text-gray-300">{c.qty}</td>
                          <td className="px-3 py-3 text-right font-mono text-gray-300">{formatCurrency(c.unitCost)}</td>
                          <td className="px-3 py-3 text-right font-mono font-semibold text-amber-300">{formatCurrency(c.totalCost)}</td>
                        </tr>
                      ))}</tbody>
                      <tfoot><tr className="bg-dark-900/60 border-t-2 border-dark-600">
                        <td colSpan={4} className="px-4 py-3 text-sm font-extrabold text-gray-400 uppercase tracking-wider">Total Estimasi</td>
                        <td className="px-3 py-3 text-right font-extrabold font-mono text-amber-400">{formatCurrency(f.estimatedCost)}</td>
                      </tr></tfoot>
                    </table>
                  </div>
                ) : (
                  <div className="flex justify-between px-4 py-3 bg-dark-900 border border-dark-700 rounded-xl">
                    <span className="text-base text-gray-400">Total Estimasi</span>
                    <span className="text-base font-bold text-amber-300 font-mono">{formatCurrency(f.estimatedCost)}</span>
                  </div>
                )}
              </div>

              {/* Aktual */}
              <div className="space-y-2 pt-4 border-t border-dark-700">
                <p className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Biaya Aktual</p>
                {(f.actualCostItems||[]).length>0 ? (
                  <div className="rounded-xl border border-dark-700 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead><tr className="bg-dark-900 border-b border-dark-700 text-xs text-gray-500 uppercase tracking-wider">
                        <th className="px-4 py-2.5 text-left font-bold">Nama Item</th>
                        <th className="px-3 py-2.5 text-left font-bold">SKU</th>
                        <th className="px-3 py-2.5 text-center font-bold">Qty</th>
                        <th className="px-3 py-2.5 text-right font-bold">Harga Satuan</th>
                        <th className="px-3 py-2.5 text-right font-bold">Total</th>
                      </tr></thead>
                      <tbody>{f.actualCostItems.map(c=>(
                        <tr key={c.id} className="border-b border-dark-700/50">
                          <td className="px-4 py-3 text-gray-200">{c.description}</td>
                          <td className="px-3 py-3 text-gray-400 font-mono text-xs">{c.sku || '-'}</td>
                          <td className="px-3 py-3 text-center text-gray-300">{c.qty}</td>
                          <td className="px-3 py-3 text-right font-mono text-gray-300">{formatCurrency(c.unitCost)}</td>
                          <td className="px-3 py-3 text-right font-mono font-semibold text-emerald-300">{formatCurrency(c.totalCost)}</td>
                        </tr>
                      ))}</tbody>
                      <tfoot><tr className="bg-dark-900/60 border-t-2 border-dark-600">
                        <td colSpan={4} className="px-4 py-3 text-sm font-extrabold text-gray-400 uppercase tracking-wider">Total Aktual</td>
                        <td className="px-3 py-3 text-right font-extrabold font-mono text-emerald-400">{formatCurrency(f.actualCost)}</td>
                      </tr></tfoot>
                    </table>
                  </div>
                ) : (
                  <div className="flex justify-between px-4 py-3 bg-dark-900 border border-dark-700 rounded-xl">
                    <span className="text-base text-gray-400">Total Aktual</span>
                    <span className="text-base font-bold text-gray-400 font-mono">{f.actualCost ? formatCurrency(f.actualCost) : '-'}</span>
                  </div>
                )}
              </div>

              {f.costNotes && <p className="text-base text-gray-500 px-1 pt-1 border-t border-dark-700">Catatan: {f.costNotes}</p>}
            </div>
          )}
        </div>

        {/* Follow-ups */}
        <div className="bg-dark-800 border border-dark-700 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-gray-100 mb-4 flex items-center gap-2"><History size={20} className="text-cyan-400" /> Follow-up</h3>
          {(f.followUps||[]).length===0 ? <p className="text-base text-gray-500">Belum ada follow-up.</p> : (
            <div className="space-y-3">
              {f.followUps.map((fu,i)=>(
                <div key={fu.id} className="flex gap-3 items-start">
                  <div className="flex flex-col items-center"><div className="w-3 h-3 rounded-full bg-indigo-400 shrink-0 mt-1.5" />{i<f.followUps.length-1&&<div className="w-px bg-dark-600 flex-1 min-h-[16px]" />}</div>
                  <div className="pb-2"><p className="text-base text-gray-300">{fu.note}</p><p className="text-sm text-gray-500 mt-0.5">{fu.by} — {formatDateTime(fu.date)}</p></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Photos */}
      {f.photos?.length>0 && (
        <div className="bg-dark-800 border border-dark-700 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-gray-100 mb-4">Foto</h3>
          <div className="flex gap-4 flex-wrap">
            {f.photos.map(p => (
              <div key={p.id} className="flex flex-col items-center gap-1.5 cursor-pointer group" onClick={() => setLightbox(p.url)}>
                <img src={p.url} alt="" className="w-28 h-28 rounded-xl object-cover border-2 border-dark-700 group-hover:opacity-80 transition" />
                {p.uploadedBy && (
                  <p className="text-xs font-semibold text-gray-400 text-center max-w-[7rem] truncate">{p.uploadedBy}</p>
                )}
                {p.uploadedAt && (
                  <p className="text-xs text-gray-500 text-center max-w-[7rem] leading-tight">{formatDateTime(p.uploadedAt)}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 bg-black/90 z-[2000] flex items-center justify-center p-4" onClick={()=>setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white/70 hover:text-white p-2"><X size={28} /></button>
          <img src={lightbox} alt="" className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl" onClick={e=>e.stopPropagation()} />
        </div>
      )}

      {/* Discussion */}
      <div ref={discussionRef} className={`bg-dark-800 border border-dark-700 rounded-2xl p-6 ${flash('discussion')}`}>
        <h3 className="text-lg font-bold text-gray-100 mb-2">Diskusi</h3>
        <DiscussionPanel finding={f} autoOpen={searchParams.get('focus') === 'discussion'} />
      </div>

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

      {/* ══ DELETE CONFIRMATION ══ */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 z-[1500] flex items-center justify-center p-4" onClick={() => setDeleteConfirm(false)}>
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
            <p className="text-base text-gray-300 mb-1">Yakin ingin menghapus temuan <span className="font-bold text-gray-100">"{f.name}"</span>?</p>
            <p className="text-sm text-gray-500 mb-6">Semua data termasuk foto, checklist, dan diskusi akan ikut terhapus secara permanen.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirm(false)} className="px-5 py-2.5 rounded-xl border border-dark-600 text-gray-400 text-sm font-bold hover:bg-dark-700 transition">Batal</button>
              <button onClick={confirmDelete} disabled={deleteLoading} className="px-6 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 disabled:opacity-60 text-white text-sm font-bold flex items-center gap-2 transition">
                {deleteLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Trash2 size={15} />}
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
