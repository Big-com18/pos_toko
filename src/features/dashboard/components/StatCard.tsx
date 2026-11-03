import { ArrowDownRight, ArrowUpRight, type LucideIcon } from 'lucide-react'

import { Card } from '@/components/shared/Card'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string
  tile: string
  /** persen perubahan; null = belum ada pembanding; undefined = tidak ditampilkan */
  delta?: number | null
  caption?: string
}

function Delta({ value }: { value: number | null }) {
  if (value === null) {
    return (
      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
        baru
      </span>
    )
  }
  const up = value >= 0
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
        up ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
      }`}
    >
      {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {Math.abs(Math.round(value))}%
    </span>
  )
}

export function StatCard({ icon: Icon, label, value, tile, delta, caption }: StatCardProps) {
  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-slate-500">{label}</p>
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${tile}`}>
          <Icon className="h-[18px] w-[18px]" />
        </div>
      </div>
      <p className="truncate text-2xl font-bold tabular-nums tracking-tight">{value}</p>
      <div className="mt-2 flex min-h-5 items-center gap-2 text-xs text-slate-500">
        {delta !== undefined && <Delta value={delta} />}
        {caption && <span className="truncate">{caption}</span>}
      </div>
    </Card>
  )
}
