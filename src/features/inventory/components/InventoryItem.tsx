import { ClipboardCheck, History, PackagePlus, Pencil } from 'lucide-react'

import { Badge } from '@/components/shared/Badge'
import { Button } from '@/components/shared/Button'
import { Card } from '@/components/shared/Card'
import { ProductAvatar } from '@/components/shared/ProductAvatar'
import { Switch } from '@/components/shared/Switch'
import { formatNumber, formatRupiah, formatStockPack } from '@/lib/format'
import { packPrice } from '@/lib/pricing'
import type { Product, StockRow } from '@/types/models'

interface InventoryItemProps {
  product: Product
  stock: StockRow | undefined
  onEdit: (p: Product) => void
  onToggle: (p: Product, isActive: boolean) => void
  onRestock: (row: StockRow) => void
  onAdjust: (row: StockRow) => void
  onHistory: (row: StockRow) => void
}

function level(row: StockRow) {
  const target = Math.max(row.min_stock * 2, 1)
  const pct = Math.max(0, Math.min(100, (row.stock / target) * 100))
  if (row.stock <= 0) return { pct: 0, bar: 'bg-rose-500', text: 'text-rose-600' }
  if (row.is_low) return { pct, bar: 'bg-amber-500', text: 'text-amber-600' }
  return { pct: row.min_stock === 0 ? 100 : pct, bar: 'bg-emerald-500', text: 'text-slate-900' }
}

export function InventoryItem({
  product: p,
  stock,
  onEdit,
  onToggle,
  onRestock,
  onAdjust,
  onHistory,
}: InventoryItemProps) {
  const pp = packPrice(p)
  const lv = stock ? level(stock) : null
  const packText = stock ? formatStockPack(stock.stock, p.unit, p.pack_unit, p.pack_size) : ''

  return (
    <Card className={`flex h-full flex-col p-5 ${p.is_active ? '' : 'bg-slate-50 opacity-80'}`}>
      {/* Kepala: nama + aksi */}
      <div className="flex items-start gap-3">
        <ProductAvatar name={p.name} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-semibold">{p.name}</h3>
            {p.category && <Badge>{p.category}</Badge>}
            {!p.is_active && <Badge tone="warning">Nonaktif</Badge>}
          </div>
          <p className="mt-0.5 text-sm text-slate-500">
            <span className="font-semibold text-slate-800">{formatRupiah(p.unit_price)}</span> / {p.unit}
            {pp !== null && p.pack_unit && p.pack_size && (
              <>
                {' · '}
                <span className="font-semibold text-slate-800">{formatRupiah(pp)}</span> / {p.pack_unit}
                <span className="text-slate-400"> (isi {formatNumber(p.pack_size)})</span>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" iconOnly aria-label={`Ubah ${p.name}`} onClick={() => onEdit(p)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Switch
            checked={p.is_active}
            label={`Aktifkan ${p.name}`}
            onChange={(v) => onToggle(p, v)}
          />
        </div>
      </div>

      {/* Stok */}
      {stock && lv && (
        <>
          <div className="mt-5 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Stok</p>
              <p className={`text-3xl font-bold tabular-nums tracking-tight ${lv.text}`}>
                {formatNumber(stock.stock)}
                <span className="ml-1.5 text-sm font-medium text-slate-500">{p.unit}</span>
              </p>
              {packText && <p className="text-xs text-slate-500">≈ {packText}</p>}
            </div>
            <div className="text-right">
              {stock.stock <= 0 ? (
                <Badge tone="danger">Habis</Badge>
              ) : stock.is_low ? (
                <Badge tone="warning">Hampir habis</Badge>
              ) : (
                <Badge tone="success">Aman</Badge>
              )}
              <p className="mt-1 text-xs text-slate-400">minimum {formatNumber(p.min_stock)}</p>
            </div>
          </div>

          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className={`h-full rounded-full ${lv.bar}`} style={{ width: `${lv.pct}%` }} />
          </div>

          <div className="mt-auto grid grid-cols-3 gap-2 pt-5">
            <Button variant="soft" onClick={() => onRestock(stock)}>
              <PackagePlus className="h-4 w-4" />
              Tambah
            </Button>
            <Button variant="secondary" onClick={() => onAdjust(stock)}>
              <ClipboardCheck className="h-4 w-4" />
              Koreksi
            </Button>
            <Button variant="ghost" onClick={() => onHistory(stock)}>
              <History className="h-4 w-4" />
              Riwayat
            </Button>
          </div>
        </>
      )}

      {!p.is_active && (
        <p className="mt-4 text-sm text-slate-500">
          Barang nonaktif tidak muncul di kasir. Aktifkan lagi dengan saklar di kanan atas.
        </p>
      )}
    </Card>
  )
}
