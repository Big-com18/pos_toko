import { Ban } from 'lucide-react'

import { Badge } from '@/components/shared/Badge'
import { Button } from '@/components/shared/Button'
import { Card } from '@/components/shared/Card'
import { formatJam, formatNumber, formatRupiah } from '@/lib/format'
import type { Sale } from '@/types/models'

interface SaleCardProps {
  sale: Sale
  showCashier: boolean
  onVoid?: (sale: Sale) => void
}

export function SaleCard({ sale, showCashier, onVoid }: SaleCardProps) {
  const voided = !!sale.voided_at
  return (
    <Card className={`p-4 ${voided ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{formatJam(sale.sold_at)}</p>
          <p className="text-xs text-slate-500">
            {showCashier && sale.profiles?.full_name ? `oleh ${sale.profiles.full_name}` : ' '}
            {sale.note ? `${showCashier && sale.profiles?.full_name ? ' · ' : ''}${sale.note}` : ''}
          </p>
        </div>
        <div className="text-right">
          <p className={`text-lg font-bold tabular-nums ${voided ? 'line-through' : ''}`}>
            {formatRupiah(sale.total)}
          </p>
          {voided && <Badge tone="danger">Dibatalkan</Badge>}
        </div>
      </div>

      <ul className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-sm">
        {sale.sale_items.map((it) => (
          <li key={it.id} className="flex justify-between gap-3">
            <span className="min-w-0 truncate">
              {formatNumber(it.quantity)} {it.unit_label} {it.products?.name ?? 'Barang'}
            </span>
            <span className="shrink-0 tabular-nums text-slate-600">{formatRupiah(it.subtotal)}</span>
          </li>
        ))}
      </ul>

      {onVoid && !voided && (
        <div className="mt-3 flex justify-end">
          <Button variant="ghost" size="sm" onClick={() => onVoid(sale)}>
            <Ban className="h-4 w-4" />
            Batalkan
          </Button>
        </div>
      )}
    </Card>
  )
}
