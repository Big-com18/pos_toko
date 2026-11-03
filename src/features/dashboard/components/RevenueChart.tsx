import { addDays, formatCompact, formatRupiah, formatTanggalPendek } from '@/lib/format'
import type { DailyReportRow } from '@/types/models'

interface RevenueChartProps {
  rows: DailyReportRow[]
  /** tanggal terakhir (hari ini), format YYYY-MM-DD */
  to: string
  days: number
}

export function RevenueChart({ rows, to, days }: RevenueChartProps) {
  const byDay = new Map(rows.map((r) => [r.report_day, r.total_revenue] as [string, number]))
  const data = Array.from({ length: days }, (_, i) => {
    const date = addDays(to, -(days - 1 - i))
    return { date, revenue: byDay.get(date) ?? 0 }
  })
  const max = Math.max(1, ...data.map((d) => d.revenue))
  const total = data.reduce((sum, d) => sum + d.revenue, 0)
  const best = data.reduce((a, b) => (b.revenue > a.revenue ? b : a), data[0])
  const showValues = days <= 7

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-x-8 gap-y-2 text-sm">
        <div>
          <p className="text-xs text-slate-400">Total</p>
          <p className="font-semibold tabular-nums">{formatRupiah(total)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Rata-rata per hari</p>
          <p className="font-semibold tabular-nums">{formatRupiah(Math.round(total / days))}</p>
        </div>
        {best && best.revenue > 0 && (
          <div>
            <p className="text-xs text-slate-400">Hari terbaik</p>
            <p className="font-semibold">
              {formatTanggalPendek(best.date)} · {formatRupiah(best.revenue)}
            </p>
          </div>
        )}
      </div>

      <div className="relative">
        {/* garis bantu */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex h-48 flex-col justify-between">
          {[0, 1, 2].map((i) => (
            <div key={i} className="border-t border-dashed border-slate-100" />
          ))}
        </div>

        <div className="relative flex h-48 items-end gap-1.5 sm:gap-2.5">
          {data.map((d, i) => {
            const isToday = i === data.length - 1
            return (
              <div
                key={d.date}
                title={`${formatTanggalPendek(d.date)}: ${formatRupiah(d.revenue)}`}
                className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
              >
                {showValues && d.revenue > 0 && (
                  <span className="text-[10px] font-medium text-slate-400">
                    {formatCompact(d.revenue)}
                  </span>
                )}
                <div
                  className={`w-full rounded-t-lg transition-all ${
                    d.revenue === 0
                      ? 'bg-slate-100'
                      : isToday
                        ? 'bg-emerald-600'
                        : 'bg-emerald-200 hover:bg-emerald-300'
                  }`}
                  style={{ height: `${Math.max((d.revenue / max) * 82, d.revenue > 0 ? 3 : 1.5)}%` }}
                />
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-2 flex gap-1.5 sm:gap-2.5">
        {data.map((d, i) => {
          const show = days <= 7 || i % 5 === 0 || i === data.length - 1
          return (
            <div key={d.date} className="min-w-0 flex-1 text-center text-[10px] text-slate-400">
              {show ? formatTanggalPendek(d.date) : ''}
            </div>
          )
        })}
      </div>
    </div>
  )
}
