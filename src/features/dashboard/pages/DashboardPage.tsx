import { AlertTriangle, Receipt, TrendingUp, Wallet } from 'lucide-react'
import { useState } from 'react'

import { Card } from '@/components/shared/Card'
import { Chip } from '@/components/shared/Chip'
import { ErrorState, Loading } from '@/components/shared/States'
import { useProfile } from '@/features/auth/hooks/useAuth'
import { useStock } from '@/features/stock/hooks/useStock'
import { addDays, formatRupiah, formatTanggal, greeting, todayWita } from '@/lib/format'
import type { DailyReportRow } from '@/types/models'

import { LowStockCard } from '../components/LowStockCard'
import { RevenueChart } from '../components/RevenueChart'
import { StatCard } from '../components/StatCard'
import { TodayPanel } from '../components/TodayPanel'
import { TopProducts } from '../components/TopProducts'
import { useDailyReport, useProductReport } from '../hooks/useReports'

type Range = 'today' | '7' | '30'

const RANGES: { key: Range; label: string; days: number; vs: string }[] = [
  { key: 'today', label: 'Hari ini', days: 1, vs: 'dibanding kemarin' },
  { key: '7', label: '7 hari', days: 7, vs: 'dibanding 7 hari sebelumnya' },
  { key: '30', label: '30 hari', days: 30, vs: 'dibanding 30 hari sebelumnya' },
]

function sumRange(rows: DailyReportRow[], from: string, to: string) {
  const inRange = rows.filter((r) => r.report_day >= from && r.report_day <= to)
  return {
    revenue: inRange.reduce((sum, r) => sum + r.total_revenue, 0),
    trx: inRange.reduce((sum, r) => sum + r.trx_count, 0),
  }
}

/** persen perubahan. null = belum ada pembanding, undefined = tidak perlu ditampilkan */
function change(current: number, previous: number): number | null | undefined {
  if (previous > 0) return ((current - previous) / previous) * 100
  return current > 0 ? null : undefined
}

export default function DashboardPage() {
  const today = todayWita()
  const [range, setRange] = useState<Range>('7')
  const { data: profile } = useProfile()

  const cfg = RANGES.find((r) => r.key === range) ?? RANGES[1]
  const days = cfg.days
  const from = addDays(today, -(days - 1))
  const prevTo = addDays(from, -1)
  const prevFrom = addDays(prevTo, -(days - 1))

  const daily = useDailyReport(addDays(today, -59), today)
  const products = useProductReport(from, today)
  const stock = useStock()

  const rows = daily.data ?? []
  const cur = sumRange(rows, from, today)
  const prev = sumRange(rows, prevFrom, prevTo)
  const average = cur.trx > 0 ? Math.round(cur.revenue / cur.trx) : 0
  const prevAverage = prev.trx > 0 ? Math.round(prev.revenue / prev.trx) : 0
  const lowStock = (stock.data ?? []).filter((s) => s.is_low)

  const loading = daily.isPending || products.isPending || stock.isPending
  const error = daily.error ?? products.error ?? stock.error
  const firstName = (profile?.full_name ?? '').split(' ')[0] || 'Owner'
  const chartDays = days === 30 ? 30 : 7

  return (
    <>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{formatTanggal(today)}</p>
          <h1 className="text-2xl font-bold tracking-tight">
            {greeting()}, {firstName}
          </h1>
        </div>
        <div className="flex gap-2">
          {RANGES.map((r) => (
            <Chip key={r.key} active={range === r.key} onClick={() => setRange(r.key)}>
              {r.label}
            </Chip>
          ))}
        </div>
      </div>

      {loading && <Loading />}
      {error && <ErrorState error={error} onRetry={() => daily.refetch()} />}

      {!loading && !error && (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={Wallet}
              label="Pendapatan"
              value={formatRupiah(cur.revenue)}
              tile="bg-emerald-50 text-emerald-600"
              delta={change(cur.revenue, prev.revenue)}
              caption={cfg.vs}
            />
            <StatCard
              icon={Receipt}
              label="Transaksi"
              value={String(cur.trx)}
              tile="bg-sky-50 text-sky-600"
              delta={change(cur.trx, prev.trx)}
              caption={cfg.vs}
            />
            <StatCard
              icon={TrendingUp}
              label="Rata-rata per transaksi"
              value={formatRupiah(average)}
              tile="bg-violet-50 text-violet-600"
              delta={change(average, prevAverage)}
              caption={cfg.vs}
            />
            <StatCard
              icon={AlertTriangle}
              label="Perlu restock"
              value={`${lowStock.length} barang`}
              tile={lowStock.length > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-400'}
              caption={lowStock.length > 0 ? 'stok di bawah minimum' : 'semua stok aman'}
            />
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <Card className="p-5 lg:col-span-2">
              <h2 className="mb-4 font-bold">Pendapatan {chartDays} hari terakhir</h2>
              <RevenueChart rows={rows} to={today} days={chartDays} />
            </Card>
            <TodayPanel today={today} />
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <TopProducts rows={products.data ?? []} />
            </div>
            <LowStockCard rows={lowStock} />
          </div>
        </div>
      )}
    </>
  )
}
