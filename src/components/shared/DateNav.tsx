import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'

import { addDays, formatTanggal, todayWita } from '@/lib/format'

import { Button } from './Button'

interface DateNavProps {
  value: string
  onChange: (value: string) => void
}

export function DateNav({ value, onChange }: DateNavProps) {
  const today = todayWita()
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="secondary"
        iconOnly
        aria-label="Hari sebelumnya"
        onClick={() => onChange(addDays(value, -1))}
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <label className="relative flex h-10 min-w-0 flex-1 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium sm:min-w-64 sm:flex-none">
        <CalendarDays className="mr-2 h-4 w-4 shrink-0 text-slate-400" />
        <span className="truncate">{formatTanggal(value)}</span>
        <input
          type="date"
          aria-label="Pilih tanggal"
          value={value}
          onChange={(e) => e.target.value && onChange(e.target.value)}
          onClick={(e) => {
            try {
              e.currentTarget.showPicker()
            } catch {
              // browser lama: abaikan
            }
          }}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>
      <Button
        variant="secondary"
        iconOnly
        aria-label="Hari berikutnya"
        onClick={() => onChange(addDays(value, 1))}
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
      {value !== today && (
        <Button variant="soft" onClick={() => onChange(today)}>
          Hari ini
        </Button>
      )}
    </div>
  )
}
