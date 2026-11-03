import { Card } from '@/components/shared/Card'
import { ProductAvatar } from '@/components/shared/ProductAvatar'
import { formatNumber, formatRupiah } from '@/lib/format'
import type { ProductReportRow } from '@/types/models'

export function TopProducts({ rows }: { rows: ProductReportRow[] }) {
  const top = rows.slice(0, 6)
  const max = Math.max(1, ...top.map((r) => r.revenue))

  return (
    <Card className="p-5">
      <h2 className="mb-4 font-bold">Barang terlaris</h2>
      {top.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">Belum ada penjualan di periode ini.</p>
      ) : (
        <ul className="space-y-4">
          {top.map((r, i) => (
            <li key={r.product_id} className="flex items-center gap-3">
              <span className="w-4 text-center text-xs font-semibold text-slate-300">{i + 1}</span>
              <ProductAvatar name={r.product_name} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="truncate font-semibold">{r.product_name}</span>
                  <span className="shrink-0 font-bold tabular-nums">{formatRupiah(r.revenue)}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${(r.revenue / max) * 100}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-400">{formatNumber(r.qty_base)} terjual</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
