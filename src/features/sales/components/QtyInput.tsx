import { useState } from 'react'

import { parseNumber } from '@/lib/format'

interface QtyInputProps {
  value: number
  onCommit: (value: number) => void
  label: string
}

/** Input jumlah yang bisa diketik (boleh desimal, misal 0,5 kg). */
export function QtyInput({ value, onCommit, label }: QtyInputProps) {
  const [draft, setDraft] = useState<string | null>(null)

  return (
    <input
      aria-label={label}
      inputMode="decimal"
      value={draft ?? String(value)}
      onFocus={(e) => {
        setDraft(String(value))
        e.currentTarget.select()
      }}
      onChange={(e) => {
        setDraft(e.target.value)
        const n = parseNumber(e.target.value)
        if (e.target.value.trim() !== '' && Number.isFinite(n) && n > 0) onCommit(n)
      }}
      onBlur={() => setDraft(null)}
      className="h-9 w-14 border-x border-slate-200 bg-white text-center text-sm font-semibold tabular-nums outline-none focus:bg-emerald-50"
    />
  )
}
