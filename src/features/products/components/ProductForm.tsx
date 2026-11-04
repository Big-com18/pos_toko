import { zodResolver } from '@hookform/resolvers/zod'
import { Calculator } from 'lucide-react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/shared/Button'
import { Field } from '@/components/shared/Field'
import { formatNumber, formatRupiah, parseNumber } from '@/lib/format'
import type { Product, ProductCost } from '@/types/models'

import type { CostInput, ProductInput } from '../api/productsApi'
import { type ProductFormValues, productSchema } from '../schemas/productSchema'

interface ProductFormProps {
  initial?: Product
  initialCost?: ProductCost
  submitting: boolean
  onSubmit: (input: ProductInput, initialStock: number, cost: CostInput) => void
  onCancel: () => void
}

/** Isi awal kolom modal saat mengubah barang. */
function initialCostFields(initial?: Product, cost?: ProductCost): { total: string; qty: string } {
  if (!initial || !cost) return { total: '', qty: '' }
  const fallbackQty = initial.pack_size ?? 1
  const qty = cost.cost_qty ?? fallbackQty
  const total = cost.cost_total ?? Math.round(cost.cost_price * qty)
  return { total: String(total), qty: String(qty) }
}

export function ProductForm({ initial, initialCost, submitting, onSubmit, onCancel }: ProductFormProps) {
  const costDefaults = initialCostFields(initial, initialCost)
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initial?.name ?? '',
      category: initial?.category ?? '',
      unit: initial?.unit ?? 'pcs',
      unit_price: initial ? String(initial.unit_price) : '',
      has_pack: !!initial?.pack_unit,
      pack_unit: initial?.pack_unit ?? 'pak',
      pack_size: initial?.pack_size ? String(initial.pack_size) : '',
      pack_price: initial?.pack_price != null ? String(initial.pack_price) : '',
      min_stock: initial ? String(initial.min_stock) : '0',
      initial_stock: '',
      cost: costDefaults.total,
      cost_qty: costDefaults.qty,
    },
  })

  const hasPack = watch('has_pack')
  const unit = watch('unit') || 'satuan'
  const packUnit = watch('pack_unit') || 'pak'
  const unitPriceText = watch('unit_price')
  const packPriceText = watch('pack_price')
  const costText = watch('cost')
  const costQtyText = watch('cost_qty')

  const unitPrice = parseNumber(unitPriceText || '')
  const packSize = parseNumber(watch('pack_size') || '')
  const packPrice = parseNumber(packPriceText || '')
  const costTotal = parseNumber(costText || '')

  const unitPriceOk = unitPriceText !== '' && Number.isFinite(unitPrice)
  const packSizeOk = hasPack && packSize > 0
  const packPriceOk = packSizeOk && packPriceText !== '' && Number.isFinite(packPrice)
  const costOk = costText !== '' && Number.isFinite(costTotal) && costTotal >= 0

  // Jumlah yang didapat dari pembelian: diketik owner; kalau kosong dianggap 1 pak (atau 1 satuan)
  const defaultQty = packSizeOk ? packSize : 1
  const qtyTyped = costQtyText !== ''
  const costQty = qtyTyped ? parseNumber(costQtyText) : defaultQty
  const qtyOk = Number.isFinite(costQty) && costQty > 0

  // modal per satuan eceran, dihitung otomatis
  const costPerUnit = costOk && qtyOk ? costTotal / costQty : null

  function suggest() {
    if (!packPriceOk) return
    setValue('unit_price', String(Math.round(packPrice / packSize)), { shouldValidate: true })
  }

  const submit = handleSubmit((v) => {
    let cost: CostInput = null
    if (v.cost) {
      const total = parseNumber(v.cost)
      const fallback = v.has_pack ? parseNumber(v.pack_size) : 1
      const qty = v.cost_qty ? parseNumber(v.cost_qty) : fallback
      cost = { cost_price: total / qty, cost_total: total, cost_qty: qty }
    }
    onSubmit(
      {
        name: v.name,
        category: v.category === '' ? null : v.category,
        unit: v.unit,
        unit_price: parseNumber(v.unit_price),
        pack_unit: v.has_pack ? v.pack_unit : null,
        pack_size: v.has_pack ? parseNumber(v.pack_size) : null,
        pack_price: v.has_pack ? parseNumber(v.pack_price) : null,
        min_stock: parseNumber(v.min_stock),
      },
      initial || !v.initial_stock ? 0 : parseNumber(v.initial_stock),
      cost,
    )
  })

  // ringkasan untung
  const profitUnit = costPerUnit !== null && unitPriceOk ? unitPrice - costPerUnit : null
  const marginUnit =
    profitUnit !== null && unitPrice > 0 ? Math.round((profitUnit / unitPrice) * 100) : null
  const profitPack =
    costPerUnit !== null && packPriceOk ? packPrice - costPerUnit * packSize : null

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <Field label="Nama barang" placeholder="Contoh: Gelas" error={errors.name?.message} {...register('name')} />
      <Field
        label="Kategori (opsional)"
        placeholder="Contoh: Perlengkapan"
        error={errors.category?.message}
        {...register('category')}
      />

      <div className="rounded-2xl border border-slate-200 p-4">
        <p className="mb-3 text-sm font-semibold">Dijual eceran</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Satuan" placeholder="pcs" error={errors.unit?.message} {...register('unit')} />
          <Field
            label={`Harga jual per ${unit} (Rp)`}
            inputMode="decimal"
            placeholder="2000"
            error={errors.unit_price?.message}
            {...register('unit_price')}
          />
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 p-4">
        <input type="checkbox" className="h-5 w-5 accent-emerald-600" {...register('has_pack')} />
        <span>
          <span className="block text-sm font-semibold">Juga dijual per pak / dus</span>
          <span className="block text-xs text-slate-500">
            Contoh: 1 pak isi 12 pcs. Stok tetap dihitung per {unit}.
          </span>
        </span>
      </label>

      {hasPack && (
        <div className="space-y-3 rounded-2xl border border-slate-200 p-4">
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Satuan besar"
              placeholder="pak"
              error={errors.pack_unit?.message}
              {...register('pack_unit')}
            />
            <Field
              label={`Isi (${unit} per ${packUnit})`}
              inputMode="decimal"
              placeholder="12"
              error={errors.pack_size?.message}
              {...register('pack_size')}
            />
          </div>
          <Field
            label={`Harga jual per ${packUnit} (Rp)`}
            inputMode="decimal"
            placeholder="20000"
            error={errors.pack_price?.message}
            {...register('pack_price')}
          />
          <Button variant="soft" size="sm" onClick={suggest} disabled={!packPriceOk}>
            <Calculator className="h-4 w-4" />
            Hitung harga jual per {unit} dari harga {packUnit}
          </Button>
        </div>
      )}

      {unitPriceOk && (
        <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
          Beli 1 {unit} = <strong>{formatRupiah(unitPrice)}</strong>, beli 2 {unit} ={' '}
          <strong>{formatRupiah(unitPrice * 2)}</strong>
          {packPriceOk && (
            <>
              . Beli 1 {packUnit} (isi {formatNumber(packSize)}) = <strong>{formatRupiah(packPrice)}</strong>
            </>
          )}
        </p>
      )}

      <div className="rounded-2xl border border-slate-200 p-4">
        <p className="mb-1 text-sm font-semibold">Modal (harga beli)</p>
        <p className="mb-3 text-xs text-slate-500">
          Opsional. Ketik berapa kamu membayar dan dapat berapa {unit}, nanti sistem yang menghitung
          modal dan untung per {unit}. Hanya owner yang bisa melihat modal.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Total harga beli (Rp)"
            inputMode="decimal"
            placeholder="Contoh: 80000"
            error={errors.cost?.message}
            {...register('cost')}
          />
          <Field
            label={`Dapat berapa ${unit}?`}
            inputMode="decimal"
            placeholder={String(defaultQty)}
            hint={
              packSizeOk
                ? `Kosong = 1 ${packUnit} (${formatNumber(packSize)} ${unit})`
                : `Kosong = 1 ${unit}`
            }
            error={errors.cost_qty?.message}
            {...register('cost_qty')}
          />
        </div>

        {costPerUnit !== null && (
          <div
            className={`mt-3 rounded-xl px-4 py-3 text-sm ${
              profitUnit !== null && profitUnit < 0
                ? 'bg-rose-50 text-rose-800'
                : 'bg-emerald-50 text-emerald-800'
            }`}
          >
            <p>
              {formatRupiah(costTotal)} ÷ {formatNumber(costQty)} {unit} ={' '}
              <strong>{formatRupiah(costPerUnit)}</strong> modal per {unit}
            </p>
            {profitUnit !== null && (
              <p>
                Dijual {formatRupiah(unitPrice)} → {profitUnit < 0 ? 'rugi' : 'untung'}{' '}
                <strong>{formatRupiah(Math.abs(profitUnit))}</strong> per {unit}
                {marginUnit !== null && <> (margin {marginUnit}%)</>}
                {profitUnit < 0 && <> — harga jual di bawah modal!</>}
              </p>
            )}
            {profitPack !== null && (
              <p>
                Per {packUnit}: {profitPack < 0 ? 'rugi' : 'untung'}{' '}
                <strong>{formatRupiah(Math.abs(profitPack))}</strong>
              </p>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field
          label={`Stok minimum (${unit})`}
          inputMode="decimal"
          hint="Di bawah ini ditandai hampir habis"
          error={errors.min_stock?.message}
          {...register('min_stock')}
        />
        {!initial && (
          <Field
            label={`Stok awal (${unit})`}
            inputMode="decimal"
            placeholder="0"
            hint="Opsional"
            error={errors.initial_stock?.message}
            {...register('initial_stock')}
          />
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Menyimpan…' : 'Simpan'}
        </Button>
      </div>
    </form>
  )
}
