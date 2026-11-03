import { Receipt } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Card } from '@/components/shared/Card'
import { Loading } from '@/components/shared/States'
import { useHistory } from '@/features/history/hooks/useHistory'
import { formatJam, formatRupiah } from '@/lib/format'

interface TodayPanelProps {
  today: string
  /** keuntungan hari ini; null = modal belum diisi */
  profit: number | null
}

export function TodayPanel({ today, profit }: TodayPanelProps) {
  const { data, isPending } = useHistory(today)

  const valid = (data ?? []).filter((s) => !s.voided_at)
  const revenue = valid.reduce((sum, s) => sum + s.total, 0)
  const latest = valid.slice(0, 5)

  // Penjualan per kasir hari ini
  const perCashier = new Map<string, number>()
  for (const s of valid) {
    const name = s.profiles?.full_name ?? 'Tanpa nama'
    perCashier.set(name, (perCashier.get(name) ?? 0) + s.total)
  }
  const cashiers = Array.from(perCashier.entries()).sort((a, b) => b[1] - a[1])

  return (
    <Card className="flex h-full flex-col p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-bold">Hari ini</h2>
        <Link to="/riwayat" className="text-sm font-medium text-emerald-700 hover:underline">
          Lihat semua
        </Link>
      </div>

      {isPending ? (
        <Loading />
      ) : (
        <>
          <p className="mt-3 text-3xl font-bold tabular-nums tracking-tight">{formatRupiah(revenue)}</p>
          <p className="text-sm text-slate-500">
            {valid.length} transaksi
            {profit !== null && (
              <>
                {' · '}
                <span className={profit < 0 ? 'font-semibold text-rose-600' : 'font-semibold text-emerald-700'}>
                  untung {formatRupiah(profit)}
                </span>
              </>
            )}
          </p>

          {cashiers.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {cashiers.map(([name, total]) => (
                <span
                  key={name}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                >
                  {name} · {formatRupiah(total)}
                </span>
              ))}
            </div>
          )}

          <div className="mt-5 flex-1 border-t border-slate-100 pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Transaksi terakhir
            </p>
            {latest.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-center text-slate-400">
                <Receipt className="mb-2 h-8 w-8" />
                <p className="text-sm">Belum ada transaksi hari ini.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {latest.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {s.sale_items
                          .slice(0, 2)
                          .map((i) => i.products?.name ?? 'Barang')
                          .join(', ')}
                        {s.sale_items.length > 2 ? ` +${s.sale_items.length - 2}` : ''}
                      </p>
                      <p className="text-xs text-slate-400">{formatJam(s.sold_at)}</p>
                    </div>
                    <span className="shrink-0 font-semibold tabular-nums">{formatRupiah(s.total)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </Card>
  )
}
