import { useEffect } from 'react'
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react'
import { useFindings } from '../context/FindingsContext'

/**
 * Toast — a global pop-up notification component.
 *
 * Reads the active toast state from FindingsContext (showToast triggers it).
 * Renders a floating pill at the bottom-right corner of the screen.
 * Auto-dismisses after 3.5 seconds (the timer is managed in FindingsContext).
 *
 * Renders nothing when there is no active toast.
 */
export default function Toast() {
  const { toast } = useFindings() // { message: string, type: 'success'|'error'|'info' } | null
  if (!toast) return null

  // Background color per toast type
  const styles = {
    success: 'bg-emerald-600/90',
    error:   'bg-red-600/90',
    info:    'bg-indigo-600/90',
  }

  // Leading icon per toast type
  const icons = {
    success: <CheckCircle2 size={17} />,
    error:   <AlertTriangle size={17} />,
    info:    <Info size={17} />,
  }

  return (
    <div className={`toast fixed bottom-6 right-6 z-[9999] ${styles[toast.type] || styles.info} text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-sm font-medium max-w-sm`}>
      {icons[toast.type] || icons.info}
      {toast.message}
    </div>
  )
}
