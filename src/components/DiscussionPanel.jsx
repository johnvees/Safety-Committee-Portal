import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageCircle, Send, ChevronUp, ChevronDown, X, Loader2, AtSign } from 'lucide-react'
import { formatDateTime } from '../constants'
import { useAuth } from '../context/AuthContext'
import { useFindings } from '../context/FindingsContext'
import { api } from '../api'

// Fixed palette of 8 colors used for avatar backgrounds.
// Deterministically assigned based on the person's name so the same
// person always gets the same color across sessions.
const avatarColors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#0ea5e9', '#8b5cf6', '#14b8a6']

/**
 * Derive a consistent avatar background color from a display name.
 * Uses a djb2-style hash so the same name always maps to the same color.
 * @param {string} name - User's display name
 * @returns {string} Hex color string
 */
const getAvatarColor = (name) => {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return avatarColors[Math.abs(hash) % avatarColors.length]
}

/**
 * Extract 1–2 uppercase initials from a full name.
 * e.g. "John Doe" → "JD", "Alice" → "A"
 */
const getInitials = (n) => n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

/**
 * MessageText — renders a comment string with @mention highlighting.
 * Splits the text on @word tokens and wraps each mention in a styled <span>.
 */
function MessageText({ text }) {
  const parts = text.split(/(@\w+)/g) // split preserving the capture group
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

/**
 * DiscussionPanel — collapsible comment thread for a single finding.
 *
 * Features:
 *   - Collapsible (click header to toggle)
 *   - @mention autocomplete (type @ to open a user picker)
 *   - Keyboard navigation in the mention dropdown (↑ ↓ Enter Escape)
 *   - Enter to send, Shift+Enter inserts a newline
 *   - Admin or comment author can delete their own messages
 *   - autoOpen: when true the panel opens and pulses briefly (used from FindingDetailPage)
 *
 * Props:
 *   finding    The finding object whose discussions array we're rendering
 *   autoOpen   If true, open and animate the panel on mount
 */
export default function DiscussionPanel({ finding, autoOpen = false }) {
  const { user } = useAuth()
  const { updateFinding, showToast } = useFindings()

  // ── UI state ───────────────────────────────────────────────────────────────
  const [isOpen, setIsOpen]   = useState(autoOpen)  // whether the panel body is visible
  const [flashing, setFlashing] = useState(autoOpen) // drives the pulse animation on first open
  const [message, setMessage] = useState('')         // current input value
  const [sending, setSending] = useState(false)      // true while the save request is in flight

  // ── @mention state ─────────────────────────────────────────────────────────
  const [users, setUsers]             = useState([])   // all registered users (for autocomplete)
  const [mentionQuery, setMentionQuery] = useState(null) // text after '@' (null = not in mention mode)
  const [mentionIndex, setMentionIndex] = useState(0)   // highlighted item in the dropdown

  // ── Refs ───────────────────────────────────────────────────────────────────
  const listRef     = useRef(null) // scrollable message list — used to auto-scroll to bottom
  const inputRef    = useRef(null) // text input — used to restore focus after inserting a mention
  const dropdownRef = useRef(null) // mention dropdown — used to scroll the highlighted item into view

  // Extract the discussions array (default to empty array if missing)
  const discussions = finding.discussions || []

  // Fetch all users once on mount for the @mention autocomplete
  useEffect(() => {
    api.getUsers().then(setUsers).catch(() => {})
  }, [])

  // When autoOpen becomes true, open the panel and start the pulse animation for 3 seconds
  useEffect(() => {
    if (!autoOpen) return
    setIsOpen(true)
    setFlashing(true)
    const t = setTimeout(() => setFlashing(false), 3000)
    return () => clearTimeout(t)
  }, [autoOpen])

  // Auto-scroll the message list to the newest message when the panel opens or a new message arrives
  useEffect(() => {
    if (isOpen && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [discussions.length, isOpen])

  // Keep the highlighted mention dropdown item scrolled into view when the index changes
  useEffect(() => {
    if (!dropdownRef.current) return
    const item = dropdownRef.current.children[mentionIndex]
    item?.scrollIntoView({ block: 'nearest' })
  }, [mentionIndex])

  // Users to display in the mention dropdown — excludes self, filtered by query, max 6
  const filteredUsers = mentionQuery !== null
    ? users.filter(u =>
        u.username !== user?.username &&
        (u.username.toLowerCase().includes(mentionQuery) ||
         u.name.toLowerCase().includes(mentionQuery))
      ).slice(0, 6)
    : []

  /**
   * Handle every keystroke in the comment input.
   * Detects when the user types '@' followed by characters and opens the mention dropdown.
   * Clears mentionQuery when the cursor moves away from the @-token.
   */
  const handleChange = (e) => {
    const val = e.target.value
    setMessage(val)
    const pos = e.target.selectionStart
    const beforeCursor = val.slice(0, pos)
    const match = beforeCursor.match(/@(\w*)$/) // look for @word immediately before cursor
    if (match) {
      setMentionQuery(match[1].toLowerCase())
      setMentionIndex(0) // reset selection when query changes
    } else {
      setMentionQuery(null) // close dropdown if no @-token
    }
  }

  /**
   * Insert a selected username mention into the input at the cursor position.
   * Replaces the partial @query with @username (space-padded) and restores focus.
   * @param {string} username - The username to insert (without @)
   */
  const insertMention = useCallback((username) => {
    const input = inputRef.current
    if (!input) return
    const pos = input.selectionStart
    const beforeCursor = message.slice(0, pos)
    const afterCursor  = message.slice(pos)
    const match = beforeCursor.match(/@(\w*)$/)
    if (!match) return
    // Replace the partial @query with the full @username + space
    const newBefore = beforeCursor.slice(0, match.index) + `@${username} `
    const newMsg = newBefore + afterCursor
    setMessage(newMsg)
    setMentionQuery(null)
    // Restore cursor position after the inserted mention (async to let React update first)
    setTimeout(() => {
      input.focus()
      const newPos = newBefore.length
      input.setSelectionRange(newPos, newPos)
    }, 0)
  }, [message])

  /**
   * Handle keyboard events in the comment input.
   * When the mention dropdown is open: ↑/↓ navigate, Enter selects, Escape closes.
   * Outside mention mode: Enter (without Shift) sends the message.
   */
  const handleKeyDown = (e) => {
    if (mentionQuery !== null && filteredUsers.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setMentionIndex(i => Math.min(i + 1, filteredUsers.length - 1)); return }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setMentionIndex(i => Math.max(i - 1, 0)); return }
      if (e.key === 'Enter')     { e.preventDefault(); insertMention(filteredUsers[mentionIndex].username); return }
      if (e.key === 'Escape')    { setMentionQuery(null); return }
    }
    // Enter without Shift = send; Shift+Enter = newline (default textarea behaviour)
    if (e.key === 'Enter' && !e.shiftKey) handleSend()
  }

  /**
   * Post a new comment on the finding.
   * Also creates @mention notifications for any users tagged in the message.
   * Updates the finding via context (which calls the API and refreshes state).
   */
  const handleSend = async () => {
    if (!message.trim()) return
    setSending(true)

    // Build the new comment object
    const comment = {
      id: Date.now(),
      author: user?.name || 'Anonim',
      role: user?.position || '',
      message: message.trim(),
      timestamp: new Date().toISOString(),
    }

    // Parse all @mentions from the message, deduplicate, exclude the sender
    const mentionedUsernames = [
      ...new Set((message.trim().match(/@(\w+)/g) || []).map(m => m.slice(1)))
    ].filter(u => u !== user?.username)

    // Build a targeted notification for each mentioned user
    const mentionNotifs = mentionedUsernames.map(username => ({
      id: `mention-${Date.now()}-${username}-${Math.random().toString(36).slice(2)}`,
      type: 'mention',
      message: `${user?.name || 'Someone'} mentioned you in "${finding.name}"`,
      date: new Date().toISOString(),
      read: false,
      targetUsername: username, // this ensures only the tagged user sees it
    }))

    try {
      await updateFinding(finding.id, {
        ...finding,
        discussions: [...(finding.discussions || []), comment],
        notifications: [...(finding.notifications || []), ...mentionNotifs],
      })
    } catch {
      showToast('Failed to send comment', 'error')
    }

    // Reset input state after sending
    setMessage('')
    setMentionQuery(null)
    setSending(false)
  }

  /**
   * Delete a comment from the discussion thread.
   * Only the comment author and admins can do this (guarded in the JSX below).
   * @param {number} cid - The comment's numeric id field
   */
  const handleDeleteComment = async (cid) => {
    try {
      await updateFinding(finding.id, {
        ...finding,
        discussions: (finding.discussions || []).filter(d => d.id !== cid),
      })
    } catch {
      showToast('Failed to delete comment', 'error')
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
        <span>Discussion ({discussions.length})</span>
        <span className="ml-auto">{isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</span>
      </button>

      {isOpen && (
        <div className="mt-3 bg-dark-800/60 border border-dark-700 rounded-xl overflow-hidden">
          <div ref={listRef} className="max-h-96 overflow-y-auto p-4 space-y-4">
            {discussions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle size={36} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm">No discussion yet. Start the conversation!</p>
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
                Commenting as <span className="font-semibold text-gray-400">{user.name}</span>
                {user.position && <span className="text-gray-600"> · {user.position}</span>}
                <span className="ml-2 text-gray-700">· Type <span className="text-indigo-500/70 font-mono">@</span> to mention</span>
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
                  <p className="text-sm text-gray-500 flex items-center gap-2"><AtSign size={14} /> No user found with name "{mentionQuery}"</p>
                </div>
              )}

              <div className="flex items-center gap-2 bg-dark-900 border border-dark-700 rounded-xl px-3 py-2.5 focus-within:border-indigo-500/50 transition">
                <input
                  ref={inputRef}
                  className="bg-transparent border-none outline-none text-base text-gray-200 w-full placeholder-gray-500"
                  placeholder="Write a comment... (@ to mention)"
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
