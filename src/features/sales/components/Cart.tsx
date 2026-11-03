import { AlertTriangle, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/shared/Button'
import { Card } from '@/components/shared/Card'
import { Field } from '@/components/shared/Field'
import { useToast } from '@/components/shared/toastContext'
import { toMessage } from '@/lib/errors'
import { formatNumber, formatRupiah } from '@/lib/format'

import { useCreateSale } from '../hooks/useCreateSale'
import { useCartStore } from '../store/cartStore'
import { QtyInput } from './QtyInput'

interface CartProps {
  stockMap: Map<string, number>
  /** true = dipakai di dalam sheet (tanpa kartu pembungkus) */
  embedded?: boolean
  onDone?: () => void
}

export function Cart({ stockMap, embedded = false, onDone }: CartProps) {
  const lines = useCartStore((s) => s.lines)
  const setQuantity = useCartStore((s) => s.setQuantity)
  const clear = useCartStore((s) => s.clear)
  const [note, setNote] = useState('')
  const createSale = useCreateSale()
  const { notify } = useToast()

  const total = lines.reduce((sum, l) => sum + Math.round(l.price * l.quantity), 0)

  // Total pemakaian stok per barang (bisa dari satuan eceran + pak sekaligus)
  const usage = new Map<string, { name: string; unit: string; qty: number }>()
  for (const l of lines) {
    const prev = usage.get(l.productId)
    const qty = (prev?.qty ?? 0) + l.quantity * l.multiplier
    usage.set(l.productId, { name: l.productName, unit: l.baseUnit, qty })
  }
  const warnings: string[] = []
  for (const [productId, u] of usage) {
    const stock = stockMap.get(productId)
    if (stock !== undefined && u.qty > stock) {
      warnings.push(`${u.name}: butuh ${formatNumber(u.qty)} ${u.unit}, stok ${formatNumber(stock)}`)
    }
  }

  async function submit() {
    try {
      await createSale.mutateAsync({
        items: lines.map((l) => ({
          product_id: l.productId,
          unit_type: l.unitType,
          quantity: l.quantity,
        })),
        note: note.trim() || null,
      })
      clear()
      setNote('')
      notify('Transaksi tersimpan')
      onDone?.()
    } catch (e) {
      notify(toMessage(e), 'error')
    }
  }

  const content = (
    <div>
      <div className="mb-1 flex items-center justify-between">
        {!embedded && <h2 className="text-lg font-bold">Keranjang</h2>}
        {lines.length > 0 && (
          <Button variant="ghost" size="sm" className={embedded ? 'ml-auto' : ''} onClick={clear}>
            Kosongkan
          </Button>
        )}
      </div>

      {lines.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-center text-slate-400">
          <ShoppingCart className="mb-2 h-10 w-10" />
          <p className="text-sm">Ketuk barang di daftar untuk mulai mencatat penjualan.</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {lines.map((l) => (
            <li key={l.key} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{l.productName}</p>
                <p className="truncate text-xs text-slate-500">
                  per {l.unitLabel} · {formatRupiah(l.price)}
                </p>
              </div>
              <div className="flex items-center rounded-xl border border-slate-200">
                <button
                  type="button"
                  aria-label="Kurangi"
                  onClick={() => setQuantity(l.key, l.quantity - 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-l-xl text-slate-600 hover:bg-slate-50"
                >
                  {l.quantity <= 1 ? (
                    <Trash2 className="h-4 w-4 text-rose-500" />
                  ) : (
                    <Minus className="h-4 w-4" />
                  )}
                </button>
                <QtyInput
                  label={`Jumlah ${l.productName}`}
                  value={l.quantity}
                  onCommit={(n) => setQuantity(l.key, n)}
                />
                <button
                  type="button"
                  aria-label="Tambah"
                  onClick={() => setQuantity(l.key, l.quantity + 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-r-xl text-slate-600 hover:bg-slate-50"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <p className="w-20 text-right text-sm font-bold tabular-nums">
                {formatRupiah(Math.round(l.price * l.quantity))}
              </p>
            </li>
          ))}
        </ul>
      )}

      {warnings.length > 0 && (
        <div className="mt-3 flex gap-2.5 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Stok di sistem tidak cukup</p>
            <ul className="mt-1 space-y-0.5">
              {warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
            <p className="mt-1.5">Transaksi tetap bisa disimpan. Kabari owner untuk cek stok fisik.</p>
          </div>
        </div>
      )}

      {lines.length > 0 && (
        <>
          <Field
            aria-label="Catatan"
            placeholder="Catatan (opsional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-4"
          />
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
            <span className="text-slate-500">Total</span>
            <span className="text-2xl font-bold tabular-nums">{formatRupiah(total)}</span>
          </div>
          <Button size="lg" className="mt-4 w-full" onClick={submit} disabled={createSale.isPending}>
            {createSale.isPending ? 'Menyimpan…' : 'Simpan transaksi'}
          </Button>
        </>
      )}
    </div>
  )

  if (embedded) return content
  return <Card className="p-5 lg:sticky lg:top-8">{content}</Card>
}
