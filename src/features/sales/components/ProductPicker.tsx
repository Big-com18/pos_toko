import { Plus } from 'lucide-react'

import { Badge } from '@/components/shared/Badge'
import { Card } from '@/components/shared/Card'
import { ProductAvatar } from '@/components/shared/ProductAvatar'
import { formatNumber, formatRupiah } from '@/lib/format'
import { packPrice } from '@/lib/pricing'
import type { Product, UnitType } from '@/types/models'

import { useCartStore } from '../store/cartStore'

interface ProductPickerProps {
  products: Product[]
  stockMap: Map<string, number>
}

export function ProductPicker({ products, stockMap }: ProductPickerProps) {
  const add = useCartStore((s) => s.add)
  const lines = useCartStore((s) => s.lines)
  const qtyMap = new Map(lines.map((l) => [l.key, l.quantity] as [string, number]))

  function handleAdd(p: Product, unitType: UnitType) {
    if (unitType === 'pack') {
      const price = packPrice(p)
      if (price === null || !p.pack_unit || !p.pack_size) return
      add({
        productId: p.id,
        productName: p.name,
        unitType: 'pack',
        unitLabel: p.pack_unit,
        price,
        multiplier: p.pack_size,
        baseUnit: p.unit,
      })
      return
    }
    add({
      productId: p.id,
      productName: p.name,
      unitType: 'unit',
      unitLabel: p.unit,
      price: p.unit_price,
      multiplier: 1,
      baseUnit: p.unit,
    })
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {products.map((p) => {
        const stock = stockMap.get(p.id)
        const pp = packPrice(p)
        const unitQty = qtyMap.get(`${p.id}:unit`) ?? 0
        const packQty = qtyMap.get(`${p.id}:pack`) ?? 0
        return (
          <li key={p.id}>
            <Card className="h-full p-3.5">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                  <ProductAvatar name={p.name} size="sm" />
                  <h3 className="truncate font-semibold leading-tight">{p.name}</h3>
                </div>
                {stock !== undefined &&
                  (stock <= 0 ? (
                    <Badge tone="danger">Habis</Badge>
                  ) : stock <= p.min_stock ? (
                    <Badge tone="warning">
                      Sisa {formatNumber(stock)} {p.unit}
                    </Badge>
                  ) : (
                    <span className="shrink-0 text-xs text-slate-400">
                      {formatNumber(stock)} {p.unit}
                    </span>
                  ))}
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleAdd(p, 'unit')}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl border-2 px-3.5 py-3 text-left transition active:scale-[0.98] ${
                    unitQty > 0
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40'
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">Per {p.unit}</span>
                    <span className="block text-xs text-slate-500">eceran</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="text-sm font-bold tabular-nums text-emerald-700">
                      {formatRupiah(p.unit_price)}
                    </span>
                    {unitQty > 0 ? (
                      <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-emerald-600 px-1.5 text-xs font-bold text-white">
                        {formatNumber(unitQty)}
                      </span>
                    ) : (
                      <Plus className="h-4 w-4 text-slate-400" />
                    )}
                  </span>
                </button>

                {pp !== null && p.pack_unit && p.pack_size && (
                  <button
                    type="button"
                    onClick={() => handleAdd(p, 'pack')}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl border-2 px-3.5 py-3 text-left transition active:scale-[0.98] ${
                      packQty > 0
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40'
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">Per {p.pack_unit}</span>
                      <span className="block text-xs text-slate-500">
                        isi {formatNumber(p.pack_size)} {p.unit}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="text-sm font-bold tabular-nums text-emerald-700">
                        {formatRupiah(pp)}
                      </span>
                      {packQty > 0 ? (
                        <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-emerald-600 px-1.5 text-xs font-bold text-white">
                          {formatNumber(packQty)}
                        </span>
                      ) : (
                        <Plus className="h-4 w-4 text-slate-400" />
                      )}
                    </span>
                  </button>
                )}
              </div>
            </Card>
          </li>
        )
      })}
    </ul>
  )
}
