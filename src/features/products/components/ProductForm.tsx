import { zodResolver } from '@hookform/resolvers/zod'
import { Calculator } from 'lucide-react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/shared/Button'
import { Field } from '@/components/shared/Field'
import { formatRupiah, parseNumber } from '@/lib/format'
import type { Product } from '@/types/models'

import type { ProductInput } from '../api/productsApi'
import { type ProductFormValues, productSchema } from '../schemas/productSchema'

interface ProductFormProps {
  initial?: Product
  submitting: boolean
  onSubmit: (input: ProductInput, initialStock: number) => void
  onCancel: () => void
}

export function ProductForm({ initial, submitting, onSubmit, onCancel }: ProductFormProps) {
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
    },
  })

  const hasPack = watch('has_pack')
  const unit = watch('unit') || 'satuan'
  const packUnit = watch('pack_unit') || 'pak'
  const unitPrice = parseNumber(watch('unit_price') || '')
  const packSize = parseNumber(watch('pack_size') || '')
  const packPrice = parseNumber(watch('pack_price') || '')

  const unitPriceOk = watch('unit_price') !== '' && Number.isFinite(unitPrice)
  const canSuggest = hasPack && packSize > 0 && Number.isFinite(packPrice) && watch('pack_price') !== ''

  function suggest() {
    if (!canSuggest) return
    setValue('unit_price', String(Math.round(packPrice / packSize)), { shouldValidate: true })
  }

  const submit = handleSubmit((v) =>
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
    ),
  )

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
            label={`Harga per ${unit} (Rp)`}
            inputMode="decimal"
            placeholder="1000"
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
            label={`Harga per ${packUnit} (Rp)`}
            inputMode="decimal"
            placeholder="12000"
            error={errors.pack_price?.message}
            {...register('pack_price')}
          />
          <Button variant="soft" size="sm" onClick={suggest} disabled={!canSuggest}>
            <Calculator className="h-4 w-4" />
            Hitung harga per {unit} dari harga {packUnit}
          </Button>
        </div>
      )}

      {unitPriceOk && (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Beli 1 {unit} = <strong>{formatRupiah(unitPrice)}</strong>, beli 2 {unit} ={' '}
          <strong>{formatRupiah(unitPrice * 2)}</strong>
          {hasPack && packSize > 0 && Number.isFinite(packPrice) && watch('pack_price') !== '' && (
            <>
              . Beli 1 {packUnit} (isi {packSize}) = <strong>{formatRupiah(packPrice)}</strong>
            </>
          )}
        </p>
      )}

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
