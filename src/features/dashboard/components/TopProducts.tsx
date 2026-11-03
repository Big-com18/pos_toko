import { useState } from 'react'

import { Card } from '@/components/shared/Card'
import { ProductAvatar } from '@/components/shared/ProductAvatar'
import { formatNumber, formatRupiah } from '@/lib/format'
import type { ProductReportRow } from '@/types/models'

type Mode = 'sales' | 'profit'

export function TopProducts({ rows }: { rows: ProductReportRow[] }) {
  const [mode, setMode] = useState<Mode>('sales')

  const hasProfit = rows.some((r) => r.profit !== null)
  const list =
    mode === 'sales'
      ? rows.slice(0, 6)
      : rows
          .filter((r) => r.profit !== null)
          .sort((a, b) => (b.profit ?? 0) - (a.profit ?? 0))
          .slice(0, 6)
  const valueOf = (r: ProductReportRow) => (mode === 'sales' ? r.revenue : (r.profit ?? 0))
  const max = Math.max(1, ...list.map((r) => valueOf(r)))

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-bold">{mode === 'sales' ? 'Barang terlaris' : 'Barang paling untung'}</h2>
        <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMode('sales')}
            className={`rounded-md px-3 py-1 transition ${
              mode === 'sales' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            Terlaris
          </button>
          <button
            type="button"
            onClick={() => setMode('profit')}
            className={`rounded-md px-3 py-1 transition ${
              mode === 'profit' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            Untung
          </button>
        </div>
      </div>

      {list.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">
          {mode === 'profit' && !hasProfit && rows.length > 0
            ? 'Isi modal barang di halaman Barang & Stok untuk melihat keuntungan.'
            : 'Belum ada penjualan di periode ini.'}
        </p>
      ) : (
        <ul className="space-y-4">
          {list.map((r, i) => (
            <li key={r.product_id} className="flex items-center gap-3">
              <span className="w-4 text-center text-xs font-semibold text-slate-300">{i + 1}</span>
              <ProductAvatar name={r.product_name} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="truncate font-semibold">{r.product_name}</span>
                  <span
                    className={`shrink-0 font-bold tabular-nums ${
                      valueOf(r) < 0 ? 'text-rose-600' : ''
                    }`}
                  >
                    {formatRupiah(valueOf(r))}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${mode === 'sales' ? 'bg-emerald-500' : 'bg-violet-500'}`}
                    style={{ width: `${(Math.max(0, valueOf(r)) / max) * 100}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {formatNumber(r.qty_base)} terjual
                  {mode === 'sales' && r.profit !== null ? ` · untung ${formatRupiah(r.profit)}` : ''}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
