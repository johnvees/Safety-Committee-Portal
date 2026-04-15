import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageCircle, Send, ChevronUp, ChevronDown, X, Loader2, AtSign } from 'lucide-react'
import { formatDateTime } from '../constants'
import { useAuth } from '../context/AuthContext'
import { useFindings } from '../context/FindingsContext'
import { api } from '../api'

const avatarColors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#0ea5e9', '#8b5cf6', '#14b8a6']
const getAvatarColor = (name) => {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return avatarColors[Math.abs(hash) % avatarColors.length]
}
const getInitials = (n) => n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

// Render message text, highlighting @mentions
function MessageText({ text }) {
  const parts = text.split(/(@\w+)/g)
  return (
    <p className="text-base text-gray-300 leading-relaxed whitespace-pre-wrap break-words">
      {parts.map((part, i) =>
        /^@\w+$/.test(part)
          ? <span key={i} className="text-indigo-400 font-semibold bg-indigo-500/10 px-0.5 rounded">{part}</span>
          : part
      )}
    </p>
  )
}

export default function DiscussionPanel({ finding, autoOpen = false }) {
  const { user } = useAuth()
  const { updateFinding, showToast } = useFindings()
  const [isOpen, setIsOpen] = useState(autoOpen)
  const [flashing, setFlashing] = useState(autoOpen)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [users, setUsers] = useState([])
  const [mentionQuery, setMentionQuery] = useState(null)
  const [mentionIndex, setMentionIndex] = useState(0)
  const listRef = useRef(null)
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)
  const discussions = finding.discussions || []

  useEffect(() => {
    api.getUsers().then(setUsers).catch(() => {})
  }, [])

  useEffect(() => {
    if (!autoOpen) return
    setIsOpen(true)
    setFlashing(true)
    const t = setTimeout(() => setFlashing(false), 3000)
    return () => clearTimeout(t)
  }, [autoOpen])

  useEffect(() => {
    if (isOpen && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [discussions.length, isOpen])

  useEffect(() => {
    if (!dropdownRef.current) return
    const item = dropdownRef.current.children[mentionIndex]
    item?.scrollIntoView({ block: 'nearest' })
  }, [mentionIndex])

  const filteredUsers = mentionQuery !== null
    ? users.filter(u =>
        u.username !== user?.username &&
        (u.username.toLowerCase().includes(mentionQuery) ||
         u.name.toLowerCase().includes(mentionQuery))
      ).slice(0, 6)
    : []

  const handleChange = (e) => {
    const val = e.target.value
    setMessage(val)
    const pos = e.target.selectionStart
    const beforeCursor = val.slice(0, pos)
    const match = beforeCursor.match(/@(\w*)$/)
    if (match) {
      setMentionQuery(match[1].toLowerCase())
      setMentionIndex(0)
    } else {
      setMentionQuery(null)
    }
  }

  const insertMention = useCallback((username) => {
    const input = inputRef.current
    if (!input) return
    const pos = input.selectionStart
    const beforeCursor = message.slice(0, pos)
    const afterCursor = message.slice(pos)
    const match = beforeCursor.match(/@(\w*)$/)
    if (!match) return
    const newBefore = beforeCursor.slice(0, match.index) + `@${username} `
    const newMsg = newBefore + afterCursor
    setMessage(newMsg)
    setMentionQuery(null)
    setTimeout(() => {
      input.focus()
      const newPos = newBefore.length
      input.setSelectionRange(newPos, newPos)
    }, 0)
  }, [message])

  const handleKeyDown = (e) => {
    if (mentionQuery !== null && filteredUsers.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setMentionIndex(i => Math.min(i + 1, filteredUsers.length - 1)); return }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setMentionIndex(i => Math.max(i - 1, 0)); return }
      if (e.key === 'Enter')     { e.preventDefault(); insertMention(filteredUsers[mentionIndex].username); return }
      if (e.key === 'Escape')    { setMentionQuery(null); return }
    }
    if (e.key === 'Enter' && !e.shiftKey) handleSend()
  }

  const handleSend = async () => {
    if (!message.trim()) return
    setSending(true)

    const comment = {
      id: Date.now(),
      author: user?.name || 'Anonim',
      role: user?.position || '',
      message: message.trim(),
      timestamp: new Date().toISOString(),
    }

    // Extract unique @mentions, exclude self
    const mentionedUsernames = [
      ...new Set((message.trim().match(/@(\w+)/g) || []).map(m => m.slice(1)))
    ].filter(u => u !== user?.username)

    const mentionNotifs = mentionedUsernames.map(username => ({
      id: `mention-${Date.now()}-${username}-${Math.random().toString(36).slice(2)}`,
      type: 'mention',
      message: `${user?.name || 'Seseorang'} menyebut kamu dalam diskusi "${finding.name}"`,
      date: new Date().toISOString(),
      read: false,
      targetUsername: username,
    }))

    try {
      await updateFinding(finding.id, {
        ...finding,
        discussions: [...(finding.discussions || []), comment],
        notifications: [...(finding.notifications || []), ...mentionNotifs],
      })
    } catch {
      showToast('Gagal mengirim komentar', 'error')
    }

    setMessage('')
    setMentionQuery(null)
    setSending(false)
  }

  const handleDeleteComment = async (cid) => {
    try {
      await updateFinding(finding.id, {
        ...finding,
        discussions: (finding.discussions || []).filter(d => d.id !== cid),
      })
    } catch {
      showToast('Gagal menghapus komentar', 'error')
    }
  }

  return (
    <div className="mt-4">
      {flashing && (
        <style>{`
          @keyframes discussion-pulse {
            0%,100% { box-shadow: none; }
            25%,75%  { box-shadow: 0 0 0 3px #6366f1, 0 0 18px 2px #6366f140; }
            50%      { box-shadow: 0 0 0 1px #6366f160; }
          }
          .discussion-pulse { animation: discussion-pulse 1s ease 3; }
        `}</style>
      )}
      <button onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-3 text-sm font-semibold px-4 py-3 rounded-xl transition w-full ${flashing ? 'discussion-pulse' : ''} ${isOpen ? 'bg-indigo-500/15 text-indigo-300' : 'bg-dark-800 text-gray-400 hover:text-gray-200 hover:bg-dark-700'}`}>
        <MessageCircle size={20} />
        <span>Diskusi ({discussions.length})</span>
        <span className="ml-auto">{isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</span>
      </button>

      {isOpen && (
        <div className="mt-3 bg-dark-800/60 border border-dark-700 rounded-xl overflow-hidden">
          <div ref={listRef} className="max-h-96 overflow-y-auto p-4 space-y-4">
            {discussions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle size={36} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm">Belum ada diskusi. Mulai percakapan!</p>
              </div>
            )}
            {discussions.map(d => (
              <div key={d.id} className="group flex gap-3 items-start">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5" style={{ background: getAvatarColor(d.author) }}>
                  {getInitials(d.author)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-200">{d.author}</span>
                    {d.role && <span className="text-xs text-gray-500 bg-dark-700 px-2 py-0.5 rounded">{d.role}</span>}
                    <span className="text-xs text-gray-500">{formatDateTime(d.timestamp)}</span>
                    {(user?.role === 'admin' || user?.name === d.author) && (
                      <button onClick={() => handleDeleteComment(d.id)} className="ml-auto opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition p-1"><X size={16} /></button>
                    )}
                  </div>
                  <div className="bg-dark-900 border border-dark-700 rounded-xl rounded-tl-sm px-4 py-3">
                    <MessageText text={d.message} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-dark-700 p-4">
            {user && (
              <p className="text-xs text-gray-500 mb-2">
                Komentar sebagai <span className="font-semibold text-gray-400">{user.name}</span>
                {user.position && <span className="text-gray-600"> · {user.position}</span>}
                <span className="ml-2 text-gray-700">· Ketik <span className="text-indigo-500/70 font-mono">@</span> untuk mention</span>
              </p>
            )}

            {/* Mention dropdown */}
            <div className="relative">
              {mentionQuery !== null && filteredUsers.length > 0 && (
                <div
                  ref={dropdownRef}
                  className="absolute bottom-full mb-2 left-0 right-0 bg-dark-800 border border-dark-600 rounded-xl shadow-2xl overflow-hidden z-50 max-h-52 overflow-y-auto"
                >
                  {filteredUsers.map((u, i) => (
                    <button
                      key={u.id}
                      onMouseDown={e => { e.preventDefault(); insertMention(u.username) }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition ${i === mentionIndex ? 'bg-indigo-500/20' : 'hover:bg-dark-700'}`}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: getAvatarColor(u.name) }}>
                        {getInitials(u.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-200 truncate">{u.name}</p>
                        <p className="text-xs text-indigo-400 truncate">@{u.username}</p>
                      </div>
                      {u.position && <span className="text-xs text-gray-600 shrink-0">{u.position}</span>}
                    </button>
                  ))}
                </div>
              )}

              {mentionQuery !== null && filteredUsers.length === 0 && mentionQuery.length > 0 && (
                <div className="absolute bottom-full mb-2 left-0 right-0 bg-dark-800 border border-dark-600 rounded-xl shadow-2xl px-4 py-3 z-50">
                  <p className="text-sm text-gray-500 flex items-center gap-2"><AtSign size={14} /> Tidak ada user dengan nama "{mentionQuery}"</p>
                </div>
              )}

              <div className="flex items-center gap-2 bg-dark-900 border border-dark-700 rounded-xl px-3 py-2.5 focus-within:border-indigo-500/50 transition">
                <input
                  ref={inputRef}
                  className="bg-transparent border-none outline-none text-base text-gray-200 w-full placeholder-gray-500"
                  placeholder="Tulis komentar... (@ untuk mention)"
                  value={message}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                />
                <button onClick={handleSend} disabled={!message.trim() || sending} className="text-indigo-400 hover:text-indigo-300 disabled:text-gray-600 transition shrink-0 p-1">
                  {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
