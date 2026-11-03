import { CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/shared/Badge'
import { Card } from '@/components/shared/Card'
import { ProductAvatar } from '@/components/shared/ProductAvatar'
import { formatNumber } from '@/lib/format'
import type { StockRow } from '@/types/models'

export function LowStockCard({ rows }: { rows: StockRow[] }) {
  return (
    <Card className="flex h-full flex-col p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-bold">Perlu restock</h2>
        {rows.length > 0 && (
          <Link to="/barang" className="text-sm font-medium text-emerald-700 hover:underline">
            Kelola stok
          </Link>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-8 text-center text-slate-400">
          <CheckCircle2 className="mb-2 h-9 w-9 text-emerald-400" />
          <p className="text-sm">Semua stok masih aman.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.slice(0, 7).map((s) => (
            <li key={s.id} className="flex items-center gap-3">
              <ProductAvatar name={s.name} size="sm" />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{s.name}</span>
              <Badge tone={s.stock <= 0 ? 'danger' : 'warning'}>
                {s.stock <= 0 ? 'Habis' : `${formatNumber(s.stock)} ${s.unit}`}
              </Badge>
            </li>
          ))}
          {rows.length > 7 && (
            <li className="pt-1 text-center text-xs text-slate-400">+{rows.length - 7} barang lainnya</li>
          )}
        </ul>
      )}
    </Card>
  )
}
