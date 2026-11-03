import { CheckCircle2, XCircle } from 'lucide-react'
import { type ReactNode, useCallback, useMemo, useState } from 'react'

import { ToastContext, type ToastType } from '@/components/shared/toastContext'

interface ToastItem {
  id: number
  message: string
  type: ToastType
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const notify = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now() + Math.random()
    setItems((prev) => [...prev, { id, message, type }])
    window.setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 3500)
  }, [])

  const value = useMemo(() => ({ notify }), [notify])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-6">
        {items.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex max-w-md items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-medium text-white shadow-xl ${
              t.type === 'error' ? 'bg-rose-600' : 'bg-slate-900'
            }`}
          >
            {t.type === 'error' ? (
              <XCircle className="h-5 w-5 shrink-0" />
            ) : (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
            )}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
